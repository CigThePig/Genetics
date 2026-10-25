// Genetics hybrid compiler. Upstream builders and motor are unmodified in vendor/Core.
using System;
using System.IO;
using System.Linq;
using System.Collections.Generic;
using System.Text.Json;
using PixelCreatures.Core;
using PixelCreatures.Core.Anatomy;
using PixelCreatures.Core.Genetics;
using PixelCreatures.Core.Motion;
using PixelCreatures.Core.Rendering;
using PixelCreatures.Core.Export;

public static class Program
{
    static double R(double x) => Math.Round(x, 3);
    static void V(List<double> a, Vec3 v) { a.Add(R(v.X)); a.Add(R(v.Y)); a.Add(R(v.Z)); }
    static CreatureGenome Genome(CreatureRegistry reg, string species, double morph)
    {
        bool reptile = species == "octagon";
        var family = reg.GetFamily(reptile ? "reptile" : "quadruped");
        var g = CreatureGenome.CreateDefault(family.Schema, CreatureFramework.GeneratorVersion, 42);
        g = g.WithChoice("form", reptile ? "lizard" : species == "square" ? "rodent" : species == "circle" ? "bovine" : "canine");
        g = g.With("size", .35).With("torso.length", (species == "square" ? .10 : species == "triangle" ? .58 : .40) + (species == "square" ? .06 : .25) * morph).With("legs.length", (reptile ? .20 : species == "circle" ? .62 : species == "square" ? .18 : .48) + .14 * morph);
        g = g.With("mass", species == "square" ? .72 : species == "circle" ? .65 : reptile ? .43 : .28);
        g = g.With("head.size", species == "square" ? .62 : .46).With("head.snout", species == "square" ? .22 : species == "triangle" ? .75 : .55);
        g = g.With("tail.length", species == "square" ? .06 : species == "circle" ? .27 : reptile ? .9 : .65);
        g = g.With("tail.thickness", reptile ? .55 : species == "triangle" ? .52 : .3).With("neck.length", species == "circle" ? .42 : .22);
        if (!reptile)
        {
            g = g.With("head.round", species == "square" ? .9 : species == "triangle" ? .24 : .45)
                .WithChoice("tail.tip", species == "triangle" ? "fluffy" : "plain")
                .WithChoice("head.ears", species == "square" ? "round" : species == "circle" ? "long" : "pointed")
                .WithChoice("head.horns", species == "circle" ? "short" : "none")
                .With("head.hornSize", .48).With("head.earSize", species == "square" ? .72 : species == "triangle" ? .8 : .62)
                .WithChoice("back.feature", "none").WithChoice("head.teeth", "none")
                .WithChoice("legs.stance", species == "circle" ? "unguligrade" : species == "square" ? "plantigrade" : "digitigrade")
                .With("legs.claws", 0).With("head.eyeForward", species == "triangle" ? .8 : .3);
        }
        else g = g.WithChoice("back.feature", "none").WithChoice("head.crest", "none").WithChoice("head.horns", "none")
            .WithChoice("head.teeth", "none").WithChoice("wings.kind", "none");
        return g;
    }
    static object Bake(CreatureRegistry reg, string species, double morph)
    {
        var model = new CreatureFactory(reg).Build(Genome(reg, species, morph));
        var a = model.Anatomy;
        // Feeding is a head/jaw action; do not reuse grazer horn-slams or rodent roars.
        a.Rig.Action = ActionStyle.Bite;
        var parts = a.Primitives.Select(p => new[] { (int)p.Kind, p.Group, (int)p.Material, (int)p.Domain, (int)p.Flags }).ToList();
        foreach (var f in a.Features) parts.Add(new[] { 3, f.Group, (int)f.Material, 0, (int)f.Kind });
        var clips = new Dictionary<string, object>();
        double radius = 0;
        foreach (string state in new[] { "idle", "walk", "run", "action", "rest", "hit" })
        {
            var motor = new CreatureMotor(model, reg, new MotorOptions { Facing = FacingMode.Free, ExportMode = true, ExportLoop = 2 });
            motor.Teleport(Vec3.Zero, 0); motor.FacingOverride = 0;
            double speed = state == "walk" ? model.Motion.WalkSpeed : state == "run" ? model.Motion.RunSpeed : 0;
            motor.DesiredVelocity = new Vec3(speed, 0, 0);
            for (int i = 0; i < 120; i++) motor.Step(1.0 / 60);
            if (state == "rest") { motor.SnapRest(true); motor.Resting = true; }
            if (state == "action") motor.TriggerAction();
            if (state == "hit") motor.TriggerHit(new Vec3(1, 0, 0), .65);
            int n = state == "idle" || state == "rest" ? 12 : 8;
            double duration = speed > 0 ? 1.0 / Math.Max(.2, motor.CycleFrequency) : state == "idle" || state == "rest" ? 2 : .8;
            int steps = Math.Max(1, (int)Math.Round(duration * 60 / n));
            if (speed > 0) { motor.Context.CycleFrequencyOverride = 60.0 / (steps * n); for (int i = 0; i < steps * n * 3; i++) motor.Step(1.0 / 60); }
            var frames = new List<double[]>();
            for (int f = 0; f < n; f++)
            {
                var flat = new List<double>();
                var pose = motor.Pose.Skeleton;
                foreach (var p in a.Primitives)
                {
                    var d = new List<double>();
                    Xform A = pose.World[p.BoneA];
                    V(d, A.Point(p.LocalA));
                    if (p.Kind == PrimKind.Ellipsoid)
                    {
                        var basis = A.Basis * Mat3.FromQuat(p.LocalRotation);
                        V(d, basis.C0 * p.Radii.X); V(d, basis.C1 * p.Radii.Y); V(d, basis.C2 * p.Radii.Z);
                    }
                    else
                    {
                        V(d, pose.World[p.BoneB].Point(p.LocalB));
                        if (p.Kind == PrimKind.Triangle) V(d, pose.World[p.BoneC].Point(p.LocalC));
                        else { d.Add(R(p.RadiusA)); d.Add(R(p.RadiusB)); }
                    }
                    double len(int offset) => Math.Sqrt(d[offset]*d[offset]+d[offset+1]*d[offset+1]+d[offset+2]*d[offset+2]);
                    if (p.Kind == PrimKind.Ellipsoid) radius = Math.Max(radius, len(0) + Math.Sqrt(d.Skip(3).Sum(v=>v*v)));
                    else if (p.Kind == PrimKind.RoundCone) radius = Math.Max(radius, Math.Max(len(0)+p.RadiusA,len(3)+p.RadiusB));
                    else radius = Math.Max(radius, Math.Max(len(0),Math.Max(len(3),len(6))));
                    while (d.Count < 12) d.Add(0);
                    flat.AddRange(d);
                }
                foreach (var feature in a.Features)
                {
                    var d = new List<double>(); var xf = pose.World[feature.Bone];
                    V(d, xf.Point(feature.LocalPosition)); V(d, xf.Dir(feature.LocalNormal));
                    d.Add(R(feature.Size)); d.Add(R(motor.Pose.Expression.EyeOpen));
                    radius = Math.Max(radius, xf.Point(feature.LocalPosition).Length + feature.Size);
                    while (d.Count < 12) d.Add(0); flat.AddRange(d);
                }
                frames.Add(flat.ToArray());
                for (int i = 0; i < steps; i++) motor.Step(1.0 / 60);
            }
            clips[state] = new { duration = R(steps * n / 60.0), rootSpeed = R(speed), frames };
        }
        // Preserve original rasterizer output for a direct, reproducible reference image.
        var refMotor = new CreatureMotor(model, reg);
        var canvas = a.Canvas; var frame = new PixelFrame(canvas.Width, canvas.Height) { OriginX = canvas.OriginX, OriginY = canvas.OriginY };
        new CreatureRenderer().Render(a, model.Palette, model.Surface, refMotor.Pose, ViewSpec.Default(0), frame);
        var rgba = new byte[frame.Width * frame.Height * 4]; var lut = new byte[1024]; model.Palette.BuildLut(lut, 0); frame.ToRgba(lut, rgba, model.Palette.WaterTint);
        Directory.CreateDirectory("tools/creature-baker/generated");
        File.WriteAllBytes($"tools/creature-baker/generated/{species}-{morph}.png", PngEncoder.Encode(rgba, frame.Width, frame.Height));
        return new { parts, clips, bodyLength = R(a.Metrics.BodyLength), radius = R(radius), family = a.FamilyId };
    }
    public static void Main(string[] args)
    {
        var reg = CreatureRegistry.CreateDefault(); var models = new Dictionary<string, object>();
        foreach (string s in new[] { "square", "circle", "triangle", "octagon" })
        {
            Console.WriteLine("Baking " + s); models[s] = new[] { Bake(reg, s, 0), Bake(reg, s, 1) };
        }
        File.WriteAllText(args.Length > 0 ? args[0] : "src/render/creatures/anatomy.js", "export default " + JsonSerializer.Serialize(new { version = 1, upstream = "a2207c4bd6f1be51d426684cf58f11668def7579", models }) + ";\n");
    }
}
