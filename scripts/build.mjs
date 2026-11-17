import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import * as esbuild from 'esbuild';
import {execFileSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),site=path.join(root,'stimulus-source');
const arg=name=>process.argv.find(v=>v.startsWith('--'+name+'='))?.slice(name.length+3);
const origin=arg('origin')||process.env.BIRD_STUDY_ORIGIN||'https://r3-resonance.com',base=arg('base')||'/';
if(new URL(origin).origin!==origin||!origin.startsWith('https://')||!/^\/(?:[a-z0-9-]+\/)*$/.test(base))throw Error('Invalid deployment origin or base');
const output=path.resolve(root,arg('output')||'dist'),target=path.join(output,base),seed=path.join(root,'stimuli');
await fs.mkdir(target,{recursive:true});
await fs.cp(path.join(root,'public'),output,{recursive:true});
if(process.argv.includes('--audio')||!await fs.access(path.join(seed,'stimuli.json')).then(()=>true,()=>false)){
 await fs.mkdir(path.join(root,'.build'),{recursive:true});
 await esbuild.build({entryPoints:[path.join(root,'scripts/render-audio.ts')],outfile:path.join(root,'.build/render-audio.mjs'),bundle:true,platform:'node',format:'esm',target:'node22'});
 execFileSync(process.execPath,[path.join(root,'.build/render-audio.mjs'),root,site],{stdio:'inherit'});
}
if(target!==seed){await fs.copyFile(path.join(seed,'stimuli.json'),path.join(target,'stimuli.json'));await fs.cp(path.join(seed,'audio'),path.join(target,'audio'),{recursive:true});}
const build=await esbuild.build({entryPoints:[path.join(root,'src/app.js')],bundle:true,minify:true,format:'esm',target:'es2022',write:false,outdir:'/virtual-bird-study',logLevel:'silent',define:{__STUDY_BASE__:JSON.stringify(base)}});
const assets={};
for(const file of build.outputFiles){const ext=path.extname(file.path),name='study-'+crypto.createHash('sha256').update(file.contents).digest('hex').slice(0,12)+ext;assets[ext.slice(1)]=name;await fs.writeFile(path.join(target,name),file.contents);}
await fs.writeFile(path.join(target,'index.html'),`<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#f7f8f4"><meta name="robots" content="noindex,nofollow"><meta name="description" content="A bilingual listening study of birdsong transformations. Musical Intelligence, Amaç Erdem."><title>Bird dinleme deneyi · Musical Intelligence</title><link rel="stylesheet" href="./${assets.css}"><script type="module" src="./${assets.js}"></script></head><body><div id="app"></div><noscript>Bu deney için JavaScript gerekir. / JavaScript is required for this listening study.</noscript></body></html>`);
await fs.rm(path.join(target,'submit.html'),{force:true});
for(const kind of ['confirmation','recovery'])await fs.writeFile(path.join(target,kind+'-email.html'),`<!doctype html><html><body style="margin:0;background:#f7f8f4;font-family:Arial,sans-serif;color:#222c28"><main style="max-width:520px;margin:40px auto;padding:32px"><p style="font-size:11px;letter-spacing:2px;color:#42685e">MUSICAL INTELLIGENCE · BIRD 01</p><h1 style="font-size:28px;font-weight:400">E-postanızı doğrulayın.<br>Verify your email.</h1><p style="line-height:1.7">Bird dinleme deneyine devam etmek için aşağıdaki bağlantıyı açın. Şifre oluşturmanız gerekmez.</p><p style="line-height:1.7">Open the link below to continue to the Bird listening study. No password is needed.</p><p style="margin:30px 0"><a style="background:#42685e;color:white;padding:15px 20px;border-radius:6px;text-decoration:none" href="${origin}${base}#${kind}_token={{ .Token }}">Doğrula ve devam et / Verify & continue</a></p><p style="font-size:12px;color:#707a73;line-height:1.7">Bu e-postayı siz istemediyseniz yok sayabilirsiniz.<br>If you did not request this email, you can ignore it.</p><p style="font-size:11px;color:#707a73">Amaç Erdem · Musical Intelligence</p></main></body></html>`);
await fs.writeFile(path.join(output,'build.json'),JSON.stringify({version:'bird-listening-2026-11-17-v1',entry:base,origin,assets,builtAt:new Date().toISOString()},null,2));
console.log(JSON.stringify({built:true,assets,entry:target}));

if(process.argv.includes('--bundle-functions')){
 const {zipFunctions}=await import('@netlify/zip-it-and-ship-it');
 const functions=await zipFunctions(path.join(root,'functions'),path.join(root,'.build/functions'),{archiveFormat:'zip',config:{'*':{nodeBundler:'esbuild',nodeVersion:'22'}},manifest:path.join(root,'.build/functions/manifest.json')});
 console.log(JSON.stringify({functions:functions.map(f=>({name:f.name,runtime:f.runtime,runtimeAPIVersion:f.runtimeAPIVersion,size:f.size}))}));
}
