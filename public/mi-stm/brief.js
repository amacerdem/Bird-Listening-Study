import {BRIEF} from './brief-data.js';
import {REFERENCES} from './references.js';
import {briefFigure} from './brief-figures.js';

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function authorLabel(r) {
  const names={souza2013:'Souza et al.',souza2020:'Souza et al.',holmes2021:'Holmes et al.',holmes2023:'Holmes & Johnsrude',baxter2025:'Baxter et al.',shen2023:'Shen & Langley',griffith2026:'Griffith et al.',philpott2025:'Philpott et al.',koprowska2023:'Koprowska et al.',wilderode2025:'Van Wilderode et al.',magits2023:'Magits et al.',barcroft2016:'Barcroft et al.',belin2025:'Belin & Kawahara',skuk2020:'Skuk et al.',harm:'McPherson et al.',rajappa2023:'Rajappa et al.',wang2008:'Wang & Humes',osullivan2015:'O’Sullivan et al.',stoll2025:'Stoll et al.',yucel2021:'Yücel et al.',smith2024:'Smith et al.',schell2026:'Schell et al.',norman2022:'Norman-Haignere et al.',time:'Norman-Haignere et al.',ashby1986:'Ashby & Townsend',albouy:'Albouy et al.',zokoll2015:'Zokoll et al.',popham2018:'Popham et al.',yun2024:'Yun et al.'};
  return `${names[r.key]||r.authors.replace(/, [A-Z]\. /g,' ')} (${r.year})`;
}
export function inlineCitations(text) {
  return esc(text).replace(/\[\[([\w-]+)\]\]/g,(_,key)=>{
    const r=REFERENCES[key];if(!r)throw new Error('Missing reference: '+key);
    return `<button type="button" class="brief-cite" data-reference="${key}" aria-label="Read reference: ${esc(authorLabel(r))}">${esc(authorLabel(r))}${r.version?.includes('Preprint')?' · preprint':''}</button>`;
  });
}
export function filterReferences(query='',group='All') {
  const q=query.trim().toLocaleLowerCase('en-US');
  return Object.values(REFERENCES).filter(r=>(group==='All'||r.group===group)&&[r.title,r.authors,r.year,r.doi,r.venue,r.note].join(' ').toLocaleLowerCase('en-US').includes(q)).sort((a,b)=>b.year-a.year||a.authors.localeCompare(b.authors));
}
const publication=r=>`<article class="brief-reference"><div><span>${esc(r.group)}</span>${r.version?`<b>${esc(r.version)}</b>`:''}</div><h3><a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.title)} <span>↗</span></a></h3><p>${esc(r.authors)} · ${r.year}${r.venue?' · '+esc(r.venue):''}</p>${r.note?`<p class="reference-relevance">${esc(r.note)}</p>`:''}<small>${r.doi?'DOI: '+esc(r.doi):esc(r.source)}</small></article>`;

export class ResearchBrief {
  constructor(root,{dialog}) {
    this.root=root;this.dialog=dialog;this.index=0;this.focus=false;
    root.innerHTML=`<span id="brief" class="section-anchor" aria-hidden="true"></span><div class="brief-heading"><div><span class="eyebrow"><span class="section-rule"></span> RESEARCH BRIEF</span><p>Rationale, experimental design and criteria for inference</p></div><div><button id="briefFocus" aria-pressed="false">Focus view <span>↗</span></button><button id="briefLibrary">Project bibliography <span>${Object.keys(REFERENCES).length}</span></button></div></div><div class="brief-shell"><nav class="brief-contents" aria-label="Research brief sections">${['Rationale','Design','Evaluation'].map((g)=>`<div class="brief-nav-group"><span>${g}</span>${BRIEF.map((s,i)=>s.group===g?`<button type="button" data-brief-step="${i}" aria-current="${i===0?'step':'false'}"><span>${String(i+1).padStart(2,'0')}</span><strong>${s.nav}</strong></button>`:'').join('')}</div>`).join('')}<a class="brief-workspace-link" href="#space">Stimulus workspace <span>↑</span></a></nav><article id="briefArticle" class="brief-article" aria-labelledby="briefSlideTitle"></article></div><div class="brief-footer"><div><span id="briefPage"></span><div class="brief-progress" aria-hidden="true">${BRIEF.map((_,i)=>`<i data-progress="${i}"></i>`).join('')}</div><span class="brief-keyboard">← → within the brief</span></div><div><button id="briefPrevious" aria-label="Previous research section">← <span>Previous</span></button><button id="briefNext">Next <span>→</span></button></div></div><div class="sr-only" id="briefAnnouncement" aria-live="polite"></div>`;
    root.addEventListener('click',e=>{
      const s=e.target.closest('[data-brief-step]');if(s){this.select(Number(s.dataset.briefStep),true);return;}
      const c=e.target.closest('[data-reference]');if(c)this.reference(c.dataset.reference);
    });
    root.querySelector('#briefPrevious').addEventListener('click',()=>this.select(this.index-1,true));
    root.querySelector('#briefNext').addEventListener('click',()=>{if(this.index===BRIEF.length-1){this.setFocus(false);location.hash='space';}else this.select(this.index+1,true);});
    root.querySelector('#briefLibrary').addEventListener('click',()=>this.library());
    root.querySelector('#briefFocus').addEventListener('click',()=>this.setFocus(!this.focus));
    root.addEventListener('keydown',e=>{
      if(e.altKey||e.ctrlKey||e.metaKey||['INPUT','SELECT','TEXTAREA','SUMMARY'].includes(e.target.tagName))return;
      if(e.key==='ArrowRight'&&this.index<BRIEF.length-1){e.preventDefault();this.select(this.index+1,true);}
      if(e.key==='ArrowLeft'&&this.index>0){e.preventDefault();this.select(this.index-1,true);}
    });
    document.addEventListener('click',e=>{const a=e.target.closest('a[href="#space"],a[href="#adaptiveLoop"]');if(a)this.setFocus(false);});
    window.addEventListener('hashchange',()=>this.fromHash());
    this.fromHash();
    if(location.hash.startsWith('#brief/'))requestAnimationFrame(()=>this.root.scrollIntoView({block:'start',behavior:'instant'}));
  }
  fromHash(){const id=location.hash.replace('#brief/','');const i=BRIEF.findIndex(s=>s.id===id);this.select(i<0?this.index:i,false);}
  select(i,updateHash=false){
    if(i<0||i>=BRIEF.length)return;this.index=i;const s=BRIEF[i];
    this.root.querySelectorAll('[data-brief-step]').forEach((b,j)=>b.setAttribute('aria-current',i===j?'step':'false'));
    this.root.querySelectorAll('[data-progress]').forEach((b,j)=>b.classList.toggle('complete',j<=i));
    this.root.querySelector('#briefPage').textContent=`${String(i+1).padStart(2,'0')} / ${BRIEF.length}`;
    this.root.querySelector('#briefPrevious').disabled=i===0;
    this.root.querySelector('#briefNext').innerHTML=i===BRIEF.length-1?'Open workspace <span>↑</span>':'Next <span>→</span>';
    this.root.querySelector('#briefArticle').innerHTML=`<div class="brief-slide-head"><span>${s.label}</span><span>${s.group.toUpperCase()} · ${String(i+1).padStart(2,'0')}</span></div><h2 id="briefSlideTitle" tabindex="-1">${s.title}</h2><div class="brief-slide-grid"><div class="brief-prose"><p class="brief-lead">${inlineCitations(s.lead)}</p>${s.paragraphs.map(p=>`<p>${inlineCitations(p)}</p>`).join('')}<div class="brief-decision"><span>DESIGN CONSEQUENCE</span><p>${inlineCitations(s.decision)}</p></div></div><figure class="brief-figure">${briefFigure(s.figure)}<figcaption>${s.caption}</figcaption></figure></div><details class="brief-methods"><summary>${s.detailTitle}<span>Methods & assumptions</span></summary><div>${s.details.map(p=>`<p>${inlineCitations(p)}</p>`).join('')}</div></details>${s.action?`<a class="brief-inline-action" href="${s.action.target}">${s.action.label} <span>${s.action.target==='#space'?'↑':'↓'}</span></a>`:''}`;
    if(updateHash){
      history.replaceState(null,'',`#brief/${s.id}`);
      this.root.querySelector('#briefAnnouncement').textContent=`Section ${i+1} of ${BRIEF.length}: ${s.title}`;
      const current=this.root.querySelector('[aria-current="step"]');
      if(matchMedia('(max-width:640px)').matches)current.scrollIntoView({block:'nearest',inline:'center',behavior:'instant'});
      this.root.scrollIntoView({block:'start',behavior:'instant'});
    }
  }
  setFocus(value){this.focus=value;document.body.classList.toggle('brief-focus',value);const b=this.root.querySelector('#briefFocus');b.setAttribute('aria-pressed',value);b.innerHTML=value?'Exit focus view <span>↙</span>':'Focus view <span>↗</span>';if(value)this.root.scrollIntoView({block:'start',behavior:'instant'});}
  reference(key){const r=REFERENCES[key];this.dialog(authorLabel(r),`${publication(r)}<button id="allBriefReferences" class="reference-library-link">Browse the project bibliography <span>↗</span></button>`,'MI-STM · PRIMARY SOURCE');document.querySelector('#allBriefReferences').addEventListener('click',()=>this.library());}
  library(){
    this.dialog('Project bibliography',`<p class="bibliography-lead">Sources from the speech proposal, methods companion and auditory-attention review. Citations in the briefing identify the evidence used for each claim; additional entries document the wider research context.</p><div class="bibliography-controls"><label for="referenceQuery">Search author, title, year or DOI</label><input id="referenceQuery" type="search" placeholder="e.g. familiar voice, Souza, 2025…" autocomplete="off"><label class="sr-only" for="referenceGroup">Filter references by topic</label><select id="referenceGroup"><option>All</option>${[...new Set(Object.values(REFERENCES).map(r=>r.group))].sort().map(g=>`<option>${esc(g)}</option>`).join('')}</select></div><p id="referenceCount" class="reference-count" role="status"></p><div id="referenceResults"></div>`,'MI-STM · SOURCE LIBRARY');
    const update=()=>{const r=filterReferences(document.querySelector('#referenceQuery').value,document.querySelector('#referenceGroup').value);document.querySelector('#referenceCount').textContent=`${r.length} of ${Object.keys(REFERENCES).length} references`;document.querySelector('#referenceResults').innerHTML=r.length?r.map(publication).join(''):'<p class="reference-empty">No matching references. Try a surname, a year or a broader topic.</p>';};
    document.querySelector('#referenceQuery').addEventListener('input',update);document.querySelector('#referenceGroup').addEventListener('change',update);update();
  }
}
