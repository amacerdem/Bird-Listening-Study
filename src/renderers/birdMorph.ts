export type MorphCoordinates={pitch:number;timing:number;timbre:number};
export type BirdEvent={start:number;end:number;targetStart:number;midi:number;trackTimes:number[];frequency:number[];rms:number[]};
export type BirdAsset={sampleRate:number;duration:number;sourceStart:number;sourceEnd:number;sourcePcm:string;quadrature:string;events:BirdEvent[];credit:string;sourceUrl:string;license:string;recordingSha256:string};
export type BirdDecoded={asset:BirdAsset;original:Float32Array;imaginary:Float32Array};
export const noteName=(m:number)=>['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'][m%12]+(Math.floor(m/12)-1);
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
const bytes=(s:string)=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
export function decodeBird(asset:BirdAsset):BirdDecoded{
 const pcm=new DataView(bytes(asset.sourcePcm).buffer),quad=new DataView(bytes(asset.quadrature).buffer),original=new Float32Array(pcm.byteLength/2),imaginary=new Float32Array(quad.byteLength/4);
 for(let i=0;i<original.length;i++){original[i]=pcm.getInt16(i*2,true)/32768;imaginary[i]=quad.getFloat32(i*4,true)}
 return {asset,original,imaginary};
}
export function routeCoordinates(p:number,route:string):MorphCoordinates{
 p=clamp(p);if(route==='joint')return {pitch:p,timing:p,timbre:p};
 const first=clamp(p*3),second=clamp(p*3-1),third=clamp(p*3-2);
 return route==='pitch'?{pitch:first,timing:second,timbre:third}:{pitch:second,timing:first,timbre:third};
}
export const targetHz=(event:BirdEvent)=>440*2**((event.midi-69)/12);
function interpolate(times:number[],values:number[],t:number,index:number){
 while(index<times.length-2&&times[index+1]<t)index++;
 const v=clamp((t-times[index])/Math.max(1e-9,times[index+1]-times[index]));
 return {index,value:values[index]+v*(values[Math.min(index+1,values.length-1)]-values[index])};
}
export function renderBirdMorph(decoded:BirdDecoded,settings:MorphCoordinates):Float32Array{
 const {asset,original,imaginary}=decoded,p=clamp(settings.pitch),y=clamp(settings.timing),z=clamp(settings.timbre),sr=asset.sampleRate;
 if(p===0&&y===0&&z===0)return original.slice();
 // The three controls define operations, not independent perceptual dimensions.
 const out=Float32Array.from(original,v=>v*(1-z));
 for(const e of asset.events){
  const begin=Math.round(e.start*sr),n=Math.round((e.end-e.start)*sr),destination=begin+y*(Math.round(e.targetStart*sr)-begin),segment=new Float32Array(n);
  let deltaPhase=0,phase=Math.atan2(imaginary[begin],original[begin]),idx=0,energy=0,targetEnergy=0;
  for(let j=0;j<n;j++){
   const t=j/sr,tracked=interpolate(e.trackTimes,e.frequency,t,idx);idx=tracked.index;
   const f=tracked.value,mapped=f*2**(p*Math.log2(targetHz(e)/f));
   deltaPhase+=2*Math.PI*(mapped-f)/sr;phase+=2*Math.PI*mapped/sr;
   const translated=original[begin+j]*Math.cos(deltaPhase)-imaginary[begin+j]*Math.sin(deltaPhase);
   const rms=interpolate(e.trackTimes,e.rms,t,idx).value;
   // Fade upper partials before Nyquist so high bird notes do not alias.
   const band=(frequency:number)=>.5+.5*Math.cos(Math.PI*clamp((frequency/sr-.44)/.05));
   const a1=band(mapped),a2=.17*band(2*mapped),a3=.05*band(3*mapped);
   const tone=Math.SQRT2*rms*(a1*Math.sin(phase)+a2*Math.sin(2*phase)+a3*Math.sin(3*phase))/Math.sqrt(Math.max(1e-9,a1*a1+a2*a2+a3*a3));
   segment[j]=(1-z)*translated+z*tone;energy+=original[begin+j]**2;targetEnergy+=segment[j]**2;
  }
  // Event energy matching reduces an obvious level confound; it is not loudness matching.
  const gain=Math.min(3,Math.sqrt(energy/Math.max(1e-12,targetEnergy)));
  for(let j=0;j<n;j++){
   const taper=Math.min(1,j/(.005*sr),(n-1-j)/(.005*sr)),window=.5-.5*Math.cos(Math.PI*Math.max(0,taper));
   out[begin+j]-=original[begin+j]*(1-z)*window;
   const at=destination+j,lo=Math.floor(at),fraction=at-lo,value=segment[j]*gain*window;
   if(lo>=0&&lo<out.length)out[lo]+=value*(1-fraction);
   if(lo+1>=0&&lo+1<out.length)out[lo+1]+=value*fraction;
  }
 }
 return out;
}
export function wavBlob(samples:Float32Array,sr:number){
 const buffer=new ArrayBuffer(44+samples.length*2),d=new DataView(buffer),text=(at:number,s:string)=>{for(let i=0;i<s.length;i++)d.setUint8(at+i,s.charCodeAt(i))};
 text(0,'RIFF');d.setUint32(4,36+samples.length*2,true);text(8,'WAVE');text(12,'fmt ');d.setUint32(16,16,true);d.setUint16(20,1,true);d.setUint16(22,1,true);d.setUint32(24,sr,true);d.setUint32(28,sr*2,true);d.setUint16(32,2,true);d.setUint16(34,16,true);text(36,'data');d.setUint32(40,samples.length*2,true);
 for(let i=0;i<samples.length;i++)d.setInt16(44+2*i,Math.round(Math.max(-1,Math.min(1,samples[i]))*32767),true);
 return new Blob([buffer],{type:'audio/wav'});
}
export function midiBlob(asset:BirdAsset){
 const ticks=960,events:{t:number;bytes:number[]}[]=[];
 for(const e of asset.events){events.push({t:Math.round(e.targetStart*ticks),bytes:[0x90,e.midi,80]},{t:Math.round((e.targetStart+e.end-e.start)*ticks),bytes:[0x80,e.midi,0]})}
 events.sort((a,b)=>a.t-b.t||a.bytes[0]-b.bytes[0]);const variable=(v:number)=>{const a=[v&127];while(v>>=7)a.unshift((v&127)|128);return a};
 const track=[0,0xff,0x51,3,7,0xa1,0x20,0,0xc0,10];let prior=0;for(const e of events){track.push(...variable(e.t-prior),...e.bytes);prior=e.t}track.push(0,0xff,0x2f,0);
 const n=track.length;return new Blob([new Uint8Array([77,84,104,100,0,0,0,6,0,0,0,1,1,224,77,84,114,107,(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255,...track])],{type:'audio/midi'});
}
