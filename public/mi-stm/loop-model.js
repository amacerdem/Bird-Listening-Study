// Text alignment for an explicitly illustrative response preview, not a clinical score.
export function words(text) {
  return String(text).normalize('NFKC').toLocaleLowerCase('en-US').match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu) || [];
}

export function alignResponse(target, response) {
  const a = words(target), b = words(response);
  const d = Array.from({length:a.length+1},()=>Array(b.length+1).fill(0));
  for(let i=0;i<=a.length;i++) d[i][0]=i;
  for(let j=0;j<=b.length;j++) d[0][j]=j;
  for(let i=1;i<=a.length;i++) for(let j=1;j<=b.length;j++)
    d[i][j]=Math.min(d[i-1][j-1]+(a[i-1]===b[j-1]?0:1),d[i-1][j]+1,d[i][j-1]+1);
  const alignment=[]; let i=a.length,j=b.length;
  while(i||j) {
    if(i&&j&&d[i][j]===d[i-1][j-1]+(a[i-1]===b[j-1]?0:1)) {
      alignment.push({target:a[--i],response:b[--j],type:a[i]===b[j]?'match':'substitution'});
    } else if(i&&d[i][j]===d[i-1][j]+1) alignment.push({target:a[--i],response:null,type:'omission'});
    else alignment.push({target:null,response:b[--j],type:'insertion'});
  }
  return {rawResponse:String(response),alignment:alignment.reverse(),edits:d[a.length][b.length],targetWords:a.length};
}

export const CONTRASTS = {
  frication: {name:'/s/ ↔ /ʃ/',label:'Frication',spectral:'Frication spectrum',temporal:'Frication duration',joint:'Consonant–vowel transitions',words:['sip','ship','sore','shore'],note:'Both consonants are aperiodic. Their spectral shape carries phonetic information.'},
  stop: {name:'/t/ ↔ /k/',label:'Place of articulation',spectral:'Release-burst spectrum',temporal:'Release-to-vowel timing',joint:'Formant-transition trajectory',words:['tea','key','tame','came'],note:'Inspect the release and the following vowel together. Context changes the available cues.'},
  voicing: {name:'/p/ ↔ /b/',label:'Voicing',spectral:'Onset spectral structure',temporal:'Voice-onset time',joint:'Voicing onset and F0 trajectory',words:['pat','bat','pear','bear'],note:'Timing, aspiration and vowel onset covary. Cue effects require matched, validated stimuli.'}
};

export function draftRequest(context, contrast, response) {
  const c=CONTRASTS[contrast];
  return {
    schema_version:'mi-stm-training-draft/1.0',status:'design_preview_not_submitted',
    provenance:'Illustrative contrast selection and text-scoring preview; no listening trial or fitted listener model.',
    anchor_context:context,
    contrast:{id:contrast,phonemes:c.name,example_words:c.words,spectral_cue:c.spectral,temporal_cue:c.temporal,joint_cue:c.joint},
    proposed_local_features:['Harmonicity / aperiodicity','Spectral envelope and phoneme-relevant spectral shape','Temporal landmarks, durations and envelope','Spectrotemporal transitions across neighboring phonemes'],
    response_preview:response||null,
    production_plan:['Generate matched-content candidate recordings','Verify text and pronunciation','Measure clean-target spectral and temporal features','Apply reference-relative labels and F0 gate','Select candidates with controlled nuisance features','Mix a separately specified masker'],
    constraints:{f0_gate:'P10, median and P90 within reference tolerance',harmonicity:'Descriptor, not a universal difficulty score',phoneme_timing:'Requires validated phonetic alignment',no_direct_waveform_morph:true},
    learning_plan:{duration:'4–6 weeks, proposed',selection:'Update from repeated listener responses with uncertainty',transfer:'Untrained words, recordings and talkers; independent test set',retention:'4 weeks after training; compare with dose-matched general training'},
    api_request:null
  };
}
