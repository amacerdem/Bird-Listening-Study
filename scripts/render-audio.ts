import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {decodeBird,renderBirdMorph} from '../src/renderers/birdMorph';
import {renderInstrumentMorph,resampleAudio} from '../src/renderers/fluteMorph';
import {renderPianoMorph} from '../src/renderers/pianoMorph';

const root=process.argv[2],site=process.argv[3],out=path.join(root,'stimuli');
await fs.mkdir(path.join(out,'audio'),{recursive:true});
const raw=await fs.readFile(path.join(site,'research/birdsong-to-music/bird-20261013.json'));
const asset=JSON.parse(raw.toString()),bird=decodeBird(asset),sr=44100,n=Math.round(asset.duration*sr);
function decodeWav(bytes:Buffer){
 let at=12,format=0,channels=0,rate=0,bits=0,data:Buffer|undefined;
 while(at+8<=bytes.length){const key=bytes.toString('ascii',at,at+4),size=bytes.readUInt32LE(at+4);at+=8;
  if(key==='fmt '){format=bytes.readUInt16LE(at);channels=bytes.readUInt16LE(at+2);rate=bytes.readUInt32LE(at+4);bits=bytes.readUInt16LE(at+14);if(format===65534&&size>=40)format=bytes.readUInt16LE(at+24);}
  if(key==='data')data=bytes.subarray(at,at+size);at+=size+(size%2);
 }
 if(!data||![1,3].includes(format)||![16,24,32].includes(bits))throw Error('Unsupported sample WAV');
 const count=data.length/(channels*bits/8),values=Array.from({length:channels},()=>new Float32Array(count));
 for(let i=0;i<count;i++)for(let c=0;c<channels;c++){const p=(i*channels+c)*bits/8;values[c][i]=format===3?data.readFloatLE(p):bits===16?data.readInt16LE(p)/32768:bits===24?data.readIntLE(p,3)/8388608:data.readInt32LE(p)/2147483648;}
 return {channels:values,sampleRate:rate};
}
async function bank(folder:string,prefix:string,notes:number[]){return Promise.all(notes.map(async midi=>({midi,...decodeWav(await fs.readFile(path.join(site,`research/audio/${folder}/${prefix}-${midi}.wav`)))})));}
const flute=await bank('vsco-flute-high-v2','flute',[93,96]);
const piano=await bank('salamander-piano-v1','piano',[90,93,96,99,102,105,108]);
const ids=['full','flute','piano','spectrum','pitch','time'];
const anchors=Array.from({length:9},(_,i)=>i/8);
const rms=(x:Float32Array)=>Math.sqrt(x.reduce((s,v)=>s+v*v,0)/x.length);
let highest=0;
const rendered=ids.map(id=>({id,segments:anchors.map(u=>{
 let mono:Float32Array;
 if(id==='flute'||id==='piano'){
  const phrase=id==='flute'?renderInstrumentMorph(bird,flute,u):renderPianoMorph(bird,piano,u);
  mono=Float32Array.from(phrase.channels[0],(v,i)=>(v+phrase.channels[1][i])/2);
 }else{
  const settings={pitch:id==='full'||id==='pitch'?u:0,timing:id==='full'||id==='time'?u:0,timbre:id==='full'||id==='spectrum'?u:0};
  mono=resampleAudio(renderBirdMorph(bird,settings),asset.sampleRate/sr,n);
 }
 for(let i=0;i<n;i++){const edge=Math.min(1,i/(sr*.005),(n-1-i)/(sr*.005));mono[i]*=.5-.5*Math.cos(Math.PI*Math.max(0,edge));}
 const gain=.06/rms(mono);for(let i=0;i<n;i++){mono[i]*=gain;highest=Math.max(highest,Math.abs(mono[i]));}
 return mono;
})}));
const safetyGain=Math.min(1,.85/highest),sha=(b:Buffer)=>crypto.createHash('sha256').update(b).digest('hex');
function wav(x:Float32Array){const b=Buffer.alloc(44+x.length*2);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(sr,24);b.writeUInt32LE(sr*2,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(x.length*2,40);for(let i=0;i<x.length;i++)b.writeInt16LE(Math.round(x[i]*32767),44+i*2);return b;}
const clips=[];
for(const r of rendered){const samples=new Float32Array(n*9);r.segments.forEach((s,k)=>{for(let i=0;i<n;i++)samples[k*n+i]=s[i]*safetyGain;});const bytes=wav(samples),digest=sha(bytes),file=`audio/${r.id}-${digest.slice(0,12)}.wav`;await fs.writeFile(path.join(out,file),bytes);clips.push({id:r.id,file,sha256:digest,frames:samples.length,sampleRate:sr,duration:samples.length/sr,rms:rms(samples),peak:Math.max(...Array.from({length:100},(_,k)=>Math.max(...samples.subarray(Math.floor(k*samples.length/100),Math.floor((k+1)*samples.length/100)).map(Math.abs)))),bytes:bytes.length});}
const waveform=Array.from({length:180},(_,k)=>{const start=Math.floor(k*bird.original.length/180),end=Math.floor((k+1)*bird.original.length/180);let peak=0;for(let i=start;i<end;i++)peak=Math.max(peak,Math.abs(bird.original[i]));return +peak.toFixed(4);});
const manifest={protocol:'bird-listening-2026-11-17-v1',sourceSha256:sha(raw),sourceRecordingSha256:asset.recordingSha256,sourceCredit:asset.credit,phraseDuration:n/sr,anchors,anchorDuration:n/sr,duration:n*9/sr,sampleRate:sr,channels:1,normalization:'Equal RMS per complete-phrase anchor after a 5 ms edge taper; one common safety gain across all stimuli',targetRms:.06*safetyGain,safetyGain,clips,waveform,credits:[{name:asset.credit,license:asset.license,url:asset.sourceUrl},{name:'VSCO 2 Community Edition flute',license:'CC0',url:'https://versilian-studios.com/vsco-community/'},{name:'Salamander Grand Piano v3 · Alexander Holm',license:'CC BY 3.0; pitch-shifted, resynthesized and level-matched',url:'https://github.com/sfzinstruments/SalamanderGrandPiano'}]};
await fs.writeFile(path.join(out,'stimuli.json'),JSON.stringify(manifest,null,2));console.log(JSON.stringify({clips:clips.length,duration:manifest.duration,targetRms:manifest.targetRms,totalBytes:clips.reduce((s,c)=>s+c.bytes,0)}));
