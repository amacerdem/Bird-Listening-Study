export const PROFILE_OPTIONS={age:['18-24','25-34','35-44','45-54','55-64','65+','prefer-not'],musicTraining:['none','under-1','1-3','4-7','8+','prefer-not'],musicPractice:['never','monthly','weekly','daily','prefer-not'],listening:['comfortable','some-difficulty','prefer-not']};
export function validProfile(p){return !!p&&Object.entries(PROFILE_OPTIONS).every(([k,v])=>v.includes(p[k]))&&typeof p.nativeLanguage==='string'&&p.nativeLanguage.trim().length>0&&p.nativeLanguage.length<=80;}
export function analysisSession(s){const {registration,contact,accountId,...data}=s;return data;}

export function isExistingIdentity(error){return /already[^.]*registered|already[^.]*exists/i.test(error?.message||error?.cause?.message||'');}
