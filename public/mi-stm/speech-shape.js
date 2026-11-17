import {speechShape,f0At,formantsAt,harmonicWeight,harmonicAmplitudes,aperiodicSpectrum} from './speech-shape-model.js';

const BLUE='#22668f',AMBER='#a06025',INK='#253d50',MUTED='#637887',F0='#78e0be';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export class SpeechShape {
  constructor(){
    this.canvas=document.createElement('canvas');this.canvas.width=1200;this.canvas.height=1050;
    this.status='ready';this.state={};this.dirty=true;this.visible=false;
  }
  update(state){
    // A live drawing of requested settings, independent of selected-bank audio.
    const next={x:state.x,y:state.y,anchor:state.anchor?.id??null,masker:state.masker,tmr:12-24*state.z,
      referenceF0:state.pool?.reference?.f0?.median??145,tolerance:state.f0Tolerance??3};
    const key=JSON.stringify(next);if(key!==this.key){this.key=key;this.state=next;this.dirty=true;}
  }
  render(){
    if(!this.visible||!this.dirty||!this.state.referenceF0)return false;this.dirty=false;
    this.shape=speechShape(this.state.x,this.state.y,this.state.referenceF0,this.state.tolerance);
    this.draw(this.shape);return true;
  }
  draw(d){
    const c=this.canvas.getContext('2d'),L=98,T=210,W=1030,H=435;
    const px=t=>L+t/d.extent*W,py=f=>T+H-f/d.maxHz*H;
    const text=(s,x,y,size=24,color=MUTED,align='left')=>{c.fillStyle=color;c.font=`${size}px Arial`;c.textAlign=align;c.fillText(s,x,y);};
    c.fillStyle='#fafcfd';c.fillRect(0,0,1200,1050);
    text('PARAMETRIC SPEECH STRUCTURE',52,64,33,INK);
    text('Procedural 2D drawing · not measured bank audio',52,104,23,MUTED);
    text(`X ${d.x.toFixed(2)}  ·  spectral envelope`,L,160,23,BLUE);
    text(`Y ${d.y.toFixed(2)}  ·  syllable timing`,1128,160,23,AMBER,'right');
    c.fillStyle='#101d31';c.fillRect(L,T,W,H);
    for(const f of [0,1000,2000,3000,4000,5000,6000]){
      c.strokeStyle='#ffffff12';c.lineWidth=1.2;c.beginPath();c.moveTo(L,py(f));c.lineTo(L+W,py(f));c.stroke();
      text(String(f/1000),L-17,py(f)+8,22,MUTED,'right');
    }
    for(let t=0;t<=3;t+=.5){c.strokeStyle='#ffffff12';c.beginPath();c.moveTo(px(t),T);c.lineTo(px(t),T+H);c.stroke();text(t.toFixed(1),px(t),T+H+33,23,MUTED,'center');}
    c.save();c.translate(31,T+H/2);c.rotate(-Math.PI/2);text('Frequency (kHz)',0,0,23,BLUE,'center');c.restore();
    // Each harmonic is drawn at h × F0(t). No image or STFT scaffold is sampled.
    c.save();c.beginPath();c.rect(L,T,W,H);c.clip();
    for(const event of d.events){
      this.drawConsonant(c,d,event,px,py);
      const steps=48,voicedDuration=event.end-event.voiceStart,maxH=Math.floor(d.maxHz/(d.minF0*.98));
      for(let h=maxH;h>=1;h--)for(let j=0;j<steps;j++){
        const a=j/steps,b=(j+1)/steps,u=(a+b)/2,weight=harmonicWeight(d,event,u,h);if(weight<.035)continue;
        const intensity=clamp(weight*1.7,0,1),r=110+145*intensity,g=91+135*intensity,bl=157-55*intensity;
        c.strokeStyle=`rgba(${r},${g},${bl},${.07+.93*intensity})`;c.lineWidth=.9+3.3*intensity;
        c.beginPath();c.moveTo(px(event.voiceStart+a*voicedDuration),py(h*f0At(d,event,a)));
        c.lineTo(px(event.voiceStart+b*voicedDuration),py(h*f0At(d,event,b)));c.stroke();
      }
      // Three vocal-tract resonance trajectories, distinct from the harmonics.
      for(let f=0;f<3;f++){
        c.beginPath();for(let j=0;j<=48;j++){const u=j/48,x=px(event.voiceStart+u*voicedDuration),y=py(formantsAt(d,event,u)[f]);j?c.lineTo(x,y):c.moveTo(x,y);}
        c.setLineDash([7,6]);c.strokeStyle='#84bad870';c.lineWidth=2;c.stroke();c.setLineDash([]);
      }
      c.beginPath();for(let j=0;j<=48;j++){const u=j/48,x=px(event.voiceStart+u*voicedDuration),y=py(f0At(d,event,u));j?c.lineTo(x,y):c.moveTo(x,y);}
      c.strokeStyle=F0;c.lineWidth=1.8;c.setLineDash([5,5]);c.stroke();c.setLineDash([]);
    }
    c.restore();
    // The same mid-vowel slice at fixed n × F0: only bar heights change with X.
    const reference=speechShape(0,d.y,d.referenceF0,d.tolerance);
    const original=harmonicAmplitudes(reference,reference.events[0],.5),current=harmonicAmplitudes(d,d.events[0],.5);
    text('SPECTRAL AMPLITUDE',L,716,24,BLUE);
    text(`F0 LOCKED · ${d.referenceF0.toFixed(0)} Hz`,1128,716,23,'#2d7a71','right');
    text('Blue: harmonic /ɑ/ · violet: aperiodic /s/ · grey: X = 0',L,745,21,MUTED);
    const harmonicWidth=W*.58,count=Math.min(32,current.length),step=harmonicWidth/count,barWidth=step*.7,baseline=838;
    c.fillStyle='#edf3f7';c.fillRect(L,754,W,86);
    for(let i=0;i<count;i++){
      const left=L+i*step+(step-barWidth)/2;
      c.fillStyle='#bbc8d2';c.fillRect(left,baseline-original[i]*82,barWidth,original[i]*82);
      c.fillStyle=BLUE;c.fillRect(left+barWidth*.2,baseline-current[i]*82,barWidth*.6,current[i]*82);
      if(i===0||(i+1)%4===0)text(`${i+1}×`,L+(i+.5)*step,860,19,MUTED,'center');
    }
    const noiseLeft=L+harmonicWidth+35,noiseWidth=W-harmonicWidth-35;
    const noise=aperiodicSpectrum(d,d.events[1]),noiseReference=aperiodicSpectrum(reference,reference.events[1]);
    c.fillStyle='#d8e0e7';c.fillRect(noiseLeft-18,762,1,72);
    for(const [spectrum,color,fill] of [[noiseReference,'#a6b5c2',false],[noise,'#7868a3',true]]){
      c.beginPath();c.moveTo(noiseLeft,baseline);
      spectrum.amplitudes.forEach((a,i)=>c.lineTo(noiseLeft+(i+.5)/spectrum.amplitudes.length*noiseWidth,baseline-a*390));
      c.lineTo(noiseLeft+noiseWidth,baseline);
      if(fill){c.closePath();c.fillStyle='#7868a32e';c.fill();}
      c.strokeStyle=color;c.lineWidth=2.5;c.stroke();
    }
    for(const khz of [0,2,4,6])text(`${khz}${khz===6?' kHz':''}`,noiseLeft+khz/6*noiseWidth,860,19,MUTED,khz===6?'right':khz===0?'left':'center');
    text('PHONETIC EVENTS / RHYTHM',L,894,24,AMBER);text('Fixed 3 s axis · individual durations and gaps',1128,894,21,MUTED,'right');
    for(const e of d.events){
      c.fillStyle='#d8e0e7';c.fillRect(px(e.start),913,px(e.voiceStart)-px(e.start),40);
      c.fillStyle='#e7bc88';c.fillRect(px(e.voiceStart),913,px(e.end)-px(e.voiceStart),40);
      text(e.label,px((e.start+e.end)/2),942,23,'#604725','center');
    }
    text('Green: fixed F0 · line intensity: amplitude · dashed blue: formants',52,999,22,MUTED);
    text('Violet bands: aperiodic consonant energy · external masker remains in the cube',52,1031,21,MUTED);
    if(this.inspectCanvas)this.copyToInspector();
  }
  drawConsonant(c,d,e,px,py){
    if(e.kind==='nasal')return;
    let seed=8171+e.index*7937;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    const stop=e.kind==='stop',spectrum=aperiodicSpectrum(d,e);
    const start=stop?e.start+e.consonant*.65:e.start,end=e.voiceStart;
    const columns=Math.max(5,Math.ceil((px(end)-px(start))/1.8)),width=(px(end)-px(start))/columns;
    // Continuous, non-harmonic frequency bins with deterministic microtexture.
    // Fixed grain positions ensure X changes the envelope, not random jitter.
    for(let j=0;j<columns;j++){
      const phase=(j+.5)/columns,temporal=stop?Math.exp(-3.8*phase):Math.sin(Math.PI*phase)**.18;
      spectrum.amplitudes.forEach((a,i)=>{
        const intensity=clamp(a*4.2,0,1)*temporal*(.45+.55*rand());
        c.fillStyle=`rgba(175,164,222,${intensity})`;
        c.fillRect(px(start)+j*width,py((i+1)*spectrum.step),width+.3,py(i*spectrum.step)-py((i+1)*spectrum.step)+.2);
      });
    }
  }
  copyToInspector(){const el=this.inspectCanvas;el.width=1200;el.height=1050;el.getContext('2d').drawImage(this.canvas,0,0);}
  inspect(canvas){this.inspectCanvas=canvas;this.visible=true;this.dirty=true;this.render();}
}
