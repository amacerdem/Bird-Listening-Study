import {getStore} from '@netlify/blobs';
import {validateSession,VERSION} from '../src/protocol.mjs';
import {validProfile,analysisSession} from '../src/profile.mjs';
import stimuli from '../stimuli/stimuli.json' with {type:'json'};
export const identityOrigin=()=>new URL(process.env.BIRD_STUDY_ORIGIN||'https://r3-resonance.com').origin;
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export async function verifiedUser(req){
 const raw=req.headers.get('cookie')?.split(';').find(p=>p.trim().startsWith('nf_jwt='))?.trim().slice(7);
 if(!raw)return null;
 const r=await fetch(identityOrigin()+'/.netlify/identity/user',{headers:{Authorization:'Bearer '+decodeURIComponent(raw)},signal:AbortSignal.timeout(8000)});
 if(!r.ok)return null;const user=await r.json();return user.confirmed_at&&user.email&&user.id?user:null;
}
export function validAudio(s){return [...s.initial,...s.trials].every(t=>{const clip=stimuli.clips.find(c=>c.id===t.stimulus);return clip&&t.audioSha256===clip.sha256&&Math.abs(t.duration-stimuli.duration)<.002;});}
export default async function handler(req){
 try{
  if(!['GET','POST'].includes(req.method))return json({error:'method'},405);
  if(req.method==='POST'&&req.headers.get('origin')!==new URL(req.url).origin)return json({error:'origin'},403);
  const user=await verifiedUser(req);if(!user)return json({error:'email-verification-required'},401);
  if(req.method==='GET')return json({verified:true});
  if(!req.headers.get('content-type')?.startsWith('application/json'))return json({error:'content-type'},415);
  const body=await req.text();if(body.length>1500000)return json({error:'size'},413);
  let input;try{input=JSON.parse(body);}catch{return json({error:'invalid-json'},400);}
  const s=input.responses;let errors;try{errors=validateSession(s);}catch{return json({error:'invalid-session'},422);}
  if(errors.length||!validProfile(s.profile)||!validAudio(s)||!s.consent?.contact)return json({error:'incomplete-session'},422);
  const contacts=getStore({name:'bird-study-contacts-v1',consistency:'strong'}),responses=getStore({name:'bird-study-responses-v1',consistency:'strong'});
  const key=VERSION+'/'+user.id,existing=await responses.get(key,{type:'json'});
  if(existing)return json({ok:true,participantId:existing.session.id,receivedAt:existing.receivedAt,alreadyReceived:true});
  const receivedAt=new Date().toISOString();const contact={participantId:s.id,email:user.email,verifiedAt:user.confirmed_at,preferredName:String(input.preferredName||'').trim().slice(0,80),contactConsent:s.consent.contact,receivedAt};
  await contacts.setJSON(key,contact,{onlyIfNew:true});
  const record={schema:1,protocol:VERSION,recordType:s.recordType==='qa'?'qa':'participant',receivedAt,session:analysisSession(s)};
  const result=await responses.setJSON(key,record,{onlyIfNew:true});
  const saved=result.modified===false?await responses.get(key,{type:'json'}):record;
  return json({ok:true,participantId:saved.session.id,receivedAt:saved.receivedAt});
 }catch{return json({error:'temporarily-unavailable'},503);}
}
