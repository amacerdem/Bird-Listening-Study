import {FLUTE_SAMPLE_RATE,renderInstrumentMorph,type FluteBank} from './fluteMorph';
import type {BirdDecoded} from './birdMorph';

export const PIANO_SOURCE='https://github.com/sfzinstruments/SalamanderGrandPiano';
export async function loadPianoBank(signal:AbortSignal):Promise<FluteBank>{
 const base='/research/audio/salamander-piano-v1';
 const response=await fetch(`${base}/credits.json`,{signal});
 if(!response.ok)throw new Error('Piano samples could not load.');
 const manifest=await response.json() as {samples:{file:string;playbackMidi:number}[]};
 const decoder=new OfflineAudioContext(2,1,FLUTE_SAMPLE_RATE);
 return Promise.all(manifest.samples.map(async sample=>{
  const audio=await fetch(`${base}/${sample.file}`,{signal});
  if(!audio.ok)throw new Error('Piano samples could not load.');
  const buffer=await decoder.decodeAudioData(await audio.arrayBuffer());
  return {midi:sample.playbackMidi,sampleRate:buffer.sampleRate,channels:Array.from({length:buffer.numberOfChannels},(_,i)=>buffer.getChannelData(i).slice())};
 }));
}

export const renderPianoMorph=(decoded:BirdDecoded,bank:FluteBank,amount:number)=>
 renderInstrumentMorph(decoded,bank,amount,{attackSeconds:.0005,releaseSeconds:.12});
