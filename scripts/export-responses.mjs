import fs from 'node:fs/promises';import path from 'node:path';
import {validateSession,trialCsv,ORDER} from '../src/protocol.mjs';
const input=process.argv[2],out=process.argv[3];if(!input||!out)throw Error('Usage: node scripts/export-responses.mjs input.json output-directory');
const data=JSON.parse(await fs.readFile(input,'utf8')),items=Array.isArray(data)?data:[data];
await fs.mkdir(out,{recursive:true});const seen=new Set(),sessions=[],audit=[];
for(const item of items){let s;try{s=item.session|| (typeof item.data?.responses==='string'?JSON.parse(item.data.responses):typeof item.responses==='string'?JSON.parse(item.responses):item);}catch{audit.push({reason:'invalid-json'});continue;}
 if(item.recordType==='qa'||item.data?.record_type==='qa'||s.recordType==='qa'||s.mode!=='study'){audit.push({id:s.id,reason:'non-participant'});continue;}const errors=validateSession(s);if(errors.length){audit.push({id:s.id,reason:'invalid',errors});continue;}if(seen.has(s.id)){audit.push({id:s.id,reason:'duplicate'});continue;}seen.add(s.id);sessions.push(s);
}
const ratings=[['participant_id','language',...ORDER,'replay_count','interruption_count'].join(','),...sessions.map(s=>[s.id,s.language,...ORDER.map(id=>s.ratings[id]),s.replays?.length||0,s.interruptions?.length||0].join(','))];
const cell=x=>'"'+String(x??'').replace(/^[=+@-]/,v=>"'"+v).replaceAll('"','""')+'"';
const profileFields=['age','nativeLanguage','musicTraining','musicPractice','listening'];
const profiles=[['participant_id',...profileFields].map(cell).join(','),...sessions.map(s=>[s.id,...profileFields.map(k=>s.profile?.[k])].map(cell).join(','))];
await fs.writeFile(path.join(out,'profiles.csv'),profiles.join('\n'));
const traces=sessions.map((s,i)=>i?trialCsv(s).split('\n').slice(1).join('\n'):trialCsv(s));
await fs.writeFile(path.join(out,'ratings.csv'),ratings.join('\n'));await fs.writeFile(path.join(out,'traces.csv'),traces.join('\n'));await fs.writeFile(path.join(out,'import-audit.json'),JSON.stringify({accepted:sessions.length,excluded:audit},null,2));
console.log(JSON.stringify({accepted:sessions.length,excluded:audit.length,out}));
