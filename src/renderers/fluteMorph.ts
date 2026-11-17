import {renderBirdMorph,type BirdAsset,type BirdDecoded} from './birdMorph';

export const FLUTE_SAMPLE_RATE=44100;
export const FLUTE_SOURCE='https://versilian-studios.com/vsco-community/';
export type FluteSample={midi:number;channels:Float32Array[];sampleRate:number};
export type FluteBank=FluteSample[];
export type StereoPhrase={channels:Float32Array[];sampleRate:number};
export type InstrumentEnvelope={releaseSeconds?:number;attackSeconds?:number};
const roots=[93,96];
const complete={pitch:1,timing:1,timbre:1};
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
const smooth=(x:number)=>{x=clamp(x);return x*x*(3-2*x)};

export async function loadFluteBank(signal:AbortSignal):Promise<FluteBank>{
 // Offline decoding does not start audio or require a playback permission.
 const decoder=new OfflineAudioContext(2,1,FLUTE_SAMPLE_RATE);
 return Promise.all(roots.map(async midi=>{
  const response=await fetch(`/research/audio/vsco-flute-high-v2/flute-${midi}.wav`,{signal});
  if(!response.ok)throw new Error('Flute samples could not load.');
  const buffer=await decoder.decodeAudioData(await response.arrayBuffer());
  return {midi,sampleRate:buffer.sampleRate,channels:Array.from({length:buffer.numberOfChannels},(_,i)=>buffer.getChannelData(i).slice())};
 }));
}

// A windowed-sinc polyphase filter prevents high-register playback from folding
// sample partials above Nyquist back into the audible range.
export function resampleAudio(input:Float32Array,rate:number,length:number):Float32Array{
 const out=new Float32Array(length),taps=32,phases=256,half=taps/2;
 const cutoff=.94/Math.max(1,rate),kernel=new Float32Array(phases*taps);
 for(let p=0;p<phases;p++){
  let sum=0;
  for(let j=0;j<taps;j++){
   const x=j-half+1-p/phases,z=Math.PI*x*cutoff;
   const value=(Math.abs(z)<1e-9?cutoff:Math.sin(z)/(Math.PI*x))*(.5+.5*Math.cos(Math.PI*x/half));
   kernel[p*taps+j]=value;sum+=value;
  }
  for(let j=0;j<taps;j++)kernel[p*taps+j]/=sum;
 }
 for(let i=0;i<length;i++){
  const position=i*rate,at=Math.floor(position),phase=Math.min(phases-1,Math.floor((position-at)*phases));
  let value=0;for(let j=0;j<taps;j++){const source=at+j-half+1;if(source>=0&&source<input.length)value+=input[source]*kernel[phase*taps+j]}
  out[i]=value;
 }
 return out;
}

export function renderFlutePhrase(asset:BirdAsset,bank:FluteBank,amount:number,envelope:InstrumentEnvelope={}):StereoPhrase{
 const u=clamp(amount),sr=FLUTE_SAMPLE_RATE,length=Math.round(asset.duration*sr),channels=[new Float32Array(length),new Float32Array(length)];
 for(const event of asset.events){
  // Tune the nearest upper-register recording to the original note. The morph
  // amount never enters this pitch calculation: no register shift or octave fold.
  const sample=bank.reduce((best,s)=>Math.abs(s.midi-event.midi)<Math.abs(best.midi-event.midi)?s:best);
  const rate=2**((event.midi-sample.midi)/12)*sample.sampleRate/sr;
  const duration=event.end-event.start,release=(envelope.releaseSeconds??.065)*u,n=Math.ceil((duration+release)*sr),start=Math.round(event.targetStart*sr);
  const voice=[0,1].map(c=>resampleAudio(sample.channels[Math.min(c,sample.channels.length-1)],rate,n));
  let energy=0;
  for(let i=0;i<n;i++){
   const t=i/sr,attack=smooth(t/(envelope.attackSeconds??.003)),end=t<=duration?1:smooth(1-(t-duration)/Math.max(.001,release));
   // A short release preserves the sampled breath without clicks at note-off.
   const amplitudeEnvelope=attack*end;
   for(const channel of voice){channel[i]*=amplitudeEnvelope;if(t<duration)energy+=channel[i]*channel[i]/2}
  }
  const reference=Math.sqrt(event.rms.reduce((sum,v)=>sum+v*v,0)/event.rms.length);
  // Gentle dynamic compression makes the quiet, high bird events audible on flute.
  const targetRms=.11*Math.sqrt(reference/.08),gain=Math.min(8,targetRms/Math.sqrt(Math.max(1e-12,energy/(duration*sr))));
  for(let c=0;c<2;c++)for(let i=0;i<n&&start+i<length;i++)if(start+i>=0)channels[c][start+i]+=voice[c][i]*gain;
 }
 return {channels,sampleRate:sr};
}

export function renderInstrumentMorph(decoded:BirdDecoded,bank:FluteBank,amount:number,envelope:InstrumentEnvelope={}):StereoPhrase{
 const u=clamp(amount),sr=FLUTE_SAMPLE_RATE,length=Math.round(decoded.asset.duration*sr);
 const tone=resampleAudio(renderBirdMorph(decoded,complete),decoded.asset.sampleRate/sr,length);
 if(u===0)return {channels:[tone,tone.slice()],sampleRate:sr};
 const flute=renderFlutePhrase(decoded.asset,bank,u,envelope);
 // Equal-power timbral blend at fixed pitch. The recorded breath and release
 // also change the envelope; this is an audition, not an isolated experiment.
 const a=Math.cos(u*Math.PI/2),b=Math.sin(u*Math.PI/2);
 const channels=flute.channels.map(channel=>Float32Array.from(channel,(value,i)=>a*tone[i]+b*value));
 let peak=0;for(const channel of channels)for(const value of channel)peak=Math.max(peak,Math.abs(value));
 if(peak>.94)for(const channel of channels)for(let i=0;i<channel.length;i++)channel[i]*=.94/peak;
 return {channels,sampleRate:sr};
}

export function stereoWavBlob(phrase:StereoPhrase):Blob{
 const {channels,sampleRate}=phrase,count=channels.length,frames=channels[0].length,bytes=3,countBytes=frames*count*bytes;
 const buffer=new ArrayBuffer(44+countBytes),view=new DataView(buffer);
 const text=(at:number,s:string)=>{for(let i=0;i<s.length;i++)view.setUint8(at+i,s.charCodeAt(i))};
 text(0,'RIFF');view.setUint32(4,36+countBytes,true);text(8,'WAVE');text(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,count,true);view.setUint32(24,sampleRate,true);view.setUint32(28,sampleRate*count*bytes,true);view.setUint16(32,count*bytes,true);view.setUint16(34,24,true);text(36,'data');view.setUint32(40,countBytes,true);
 for(let i=0;i<frames;i++)for(let c=0;c<count;c++){const value=Math.round(Math.max(-1,Math.min(1,channels[c][i]))*8388607),at=44+(i*count+c)*bytes;view.setUint8(at,value&255);view.setUint8(at+1,(value>>8)&255);view.setUint8(at+2,(value>>16)&255)}
 return new Blob([buffer],{type:'audio/wav'});
}
