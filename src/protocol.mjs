export const VERSION='bird-listening-2026-11-17-v1';
export const ORDER=['full','flute','piano','spectrum','pitch','time'];
export const SCALES=['calm','pleasant','arousal'];
export const FORM='mi-bird-listening-v1';
export const SAMPLE_INTERVAL=.05;
export function morphAt(time,phraseDuration){return Math.min(8,Math.max(0,Math.floor(time/phraseDuration)))/8;}
export function requiredTrial(index){return {scale:SCALES[Math.floor(index/6)],stimulus:ORDER[index%6]};}
export function validateSession(s){
 const errors=[];
 if(s.mode!=='study')errors.push('non-participant');
 if(s.protocol!==VERSION)errors.push('version');
 if(!/^[a-z0-9-]{12,60}$/i.test(s.id||''))errors.push('id');
 if(!s.consent?.adult||!s.consent?.participate||!s.consent?.timestamp)errors.push('consent');
 if(!s.setup?.headphones||!s.setup?.channelsPassed)errors.push('setup');
 if(s.initial?.length!==6||ORDER.some((id,i)=>s.initial[i]?.stimulus!==id||!s.initial[i]?.complete))errors.push('initial');
 if(ORDER.some(id=>!Number.isInteger(s.ratings?.[id])||s.ratings[id]<0||s.ratings[id]>10))errors.push('ratings');
 if(s.trials?.length!==18)errors.push('trials');
 (s.trials||[]).forEach((t,i)=>{const expected=requiredTrial(i);if(t.scale!==expected.scale||t.stimulus!==expected.stimulus||!t.complete||t.samples?.length<20||!t.audioSha256)errors.push('trial-'+i);let prior=-1;for(const point of t.samples||[]){if(point.length!==3||!point.every(Number.isFinite)||point[0]<prior||point[1]<0||point[1]>1||point[2]<0||point[2]>1)errors.push('samples-'+i);prior=point[0];}if(t.samples?.at(-1)?.[0]<t.duration-.1)errors.push('duration-'+i);});
 return [...new Set(errors)];
}
export function newSession(language){return {schema:1,protocol:VERSION,id:crypto.randomUUID(),language,createdAt:new Date().toISOString(),consent:null,setup:{},practiceComplete:false,initial:[],ratings:{},replays:[],trials:[],interruptions:[],events:[],stage:'welcome',submission:null};}
export function trialCsv(s){const header=['participant_id','protocol','language','scale','stimulus','seconds','response','morph','audio_sha256'];const rows=s.trials.flatMap(t=>t.samples.map(p=>[s.id,s.protocol,s.language,t.scale,t.stimulus,...p,t.audioSha256]));return [header,...rows].map(r=>r.join(',')).join('\n');}
