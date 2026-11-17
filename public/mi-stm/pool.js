// Deterministic interface fixtures only: no ElevenLabs audio or MI measurements.
export function illustrativePool(){
  const candidates=[];let seed=18743;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const ref={id:'F01',label:'Illustrative familiar reference',x:.18,y:.22,f0:{p10:122,median:145,p90:174}};
  for(let j=0;j<32;j++)for(let i=0;i<32;i++){
    const x=Math.max(0,Math.min(1,(i+(i===0||i===31?0:(rand()-.5)*.9))/31));
    const y=Math.max(0,Math.min(1,(j+(j===0||j===31?0:(rand()-.5)*.9))/31));
    const f=85*Math.pow(3.6,rand());
    candidates.push({id:'M'+String(candidates.length+1).padStart(4,'0'),x,y,voice_family:'V'+String(1+(candidates.length%32)).padStart(2,'0'),text_id:'DEMO-SENTENCE-01',status:'schematic',audio_url:null,f0:{p10:f*.84,median:f,p90:f*1.21},labels:{F01:{x:Math.abs(x-ref.x)/.82,y:Math.abs(y-ref.y)/.78}}});
  }
  return {schema_version:'1.1',status:'schematic',reference:ref,reference_id:ref.id,reference_label:ref.label,distance_definition:'Schematic normalized bank coordinates and reference-relative distances. No MI run. Personal fixture labels use absolute component differences; real labels must be computed from full descriptors.',candidates};
}
export const semitoneDifference=(a,b)=>12*Math.log2(a/b);
// Proposed gate: all three voiced-F0 distribution summaries must fit the tolerance.
// This is an interface policy, not a validated clinical cutoff or a sex classifier.
export function f0Match(candidate,reference,tolerance=3){
  if(!candidate?.f0||!reference?.f0)return {eligible:false,maxDeviation:null};
  const deltas=['p10','median','p90'].map(k=>Math.abs(semitoneDifference(candidate.f0[k],reference.f0[k])));
  const maxDeviation=Math.max(...deltas);
  return {eligible:Number.isFinite(maxDeviation)&&maxDeviation<=tolerance,maxDeviation};
}
export function projectPool(bank,mode='bank',tolerance=3){
  const candidates=bank.candidates.map(p=>{
    const label=p.labels?.[bank.reference_id];const gate=f0Match(p,bank.reference,tolerance);
    return {...p,...(mode==='personal'&&label?label:{}),eligible:gate.eligible,f0Deviation:gate.maxDeviation,labelAvailable:!!label};
  }).filter(p=>mode==='bank'||(p.eligible&&p.labelAvailable));
  return {...bank,candidates,mode,totalCount:bank.candidates.length};
}
export function nearestAnchor(pool,x,y){let best=null,error=Infinity;for(const p of pool.candidates){const d=Math.hypot(p.x-x,p.y-y);if(d<error){best=p;error=d;}}return {anchor:best,error};}
export function validatePool(value){
  if(value?.schema_version!=='1.1')throw new Error('Use schema_version "1.1".');
  if(typeof value.distance_definition!=='string'||!value.distance_definition.trim())throw new Error('A distance_definition is required.');
  const normalized=p=>[p?.x,p?.y].every(v=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=1);
  const validF0=f=>f&&['p10','median','p90'].every(k=>typeof f[k]==='number'&&Number.isFinite(f[k])&&f[k]>0)&&f.p10<=f.median&&f.median<=f.p90;
  if(typeof value.reference?.id!=='string'||!normalized(value.reference)||!validF0(value.reference.f0))throw new Error('Provide reference.id, normalized x/y and ordered positive F0 p10/median/p90 in Hz.');
  if(!Array.isArray(value.candidates)||value.candidates.length<2||value.candidates.length>20000)throw new Error('Provide 2–20,000 candidate anchors.');
  const ids=new Set();
  const candidates=value.candidates.map(p=>{
    if(typeof p.id!=='string'||!p.id||ids.has(p.id))throw new Error('Every candidate needs a unique string id.');ids.add(p.id);
    if(!normalized(p))throw new Error('Candidate x/y must be finite normalized coordinates between 0 and 1.');
    if(typeof p.text_id!=='string'||!p.text_id)throw new Error('Each anchor needs text_id for content matching.');
    if(p.f0&&!validF0(p.f0))throw new Error('F0 summaries must be ordered, positive and in Hz.');
    const label=p.labels?.[value.reference.id];if(label&&!normalized(label))throw new Error('Reference-relative labels must have normalized x/y.');
    if(p.audio_url&&(typeof p.audio_url!=='string'||!/^\.?\//.test(p.audio_url)||p.audio_url.startsWith('//')||p.audio_url.includes('..')||p.audio_url.includes('\\')||p.audio_url.includes('%')))throw new Error('Use a local /audio/file.wav or ./audio/file.wav path.');
    return {...p,status:'imported'};
  });
  if(new Set(candidates.map(p=>p.text_id)).size!==1)throw new Error('Import one matched-content slice at a time (one text_id).');
  return {...value,candidates,reference_id:value.reference.id,status:'imported'};
}
