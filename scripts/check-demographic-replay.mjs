import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
const roots=process.argv.slice(2);
assert.equal(roots.length,2,'Supply newborn-only candidate and final roots');
const factories=await Promise.all(roots.map(async root=>(await import(pathToFileURL(resolve(root,'src/sim/sim.js')))).createSim));
const normalize=state=>JSON.parse(JSON.stringify(state,(key,value)=>{
  if(key.startsWith('matingAttempts')||key.startsWith('matingFailures'))return undefined;
  if(value instanceof Map)return {mapEntries:[...value]};
  if(value instanceof Set)return {setEntries:[...value]};
  return value;
}));
for(const seed of [1,42,1337]){
  const sims=factories.map(createSim=>createSim({seed,worldWidth:20,worldHeight:20,creatureCount:8,creaturePredatorCount:4,
    creatureReproductionMinAge:3,creatureGestationTime:2,creatureReproductionCooldown:8,colourCamouflageEnabled:false}));
  for(let tick=0;tick<1200;tick++){
    for(const sim of sims){
      const p=sim.state.creatures[0]?.position;
      for(const c of sim.state.creatures){c.meters.energy=c.meters.water=1;if(p)c.position={...p};}
      sim.tick();
    }
    if(tick%60===0)assert.deepEqual(normalize(sims[0].state),normalize(sims[1].state));
  }
  assert.deepEqual(normalize(sims[0].state),normalize(sims[1].state));
  assert(sims[1].state.metrics.birthsTotal>0);
  console.log(JSON.stringify({seed,ticks:1200,births:sims[1].state.metrics.birthsTotal,
    attempts:sims[1].state.metrics.matingAttemptsTotal,failures:sims[1].state.metrics.matingFailuresTotal,
    hash:createHash('sha256').update(JSON.stringify(normalize(sims[1].state))).digest('hex')}));
}
