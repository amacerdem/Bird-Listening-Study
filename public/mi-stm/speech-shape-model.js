// Parametric phonetic drawing, not an STFT, bank waveform or MI inversion.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const BASE=[
  {label:'/pɑ/',kind:'stop',duration:.31,gap:.10,consonant:.047,formants:[680,1120,2550]},
  {label:'/si/',kind:'fricative',duration:.29,gap:.15,consonant:.105,formants:[300,2240,3040]},
  {label:'/ku/',kind:'stop',duration:.25,gap:.07,consonant:.044,formants:[350,850,2380]},
  {label:'/tɛ/',kind:'stop',duration:.35,gap:.14,consonant:.038,formants:[540,1890,2850]},
  {label:'/ʃa/',kind:'fricative',duration:.25,gap:.06,consonant:.10,formants:[710,1250,2600]},
  {label:'/mi/',kind:'nasal',duration:.33,gap:0,consonant:.05,formants:[330,2150,2990]}
];
const DURATION_CHANGE=[.62,-.46,.42,-.35,.55,-.30],GAP_CHANGE=[-.65,.90,-.40,.75,.35,0];
// Illustrative, independent resonance changes; never a common pitch shift.
const FORMANT_CHANGE=[[90,-140,190],[-40,180,-150],[55,-110,210],[-75,160,-180],[70,-150,170],[-45,140,-130]];
const frameCache=new WeakMap();
const noiseCache=new WeakMap();
export function speechShape(x=0,y=0,referenceF0=145,tolerance=3){
  x=clamp(x,0,1);y=clamp(y,0,1);tolerance=clamp(tolerance,.1,12);
  const weights=BASE.map((b,i)=>({duration:b.duration*(1+y*DURATION_CHANGE[i]),gap:b.gap*(1+y*GAP_CHANGE[i])}));
  // Fixed utterance span: Y redistributes individual durations and pauses.
  const scale=2.64/weights.reduce((s,w)=>s+w.duration+w.gap,0);let start=.12;
  const events=BASE.map((b,i)=>{
    const duration=weights[i].duration*scale,consonant=Math.min(duration*.43,b.consonant*(1+.32*y*Math.cos(i*1.8)));
    const event={...b,index:i,start,duration,consonant,voiceStart:start+(b.kind==='nasal'?.01:consonant),end:start+duration};
    start+=duration+weights[i].gap*scale;return event;
  });
  const shape={x,y,referenceF0,tolerance,events,extent:3,maxHz:6000,duration:2.76};
  // This source–filter demonstration isolates spectral-envelope changes at
  // constant F0. The tolerance remains a bank-selection setting, not pitch input.
  shape.minF0=referenceF0;shape.maxF0=referenceF0;return shape;
}
export function f0At(shape,event,u){
  return shape.referenceF0;
}
export function formantsAt(shape,event,u){
  const transition=Math.exp(-u*6),offset=[110,-210,160];
  return event.formants.map((f,i)=>f
    +offset[i]*transition*(event.index%2?1:-1)
    +shape.x*FORMANT_CHANGE[event.index][i]*(.8+.2*Math.sin(Math.PI*u)));
}
export function harmonicAmplitudes(shape,event,u){
  let cache=frameCache.get(shape);
  if(!cache){cache=new Map();frameCache.set(shape,cache);}
  const key=`${event.index}:${u}`;
  if(cache.has(key))return cache.get(key);
  const x=shape.x,formants=formantsAt(shape,event,u);
  const widths=[105*(1-.25*x),155*(1+.38*x),225*(1-.2*x)];
  const gains=[1.35*(1-.72*x),.80*(1+1.25*x),.60*(1+.75*x)];
  const amplitudes=Array.from({length:Math.floor(shape.maxHz/shape.referenceF0)},(_,i)=>{
    const h=i+1,f=h*shape.referenceF0;
    let envelope=.045;
    formants.forEach((center,j)=>{envelope+=gains[j]*Math.exp(-.5*((f-center)/widths[j])**2);});
    // Deterministic partial-specific emphasis: irregular amplitudes, not
    // inharmonic frequencies. X is an illustrative path, not a descriptor inverse.
    const partialGain=Math.exp(.65*x*Math.sin(h*1.37+event.index*1.2));
    return envelope*Math.exp(-.043*h)*partialGain;
  });
  const norm=Math.hypot(...amplitudes);
  const temporalEnvelope=Math.sin(Math.PI*clamp(u,0,1))**.26;
  // Equal sum of squared amplitudes at each voiced phase across X. Changes
  // redistribute harmonic energy instead of making the whole stack louder.
  const result=Object.freeze(amplitudes.map(a=>.96*temporalEnvelope*a/norm));
  cache.set(key,result);return result;
}
export function harmonicWeight(shape,event,u,h){
  return harmonicAmplitudes(shape,event,u)[h-1]??0;
}
export function aperiodicSpectrum(shape,event){
  let cache=noiseCache.get(shape);
  if(!cache){cache=new Map();noiseCache.set(shape,cache);}
  if(cache.has(event.index))return cache.get(event.index);
  const bins=120,step=shape.maxHz/bins,x=shape.x;
  const gaussian=(f,center,width)=>Math.exp(-.5*((f-center)/width)**2);
  const amplitude=Array.from({length:bins},(_,i)=>{
    const f=(i+.5)*step;let before=0,after=0;
    // Broad illustrative spectra, not harmonic partials. /s, ʃ/ friction and
    // /p, k, t/ release bursts have distinct spectral envelopes.
    switch(event.index){
      case 0: before=.65*Math.exp(-f/1800)+.35*gaussian(f,1000,900);after=.4*Math.exp(-f/2600)+.6*gaussian(f,1550,1000);break;
      case 1: before=gaussian(f,5100,700)+.15*gaussian(f,3400,1100);after=.8*gaussian(f,4200,1050)+.3*gaussian(f,5600,550);break;
      case 2: before=gaussian(f,2300,700)+.15*gaussian(f,4600,1200);after=.85*gaussian(f,3000,550)+.35*gaussian(f,1600,1000);break;
      case 3: before=.85*gaussian(f,4600,1400)+.12;after=gaussian(f,5000,800)+.35*gaussian(f,2800,1300);break;
      case 4: before=gaussian(f,2900,950)+.15*gaussian(f,4700,1100);after=.85*gaussian(f,3650,650)+.4*gaussian(f,2100,1200);break;
      default: return 0;
    }
    const ripple=Math.exp(.22*x*Math.sin(f/310+event.index));
    return ((1-x)*before+x*after)*ripple;
  });
  const norm=Math.hypot(...amplitude)||1;
  const result=Object.freeze({step,amplitudes:Object.freeze(amplitude.map(a=>a/norm))});
  cache.set(event.index,result);return result;
}
