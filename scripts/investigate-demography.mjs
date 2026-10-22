// Offline observer: census, pedigrees and partner locations never enter decisions.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { performance } from 'node:perf_hooks';

const args=Object.fromEntries(process.argv.slice(2).map(a=>a.replace(/^--/,'').split(/=(.*)/s)));
const root=resolve(args.root??'.');
const load=p=>import(pathToFileURL(resolve(root,'src/sim/'+p+'.js')));
const sourceHash=createHash('sha256');
for(const path of execFileSync('git',['ls-files','-z','src'],{cwd:root,encoding:'utf8'}).split('\0').filter(Boolean)) sourceHash.update(path).update('\0').update(readFileSync(resolve(root,path)));
const sourceFingerprint=sourceHash.digest('hex');
const recorderFingerprint=createHash('sha256').update(readFileSync(new URL(import.meta.url))).digest('hex');
const {createSim}=await load('sim');
const {createRng,deriveSeed}=await load('rng');
const {canSeeCreature}=await load('creatures/visibility');
const {selectDeathCause}=await load('creatures/death');
const species=['square','circle','triangle','octagon'];
const ticks=Number(args.ticks??72000);
const seeds=(args.seeds??'1,2,3,7,19,42,73,101,1337,2026').split(',').map(Number);
const checkpoints=new Set((args.checkpoints??'').split(',').filter(Boolean).map(Number));
const overrides=JSON.parse(args.config??'{}');
assert(Number.isInteger(ticks)&&ticks>0);
assert(seeds.length&&seeds.every(Number.isInteger));
assert([...checkpoints].every(n=>Number.isInteger(n)&&n>0&&n<ticks&&n%60===0));
assert(overrides&&typeof overrides==='object'&&!Array.isArray(overrides));
if(args.ages!==undefined)assert(Number.isFinite(Number(args.ages))&&Number(args.ages)>=0&&Number(args.ages)<1);
const revision=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();

for(const seed of seeds){
  const sim=createSim({...overrides,seed}),cfg=sim.config,state=sim.state;
  assert(Number.isFinite(cfg.ticksPerSecond)&&cfg.ticksPerSecond>0);
  assert(cfg.creatureSexEnabled!==false,'This demographic recorder requires the sexual model');
  if(args.ages){
    const rng=createRng(deriveSeed(seed,'demography-founder-age'));
    for(const c of state.creatures)c.ageTicks=Math.floor(rng.nextFloat()*c.maxAgeTicks*Number(args.ages));
  }
  const initial=state.creatures.length;
  const records=new Map(),live=new Map(),trajectory=[];
  const add=c=>{
    const r={id:c.id,species:c.species,sex:c.sex,generation:c.generation,
      birth:state.tick-c.ageTicks,parents:c.lineage?.parents??[],
      maturityAge:cfg.creatureReproductionMinAge*cfg.ticksPerSecond/c.maturityScale,
      maxAge:c.maxAgeTicks,genome:c.genome,birthplace:{...c.position},
      maturityTick:null,death:null,conceptions:0,children:0,matureChildren:0,
      samples:{alive:0,mature:0,reserves:0,ready:0,partner:0,nearby:0,visible:0,mating:0,pregnant:0},
      distanceSum:0,distanceSamples:0,maxDisplacement:0};
    records.set(c.id,r);live.set(c.id,c);
    for(const id of r.parents)if(records.has(id))records.get(id).children++;
    return r;
  };
  for(const c of state.creatures)add(c);
  const ready=c=>c.ageTicks*c.maturityScale>=cfg.creatureReproductionMinAge*cfg.ticksPerSecond&&
    c.meters.energy>=cfg.creatureBaseEnergy*cfg.creatureReproductionMinEnergyRatio&&
    c.meters.water>=cfg.creatureBaseWater*cfg.creatureReproductionMinWaterRatio&&
    c.meters.hp>0&&c.reproduction.cooldownTicks<=0&&!c.reproduction.pregnancy?.isPregnant;
  const sample=()=>{
    const counts=Object.fromEntries(species.map(s=>[s,{n:0,male:0,female:0,matureMale:0,matureFemale:0,readyMale:0,readyFemale:0,pregnant:0}]));
    for(const c of state.creatures){
      const r=records.get(c.id),a=r.samples,n=counts[c.species];
      n.n++;n[c.sex]++;a.alive++;
      if(c.reproduction.pregnancy?.isPregnant){a.pregnant++;n.pregnant++;}
      const mature=c.ageTicks>=r.maturityAge;
      if(mature){a.mature++;n[c.sex==='male'?'matureMale':'matureFemale']++;}
      if(mature&&c.meters.energy>=cfg.creatureBaseEnergy*cfg.creatureReproductionMinEnergyRatio&&c.meters.water>=cfg.creatureBaseWater*cfg.creatureReproductionMinWaterRatio)a.reserves++;
      if(!ready(c))continue;
      a.ready++;n[c.sex==='male'?'readyMale':'readyFemale']++;
      if(c.intent.type==='mate')a.mating++;
      const mates=state.creatures.filter(d=>d.species===c.species&&d.sex!==c.sex&&ready(d));
      if(!mates.length)continue;
      a.partner++;
      let distance=Infinity,visible=false;
      for(const d of mates){
        distance=Math.min(distance,Math.hypot(c.position.x-d.position.x,c.position.y-d.position.y));
        if(canSeeCreature(c,d,state.world,cfg,cfg.creatureMateSeekRange))visible=true;
      }
      r.distanceSum+=distance;r.distanceSamples++;
      if(distance<=cfg.creatureMateSeekRange)a.nearby++;
      if(visible)a.visible++;
    }
    if(state.tick%600===0||state.tick===ticks||checkpoints.has(state.tick))trajectory.push({
      tick:state.tick,counts,births:{...state.metrics.birthsBySpeciesTotal},deaths:{...state.metrics.deathsBySpeciesTotal}});
  };
  sample();
  const start=performance.now();
  const emit=()=>console.log(JSON.stringify({revision,sourceFingerprint,recorderFingerprint,root,seed,
    ticks:state.tick,requestedTicks:ticks,overrides,ages:args.ages??0,samplingTicks:60,
    milliseconds:performance.now()-start,config:cfg,trajectory,records:[...records.values()],metrics:state.metrics,
    hash:createHash('sha256').update(JSON.stringify({creatures:state.creatures,summary:sim.getSummary()})).digest('hex')}));
  for(let t=0;t<ticks;t++){
    const pregnant=new Map([...live].map(([id,c])=>[id,!!c.reproduction.pregnancy?.isPregnant]));
    sim.tick();
    const ids=new Set();
    const transition=(c,r)=>{
      if(r.maturityTick===null&&c.ageTicks>=r.maturityAge){
        r.maturityTick=state.tick;
        for(const id of r.parents)if(records.has(id))records.get(id).matureChildren++;
      }
      if(!pregnant.get(c.id)&&c.reproduction.pregnancy?.isPregnant){
        r.conceptions++;
        const father=records.get(c.reproduction.pregnancy.fatherId);
        if(father)father.conceptions++;
      }
    };
    for(const c of state.creatures){
      ids.add(c.id);const r=records.get(c.id)??add(c);
      transition(c,r);
      r.maxDisplacement=Math.max(r.maxDisplacement,Math.hypot(c.position.x-r.birthplace.x,c.position.y-r.birthplace.y));
    }
    for(const [id,c]of live)if(!ids.has(id)){
      const r=records.get(id);transition(c,r);
      r.death={tick:state.tick,age:c.ageTicks,cause:c.deathCause??selectDeathCause({creature:c,maxAgeTicks:c.maxAgeTicks}),
        meters:{...c.meters},pregnant:!!c.reproduction.pregnancy?.isPregnant};
      live.delete(id);
    }
    assert.equal(records.size,initial+state.metrics.birthsTotal,'Observer missed a same-tick birth/removal');
    assert.equal(state.creatures.length,initial+state.metrics.birthsTotal-state.metrics.deathsTotal);
    if(state.tick%60===0||state.tick===ticks)sample();
    if(checkpoints.has(state.tick))emit();
    if(state.tick%36000===0)console.error(JSON.stringify({seed,tick:state.tick,population:state.creatures.length}));
  }
  emit();
}
