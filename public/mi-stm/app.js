import {ListeningSpace} from './space.js';
import {INITIAL,routePoint,tmrDb,dbText} from './model.js';
import {illustrativePool,nearestAnchor,validatePool,projectPool} from './pool.js';
import {AdaptiveLoop} from './loop.js';
import {ResearchBrief} from './brief.js';

const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const state={...INITIAL};let space,adaptiveLoop,researchBrief,routeRunning=false,routeLast=0,toastTimer,bank=illustrativePool(),pool=projectPool(bank,state.mapMode,state.f0Tolerance),selection=nearestAnchor(pool,state.x,state.y);
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
function showToast(message){$('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),3400);}
function dialog(title,html,kicker='ARCHITECTURE NOTES'){$('#dialogTitle').textContent=title;$('#dialogEyebrow').textContent=kicker;$('#dialogContent').innerHTML=html;if(!$('#detailDialog').open)$('#detailDialog').showModal();$('#detailDialog').scrollTop=0;}
function stopRoute(){routeRunning=false;$('#animateRoute').textContent='▶';$('#animateRoute').setAttribute('aria-label','Animate selected route');}
function refreshPool(){pool=projectPool(bank,state.mapMode,state.f0Tolerance);}
function update(){
  const personal=state.mapMode==='personal';
  for(const [key,id] of [['x','spectral'],['y','temporal'],['z','masking']]){const input=$('#'+id);input.value=state[key];input.style.setProperty('--fill',(state[key]*100)+'%');}
  $('#spectralValue').textContent=state.x.toFixed(2);$('#temporalValue').textContent=state.y.toFixed(2);$('#maskingValue').innerHTML=dbText(tmrDb(state.z))+' <small>dB</small>';
  $('#coordX').textContent=state.x.toFixed(2);$('#coordY').textContent=state.y.toFixed(2);$('#coordZ').innerHTML=dbText(tmrDb(state.z))+'<span>dB</span>';
  $('#routeProgress').value=state.progress;$('#routePercent').textContent=state.followingRoute?Math.round(state.progress*100).toString().padStart(2,'0')+'%':'—';
  $('#routeProgress').setAttribute('aria-valuetext',state.followingRoute?Math.round(state.progress*100)+' percent along route':'Free anchor selection; adjust to follow a route');
  $('#routeContext').textContent=!personal?'Choose a route to enter the F0-matched personal map.':state.followingRoute?'Discrete recordings · masker level held along the route':'Free anchor selection · use the route slider to resume.';
  $('#reverseRoute').textContent=state.reverse?'B → F':'F → B';
  $('#routeDescription').textContent={joint:'Select anchors with increasing R³ and T³ distance.',spectral:'Select spectral-distance steps, then temporal steps.',temporal:'Select temporal-distance steps, then spectral steps.'}[state.route];
  $$('[data-masker]').forEach(b=>{const active=b.dataset.masker===state.masker;b.classList.toggle('active',active);b.setAttribute('aria-pressed',active);});
  $('#maskerDescription').textContent=state.masker==='speech'?'One or more competing human talkers.':'Environmental sounds and non-speech noise.';
  $$('[data-route]').forEach(b=>{const active=b.dataset.route===state.route;b.classList.toggle('active',active);b.setAttribute('aria-pressed',active);});
  $$('[data-map]').forEach(b=>{const active=b.dataset.map===state.mapMode;b.classList.toggle('active',active);b.setAttribute('aria-pressed',active);});
  $('#spaceTitle').textContent=personal?'MI-STM · personal anchor trajectories':'MI-STM · global acoustic coordinates';
  $('#mapExplanation').textContent=personal?'F0-matched candidates · distances from familiar reference '+bank.reference_id:'All candidates · fixed bank coordinates · one matched-content slice';
  $('#bankPopulation').textContent=bank.candidates.length.toLocaleString()+' records / '+new Set(bank.candidates.map(p=>p.voice_family||'unspecified')).size+' voice IDs';
  for(const [name,term] of [['spectral','R³'],['temporal','T³']]){
    $('.'+name+' label').textContent=(name==='spectral'?'Spectral':'Temporal')+(personal?' distance':' coordinate');
    $('.'+name+' p').textContent=term+(personal?' descriptor distance from the familiar reference':' projection · normalized bank coordinate');
    const ends=$$('.'+name+' .range-labels span');ends[0].textContent=personal?'NEAR REFERENCE':'LOW COORDINATE';ends[1].textContent=personal?'FURTHER AWAY':'HIGH COORDINATE';
  }
  $('#spectralMeaning').textContent=personal?'Requested normalized distance from the reference. Select a pre-generated F0-matched anchor.':'Requested normalized bank coordinate. Select a pre-generated anchor.';
  $('#f0Reference').textContent=bank.reference.f0.median.toFixed(0)+' Hz';$('#f0ToleranceValue').textContent=state.f0Tolerance.toFixed(1)+' st';$('#f0Tolerance').value=state.f0Tolerance;
  const eligible=state.mapMode==='personal'?pool.candidates.length:projectPool(bank,'personal',state.f0Tolerance).candidates.length;
  $('#f0Summary').textContent=eligible+' / '+bank.candidates.length+' eligible · '+(personal?'LOCK APPLIED':'personal-route gate');
  selection=nearestAnchor(pool,state.x,state.y);const a=selection.anchor;
  $('#selectedAnchor').textContent=a?.id||'NO MATCH';$('#anchorS').textContent=a?a.x.toFixed(3):'—';$('#anchorT').textContent=a?a.y.toFixed(3):'—';$('#anchorError').textContent=a?selection.error.toFixed(3):'—';
  $('#poolCount').textContent=pool.candidates.length.toLocaleString()+(pool.candidates.length===1?' candidate':' candidates');
  $('#anchorQuality').textContent=!a?'No eligible anchor. Add compatible recordings.':a.eligible?'F0 compatible · '+a.f0.median.toFixed(0)+' Hz · max Δ '+a.f0Deviation.toFixed(1)+' st':'Outside F0 gate · excluded from personal routes';
  $('#anchorQuality').classList.toggle('sparse',!a||!a.eligible);$('#inspectAnchor').disabled=!a;$('#anchorInfo').disabled=!a;$('#animateRoute').disabled=eligible===0;
  $('#poolStatus').textContent=(bank.status==='schematic'?'Illustrative dataset':'Imported manifest')+' · '+bank.candidates.length.toLocaleString()+' records · '+bank.candidates[0].text_id;
  $('.plot-top .mini-badge').textContent=bank.status==='schematic'?'SCHEMATIC DATA · NO MI RUN':'IMPORTED COORDINATES';
  $('#interpretationText').innerHTML=personal?'<strong>One bank. Multiple paths.</strong> F0 gates the candidates; R³/T³ locates them relative to the familiar voice. Routes select discrete recordings. Acoustic distance is not perceptual difficulty.':'<strong>Generate → measure → select.</strong> The global view shows all recordings. Personal trajectories use reference-relative distances and F0-matched candidates. Z controls the external masker.';
  space?.update({...state,anchor:a,pool});
  adaptiveLoop?.update({anchor_id:a?.id||null,reference_id:bank.reference_id,bank_status:bank.status,map_mode:state.mapMode,selected_coordinates:a?{x:a.x,y:a.y}:null,f0_eligible:a?.eligible||false,f0_tolerance_st:state.f0Tolerance,masker:state.masker,tmr_db:Number(tmrDb(state.z).toFixed(2)),masker_audio_mixed:false});
}

function followRoute(){
  if(state.mapMode!=='personal'){state.mapMode='personal';refreshPool();}
  state.followingRoute=true;
  Object.assign(state,routePoint(state.progress,state.route,state.reverse));
}

function explanation({lead,steps,example,technical,note,extra=''}){
  return `<div class="explanation"><p class="explanation-lead">${lead}</p><ol class="explanation-steps">${steps.map(([title,body])=>`<li><div><h3>${title}</h3><p>${body}</p></div></li>`).join('')}</ol>${example?`<div class="explanation-example"><span>IN PRACTICE</span><p>${example}</p></div>`:''}${extra}${technical?`<details class="explanation-details"><summary>Technical details</summary><div>${technical}</div></details>`:''}<p class="explanation-note">${note||'This is a visual demo. Speech generation and MI measurement have not been run.'}</p></div>`;
}

function methods(){dialog('How MI-STM works',explanation({
  lead:'Use a measured speech bank to connect a familiar voice, listening errors and targeted practice.',
  steps:[
    ['Build a measured speech bank','Generate many versions of the same sentences. R³/T³ measures each recording so it can be placed on the map.'],
    ['Choose a familiar starting point','Compare the recordings with the familiar voice. Keep personal routes within its measured pitch range.'],
    ['Test, profile and train','Collect what the listener understood. Use repeated errors and controlled cue probes to guide the next anchors; request more recordings when coverage is missing.'],
    ['Retest with new speech','Keep independent words and talkers outside training. Compare transfer with equal-duration general training and test retention four weeks later.']
  ],
  example:'Request a change along X while keeping Y fixed. The system selects the closest available recording and shows how far it is from your request.',
  technical:'<p><strong>X:</strong> spectral descriptor distance from the familiar reference. <strong>Y:</strong> distance in temporal summaries. <strong>Z:</strong> target-to-masker ratio, from +12 to −12 dB. The global view uses bank coordinates instead of personal distances.</p><p>R³ and T³ describe related aspects of the same sound. Two plot axes do not establish two independent perceptual channels. The speech feature set, temporal windows, alignment, scaling and distance metric still need to be fixed and validated.</p><p>The F0 filter compares the voiced-pitch P10, median and P90 in semitones. All three must fit the chosen tolerance; missing F0 or personal labels excludes a recording. The default 3-semitone limit is illustrative. The full pitch contour can still differ.</p><p>The displayed nearest-neighbour rule uses normalized X/Y distance. Research use also requires matched words, naturalness and level checks, full feature vectors, control of other acoustic changes and a maximum allowed step size. If coverage is sparse, more recordings are needed.</p>',
  note:'This page demonstrates the bank and its response-guided loop. Text comparison is interactive; audio trials, listener modelling, generation and background mixing are not active.'
}),'MI-STM · OVERVIEW');}

function anchorDetails(){
  const a=selection.anchor;if(!a)return;
  const f0=a.f0?a.f0.median.toFixed(1)+' Hz':'unmeasured';
  dialog('Recording '+a.id,explanation({
    lead:'An anchor is one stored recording chosen for a position on the map.',
    steps:[
      ['The position you requested',`X = ${state.x.toFixed(2)} and Y = ${state.y.toFixed(2)}. The sliders specify where you want to go.`],
      ['The closest available recording',`This record is at X = ${a.x.toFixed(3)} and Y = ${a.y.toFixed(3)}. The gap from your request is ${selection.error.toFixed(3)} in map units.`],
      ['Its pitch match',`Reference median: ${bank.reference.f0.median.toFixed(1)} Hz. Recording median: ${f0}. ${a.eligible?'It passes the current F0 filter.':'It is excluded from personal routes.'}`]
    ],
    technical:`<p><strong>Reference:</strong> ${escapeHtml(pool.reference_id)}.<br><strong>Sentence group:</strong> ${escapeHtml(a.text_id)}.<br><strong>Coordinate definition:</strong> ${escapeHtml(pool.distance_definition)}</p><p>The F0 filter compares P10, median and P90, not only the median. Maximum difference: ${a.f0Deviation==null?'unknown':a.f0Deviation.toFixed(2)+' semitones'}. Allowed difference: ${state.f0Tolerance.toFixed(1)} semitones. This is a design setting, not a clinical threshold.</p><p>Selection uses normalized Euclidean distance. A small map gap does not guarantee perceptual similarity. A research version must also check linguistic content, naturalness, other acoustic changes and allowed step size.</p><p><a href="./example-pool.json" download>Download an example bank file ↗</a></p>`,
    extra:a.audio_url?`<div class="explanation-audio"><span>LISTEN TO THIS RECORDING</span><audio controls preload="none" src="${escapeHtml(a.audio_url)}"></audio><p>Playback uses the recording alone. The background control is visual.</p></div>`:'',
    note:pool.status==='schematic'?'This is an illustrative record. No audio file or MI measurement is attached.':'These values come from the imported file. The app has not independently verified their measurement provenance.'
  }),'MI-STM · SELECTED ANCHOR');
}
function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
const pipelineNotes={
  generator:{title:'Create the recordings',kicker:'01 · ELEVENLABS',html:explanation({
    lead:'Generate matched-content utterances across selected talkers and synthesis settings. Retain each output as a versioned recording.',
    steps:[
      ['Keep the words the same','Matching the sentence lets us compare how voices sound and how they unfold over time.'],
      ['Generate several versions','Use different voices and settings to create a wide range of candidates.'],
      ['Measure what was produced','Send the actual audio to R³/T³. A generator setting does not tell us exactly where a recording belongs on the map.']
    ],
    example:'The same sentence, spoken by several voices at different speeds, gives the bank several recordings to compare.',
    technical:'<p>The draft batch plan is 32 voices × 48 sentences × 6 settings × 2 repetitions: 18,432 recordings before filtering. This batch has not been generated.</p><p>Keep the model and voice version, settings, sentence ID, output hash, seed where available and voice-use permission with each file. Check linguistic content and recording quality before inclusion.</p><p><a href="https://elevenlabs.io/docs/eleven-creative/playground/text-to-speech" target="_blank" rel="noopener">ElevenLabs generation documentation ↗</a></p>'
  })},
  measure:{title:'Measure each recording',kicker:'02 · R³ / T³',html:explanation({
    lead:'To choose a useful next recording, we first need to know what changed in the sound.',
    steps:[
      ['Describe its spectral shape','R³ provides acoustic features. A selected set describes how sound energy is distributed across frequency.'],
      ['Describe how it changes over time','T³ summarizes how those features develop across time windows.'],
      ['Keep the two differences separate','Compare each recording with the familiar reference. X shows spectral distance; Y shows temporal distance.']
    ],
    example:'Two versions can use the same words but differ in spectral shape, timing, or both. Separate X/Y values make that distinction visible.',
    technical:'<p>Fix the speech feature subset, temporal windows, linguistic alignment, normalization and distance metric before use. Personal distances must be calculated from the full descriptors, not from distances in a lossy 2D projection.</p><p>R³ features vary over time; T³ summarizes that variation. The axes are related descriptions, not proof of independent biological channels. Acoustic distance alone does not measure intelligibility, attention or familiarity.</p>'
  })},
  pool:{title:'Build the speech bank',kicker:'03 · SPEECH BANK',html:explanation({
    lead:'The speech bank is a library of recordings. Each recording has an audio file and measurements that describe its sound.',
    steps:[
      ['Keep usable recordings','Check that the words are correct and the speech sounds natural. Group recordings that say the same sentence.'],
      ['Give each recording a place','Store its spectral, temporal and pitch measurements. These let us find candidates for different parts of the map.'],
      ['Choose the next recording','A move on the map selects an existing recording. If no suitable recording is available, the bank needs more candidates.']
    ],
    example:'Each point denotes a stored recording. A trajectory specifies the ordered sequence selected from the bank.',
    technical:'<p>Build the bank before choosing a listener’s familiar reference. Store the audio hash, sentence ID, voice ID, generation settings, R³/T³ configuration, full descriptors, F0 summaries and quality checks.</p><p>For a personal map, add distances relative to that reference and apply its F0 filter. The same bank can therefore supply different routes for different listeners.</p><p>The demo contains 1,024 illustrative records from 32 voice IDs. A local JSON file can supply 2–20,000 records for one matched sentence group, up to 10 MB. Importing a file does not verify its measurements.</p>'
  })},
  personal:{title:'Start with a familiar voice',kicker:'04 · FAMILIAR REFERENCE',html:explanation({
    lead:'Use a voice the listener already knows, or one they have learned, as the starting point for the map.',
    steps:[
      ['Establish that the voice is familiar','Use several utterances and check recognition with the listener. Acoustic similarity alone cannot establish familiarity.'],
      ['Keep the pitch range close','Measure the voice’s fundamental frequency, F0. Exclude recordings outside the allowed range even if their spectral shape is similar.'],
      ['Find nearby recordings','Measure spectral and temporal differences from this voice. Select a sequence that gradually moves away from it.']
    ],
    example:'A recording may be close to one listener’s familiar voice and far from another’s. Its position depends on the chosen reference.',
    technical:'<p>Compare reference and candidate voiced-F0 P10, median and P90 in semitones. Every difference must stay within the chosen tolerance. The interface starts at 3 semitones; this is illustrative and requires pilot validation.</p><p>Missing F0 or personal labels excludes a recording. Production also requires pitch-tracking confidence, voiced-frame coverage and octave-error checks with matched phonetic material. Matching these summaries does not match the complete pitch contour or infer a speaker’s sex.</p><p>Listener responses determine which transitions are easy or hard. MI supplies stimulus coordinates; it does not infer learning or benefit from them.</p>'
  })}
};

try{space=new ListeningSpace($('#spaceMount'),$('#axisLabels'),{...state,anchor:selection.anchor,pool});}catch(e){$('#webglFallback').hidden=false;console.warn('3D rendering unavailable:',e.message);}
$('#speechShapeInspect').disabled=!space;
adaptiveLoop=new AdaptiveLoop($('#adaptiveLoop'),{dialog});
researchBrief=new ResearchBrief($('#researchBrief'),{dialog});
$('#briefSourcesButton').addEventListener('click',()=>researchBrief.library());

for(const [key,id] of [['x','spectral'],['y','temporal'],['z','masking']])$('#'+id).addEventListener('input',e=>{stopRoute();state[key]=Number(e.target.value);if(key!=='z')state.followingRoute=false;update();});
$$('[data-masker]').forEach(b=>b.addEventListener('click',()=>{state.masker=b.dataset.masker;update({immediate:true});}));
$('#resetParameters').addEventListener('click',()=>{stopRoute();Object.assign(state,{x:state.mapMode==='personal'?0:bank.reference.x,y:state.mapMode==='personal'?0:bank.reference.y,z:.3,progress:0,reverse:false,followingRoute:state.mapMode==='personal'});update();showToast('Reset to the familiar-reference position.');});
$('#orbitButton').addEventListener('click',()=>{if(!space)return;space.auto=!space.auto;$('#orbitButton').classList.toggle('active',space.auto);});
$('#viewButton').addEventListener('click',()=>{if(space)$('#viewButton').classList.toggle('active',space.toggleView());});
$('#resetCamera').addEventListener('click',()=>{space?.reset();$('#viewButton').classList.remove('active');});
function toggleSpeechInspector(open){
  $('#speechShapeInspector').hidden=!open;$('#speechShapeInspect').setAttribute('aria-expanded',String(open));
  $('#speechShapeInspector').closest('.space-panel').classList.toggle('speech-open',open);
  if(space)space.speechShape.visible=open;
  if(open&&space){space.speechShape.inspect($('#speechShapeCanvas'));space.speechShape.render();}
}
$('#speechShapeInspect').addEventListener('click',()=>toggleSpeechInspector($('#speechShapeInspector').hidden));
$('#closeSpeechShape').addEventListener('click',()=>{toggleSpeechInspector(false);$('#speechShapeInspect').focus();});
$('#speechShapeInspector').addEventListener('keydown',e=>{if(e.key==='Escape'){toggleSpeechInspector(false);$('#speechShapeInspect').focus();}});
$$('[data-route]').forEach(b=>b.addEventListener('click',()=>{stopRoute();state.route=b.dataset.route;followRoute();update();}));
$('#routeProgress').addEventListener('input',e=>{stopRoute();state.progress=Number(e.target.value);followRoute();update();});
$('#reverseRoute').addEventListener('click',()=>{stopRoute();state.reverse=!state.reverse;state.progress=1-state.progress;followRoute();update();});
$('#animateRoute').addEventListener('click',()=>{if(routeRunning){stopRoute();update({immediate:true});return;}if(!state.followingRoute||state.progress>=.999)state.progress=0;followRoute();update();if(!selection.anchor)return;routeRunning=true;routeLast=performance.now();$('#animateRoute').textContent='Ⅱ';$('#animateRoute').setAttribute('aria-label','Pause selected route');if(reduced)showToast('User-initiated route animation. Pause or use the progress slider at any time.');});
$('#architectureButton').addEventListener('click',methods);$('#methodsButton').addEventListener('click',methods);$('#anchorInfo').addEventListener('click',anchorDetails);$('#inspectAnchor').addEventListener('click',anchorDetails);
$('#closeDialog').addEventListener('click',()=>$('#detailDialog').close());$('#detailDialog').addEventListener('click',e=>{if(e.target===$('#detailDialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
async function fullscreen(){try{if(!document.fullscreenElement){await document.documentElement.requestFullscreen();showToast('Presentation mode · F or Esc to leave fullscreen');}else await document.exitFullscreen();}catch{showToast('Use your browser’s fullscreen command to present.');}}
$('#presentButton').addEventListener('click',fullscreen);
document.addEventListener('keydown',e=>{if($('#detailDialog').open||['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;if(e.key.toLowerCase()==='f')fullscreen();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopRoute();}});
let lastUi=0;
function frame(now){requestAnimationFrame(frame);if(document.hidden)return;
  if(routeRunning&&now-lastUi>70){state.progress=Math.min(1,state.progress+(now-routeLast)/14000);routeLast=now;lastUi=now;Object.assign(state,routePoint(state.progress,state.route,state.reverse));update();if(state.progress>=1){stopRoute();update();}}
}

requestAnimationFrame(frame);
if(!location.hash)history.replaceState(null,'','#space');
update();
toggleSpeechInspector(Boolean(space));
// Local diagnostics contain no participant data.
window.morphDiagnostics=()=>({state:{...state},webgl:!!space,poolStatus:pool.status,candidateCount:pool.candidates.length,reference:pool.reference_id,selectedAnchor:selection.anchor?.id??null,selectionError:selection.error,routeRunning});
for(const [id,key] of [['generatorStage','generator'],['measureStage','measure'],['poolStage','pool'],['personalStage','personal']])$('#'+id).addEventListener('click',()=>{const n=pipelineNotes[key];dialog(n.title,n.html,n.kicker);});
$('#loadPool').addEventListener('click',()=>$('#poolFile').click());
$('#poolFile').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>10_000_000)throw new Error('Manifest size limit: 10 MB.');bank=validatePool(JSON.parse(await file.text()));refreshPool();stopRoute();update();showToast('Loaded '+bank.candidates.length+' candidates; imported measurements are not independently verified.');}catch(error){showToast('Pool was not loaded: '+error.message);}finally{e.target.value='';}});
$('#resetPool').addEventListener('click',()=>{bank=illustrativePool();refreshPool();stopRoute();update();showToast('Restored the schematic speech bank.');});

$$('[data-map]').forEach(b=>b.addEventListener('click',()=>{stopRoute();state.mapMode=b.dataset.map;refreshPool();state.followingRoute=state.mapMode==='personal';if(state.followingRoute)followRoute();else Object.assign(state,{x:bank.reference.x,y:bank.reference.y});update();}));
$('#f0Tolerance').addEventListener('input',e=>{stopRoute();state.f0Tolerance=Number(e.target.value);refreshPool();update();});
