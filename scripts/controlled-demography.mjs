// Stationary life-history assay, not a field carrying-capacity experiment.
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
const root=resolve(process.argv[2]??'.');
const load=p=>import(pathToFileURL(resolve(root,'src/sim/'+p+'.js')));
const {createSim}=await load('sim');
const {createRng,deriveSeed}=await load('rng');
const {createWorldGrid}=await load('world-grid');
const {updateCreatureLifeStages}=await load('creatures/index');
const {updateCreatureReproduction}=await load('creatures/reproduction');
const {updateCreatureBasalMetabolism}=await load('creatures/metabolism');
const {applyCreatureDeaths}=await load('creatures/death');
const {createDefaultMetrics}=await load('metrics-factory');
const seeds=[1,2,3,7,19,42,73,101,1337,2026];
for(const seed of seeds)for(const kind of ['square','circle','triangle','octagon'])
for(const mode of ['pair','four','twelve','same-sex','separated','limited','mixed-ages']){
  const count=mode==='twelve'?12:mode==='four'?4:2;
  const sim=createSim({seed,creatureCount:24,creaturePredatorCount:['triangle','octagon'].includes(kind)?24:0,
    worldWidth:20,worldHeight:20,colourCamouflageEnabled:false});
  const config=sim.config,metrics=createDefaultMetrics(),rng=createRng(seed),ages=createRng(deriveSeed(seed,'assay-age'));
  const world=createWorldGrid({width:100,height:20,defaultTerrain:'plains'});
  const creatures=sim.state.creatures.filter(c=>c.species===kind).slice(0,count);
  const all=new Map(),history=[];
  for(const [i,c]of creatures.entries()){
    c.position={x:mode==='separated'?5+i*40:5,y:5};
    if(mode==='same-sex')c.sex='female';
    if(mode==='mixed-ages')c.ageTicks=Math.floor(ages.nextFloat()*c.maxAgeTicks*0.65);
    all.set(c.id,{c,born:-c.ageTicks,mature:false,children:0,matureChildren:0,death:null});
  }
  let maxGeneration=0;
  const ticks=72000;
  for(let tick=1;tick<=ticks;tick++){
    const options={creatures,config,metrics,world,rng};
    if(mode!=='limited')for(const c of creatures)c.meters.energy=c.meters.water=1;
    updateCreatureBasalMetabolism(options);updateCreatureLifeStages(options);
    updateCreatureReproduction(options);applyCreatureDeaths(options);
    const ids=new Set(creatures.map(c=>c.id));
    for(const c of creatures){
      if(!all.has(c.id)){
        all.set(c.id,{c,born:tick,mature:false,children:0,matureChildren:0,death:null});
        for(const p of c.lineage.parents)if(all.has(p))all.get(p).children++;
      }
      const r=all.get(c.id);
      if(!r.mature&&c.ageTicks*c.maturityScale>=config.creatureReproductionMinAge*60){
        r.mature=true;
        for(const p of c.lineage?.parents??[])if(all.has(p))all.get(p).matureChildren++;
      }
      maxGeneration=Math.max(maxGeneration,c.generation);
    }
    for(const[id,r]of all)if(!r.death&&!ids.has(id))r.death={tick,cause:r.c.deathCause};
    assert.equal(creatures.length,count+metrics.birthsTotal-metrics.deathsTotal);
    if(tick%3600===0)history.push({tick,n:creatures.length,births:metrics.birthsTotal});
  }
  const founders=[...all.values()].filter(r=>r.c.generation===0);
  console.log(JSON.stringify({root,seed,kind,mode,count,ticks,n:creatures.length,births:metrics.birthsTotal,
    deaths:metrics.deathsByCause,maxGeneration,founderChildren:founders.map(r=>r.children),
    founderMatureChildren:founders.map(r=>r.matureChildren),newborns:all.size-count,
    matureNewborns:[...all.values()].filter(r=>r.c.generation>0&&r.mature).length,
    censoredImmature:[...all.values()].filter(r=>r.c.generation>0&&!r.death&&!r.mature).length,history}));
}
