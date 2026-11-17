import * as THREE from 'three';
import {OrbitControls} from './vendor/OrbitControls.js';
import {routePoint,tmrDb,dbText} from './model.js';
import {nearestAnchor} from './pool.js';
import {SpeechShape} from './speech-shape.js';

const S=0x205A8A,T=0x975223,Z=0x66717C;
const position=(x,y,z)=>new THREE.Vector3((x-.5)*3.25,(z-.5)*2.55,(.5-y)*3.25);

export class ListeningSpace {
  constructor(mount,labels,state){
    this.mount=mount;this.labels=labels;this.state={...state};this.auto=false;this.top=false;this.active=true;this.last=0;this.labelNodes=[];
    this.scene=new THREE.Scene();
    this.camera=new THREE.PerspectiveCamera(36,1,.1,40);
    this.camera.position.set(4.7,3.3,5.7);this.camera.lookAt(0,-.06,0);
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.75));this.renderer.setClearColor(0xFFFFFF,0);
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.renderer.domElement.setAttribute('aria-hidden','true');mount.appendChild(this.renderer.domElement);
    this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.target.set(0,-.08,0);this.controls.enableDamping=true;this.controls.dampingFactor=.08;this.controls.enablePan=false;this.controls.minDistance=6;this.controls.maxDistance=13;this.controls.maxPolarAngle=Math.PI*.79;this.controls.autoRotateSpeed=.4;
    this.controls.addEventListener('start',()=>this.auto=false);
    this.scene.add(new THREE.AmbientLight(0xffffff,2));
    const light=new THREE.PointLight(0x975223,18,10);light.position.set(1,3,3);this.scene.add(light);
    this.buildVolume();this.buildMarkers();this.buildPool(state.pool);this.buildLabels();this.resize();
    this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(mount);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)this.last=0;});
    this.frame=this.frame.bind(this);this.update(state);requestAnimationFrame(this.frame);
  }
  line(points,color,opacity=1,dashed=false){
    const g=new THREE.BufferGeometry().setFromPoints(points);
    const m=dashed?new THREE.LineDashedMaterial({color,transparent:true,opacity,dashSize:.035,gapSize:.045}):new THREE.LineBasicMaterial({color,transparent:true,opacity});
    const o=new THREE.Line(g,m);if(dashed)o.computeLineDistances();return o;
  }
  buildVolume(){
    const box=new THREE.EdgesGeometry(new THREE.BoxGeometry(3.25,2.55,3.25));
    this.scene.add(new THREE.LineSegments(box,new THREE.LineBasicMaterial({color:0x205A8A,transparent:true,opacity:.34})));
    // Empty coordinate lattice: this volume contains stimulus settings, never participant data.
    const lattice=new THREE.Group();
    for(let i=0;i<=8;i++){
      const u=i/8;
      lattice.add(this.line([position(u,0,0),position(u,1,0)],0x205A8A,.16));
      lattice.add(this.line([position(0,u,0),position(1,u,0)],0x205A8A,.16));
      lattice.add(this.line([position(0,1,u),position(1,1,u)],0x798591,.11));
      lattice.add(this.line([position(u,1,0),position(u,1,1)],0x798591,.11));
    }
    this.scene.add(lattice);
    const base=new THREE.Mesh(new THREE.PlaneGeometry(3.25,3.25),new THREE.MeshBasicMaterial({color:0x205A8A,transparent:true,opacity:.025,side:THREE.DoubleSide,depthWrite:false}));base.rotation.x=-Math.PI/2;base.position.y=-1.275;this.scene.add(base);
    this.slice=new THREE.Group();
    const plane=new THREE.Mesh(new THREE.PlaneGeometry(3.25,3.25),new THREE.MeshBasicMaterial({color:0x205A8A,transparent:true,opacity:.022,side:THREE.DoubleSide,depthWrite:false}));plane.rotation.x=-Math.PI/2;this.slice.add(plane);
    for(let i=0;i<=8;i++){
      const u=i/8;
      this.slice.add(this.line([new THREE.Vector3((u-.5)*3.25,0,1.625),new THREE.Vector3((u-.5)*3.25,0,-1.625)],S,.20));
      this.slice.add(this.line([new THREE.Vector3(-1.625,0,(.5-u)*3.25),new THREE.Vector3(1.625,0,(.5-u)*3.25)],T,.20));
    }
    this.slice.add(this.line([new THREE.Vector3(-1.625,0,1.625),new THREE.Vector3(1.625,0,1.625),new THREE.Vector3(1.625,0,-1.625),new THREE.Vector3(-1.625,0,-1.625),new THREE.Vector3(-1.625,0,1.625)],S,.27));
    this.scene.add(this.slice);
    this.scene.add(this.line([position(0,0,0),position(1.16,0,0)],S,.85));
    this.scene.add(this.line([position(0,0,0),position(0,1.16,0)],T,.8));
    this.scene.add(this.line([position(0,0,0),position(0,0,1.2)],Z,.85));
    for(let i=0;i<=4;i++){
      const u=i/4;
      let p=position(u,0,0);this.scene.add(this.line([p.clone().add(new THREE.Vector3(0,0,.035)),p.clone().add(new THREE.Vector3(0,0,-.035))],S,.8));
      p=position(0,u,0);this.scene.add(this.line([p.clone().add(new THREE.Vector3(-.035,0,0)),p.clone().add(new THREE.Vector3(.035,0,0))],T,.8));
      p=position(0,0,u);this.scene.add(this.line([p.clone().add(new THREE.Vector3(-.035,0,0)),p.clone().add(new THREE.Vector3(.035,0,0))],Z,.8));
    }
    const dots=[],colors=[];const cs=new THREE.Color(S),ct=new THREE.Color(T),cz=new THREE.Color(Z);
    for(let z=0;z<=4;z++)for(let y=0;y<=8;y++)for(let x=0;x<=8;x++){
      const p=position(x/8,y/8,z/4);dots.push(p.x,p.y,p.z);const c=cs.clone().lerp(ct,y/8).lerp(cz,z/4*.65);colors.push(c.r,c.g,c.b);
    }
    const dg=new THREE.BufferGeometry();dg.setAttribute('position',new THREE.Float32BufferAttribute(dots,3));dg.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
    this.scene.add(new THREE.Points(dg,new THREE.PointsMaterial({size:.018,vertexColors:true,transparent:true,opacity:.32,depthWrite:false})));
    this.pathGroup=new THREE.Group();this.scene.add(this.pathGroup);
    const glowCanvas=document.createElement('canvas');glowCanvas.width=128;glowCanvas.height=128;const c=glowCanvas.getContext('2d');const gr=c.createRadialGradient(64,64,1,64,64,64);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.38,'rgba(255,255,255,.9)');gr.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=gr;c.fillRect(0,0,128,128);
    this.glowTexture=new THREE.CanvasTexture(glowCanvas);
    this.buildMaskerField();
    this.speechShape=new SpeechShape();
  }
  buildMaskerField(){
    // Procedural visual metaphor for competition, not an audio-derived spectrogram.
    // Target coordinates and F0 eligibility never depend on these particles.
    const count=9000,seeds=new Float32Array(count*3),sizes=new Float32Array(count);
    let seed=91037;const random=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};
    for(let i=0;i<count;i++){seeds[i*3]=random();seeds[i*3+1]=random();seeds[i*3+2]=random();sizes[i]=1.3+3.5*random();}
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.BufferAttribute(seeds,3));
    geometry.setAttribute('aSize',new THREE.BufferAttribute(sizes,1));
    this.maskerMaterial=new THREE.ShaderMaterial({
      uniforms:{uLevel:{value:.3},uSpeech:{value:0},uTime:{value:0},uMotion:{value:window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:1},uPixelRatio:{value:this.renderer.getPixelRatio()}},
      transparent:true,depthWrite:false,depthTest:true,blending:THREE.NormalBlending,
      vertexShader:`
        attribute float aSize;
        uniform float uLevel,uSpeech,uTime,uMotion,uPixelRatio;
        varying float vAlpha,vShade;
        void main(){
          float x=position.x,y=position.y,d=position.z;
          float drift=uTime*.055*uMotion;
          float grain=.5+.5*sin(x*39.0+y*17.0+sin(y*23.0+x*9.0));
          float broad=.38+.34*sin(x*7.8+y*3.6)*sin(y*9.5-x*3.0)+.28*grain;
          float burst=.35+.65*pow(.5+.5*sin(x*18.0+sin(x*8.0)),2.0);
          float harmonics=pow(.5+.5*cos(y*100.0+sin(x*12.0)*2.6),5.0);
          float voice=.22+.78*burst*(.22+.78*harmonics);
          float field=mix(broad,voice,uSpeech);
          float edge=smoothstep(0.0,.09,x)*smoothstep(0.0,.09,1.0-x)*smoothstep(0.0,.09,y)*smoothstep(0.0,.09,1.0-y);
          float height=.20+2.23*uLevel;
          // Stack irregular spectral ridges through a bounded volume; higher Z
          // increases occupied depth and optical density, not measured energy.
          vec3 p=vec3((x-.5)*3.16,-1.22+height*d,(.5-y)*3.16);
          p.y+=.10*sin(x*15.0+y*10.0+drift)*sin(d*3.14159);
          p.x+=.028*sin(d*21.0+y*13.0+drift);
          p.z+=.028*cos(d*17.0+x*11.0+drift);
          vec4 mvPosition=modelViewMatrix*vec4(p,1.0);
          gl_Position=projectionMatrix*mvPosition;
          gl_PointSize=clamp(aSize*uPixelRatio*(9.0/-mvPosition.z),1.0,9.0);
          float density=smoothstep(d-.12,d+.20,field);
          vAlpha=edge*density*(.13+.52*uLevel);
          vShade=.16+.15*d+.08*grain;
        }
      `,
      fragmentShader:`
        varying float vAlpha,vShade;
        void main(){
          float r=length(gl_PointCoord-vec2(.5));
          float alpha=(1.0-smoothstep(.10,.50,r))*vAlpha;
          if(alpha<.012)discard;
          gl_FragColor=vec4(vec3(vShade),alpha);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `
    });
    this.maskerCloud=new THREE.Points(geometry,this.maskerMaterial);
    this.maskerCloud.frustumCulled=false;
    this.maskerCloud.renderOrder=1;
    this.scene.add(this.maskerCloud);
  }
  buildPool(pool){
    if(!pool)return;this.poolRef=pool;
    if(this.poolGroup){this.clear(this.poolGroup);this.scene.remove(this.poolGroup);}
    this.poolGroup=new THREE.Group();this.scene.add(this.poolGroup);
    const coords=[],ghosts=[],colors=[],ghostColors=[];const a=new THREE.Color(S),b=new THREE.Color(T),zColor=new THREE.Color(Z);
    const stride=Math.max(1,Math.ceil(pool.candidates.length/2500));
    pool.candidates.forEach((p,index)=>{if(index%stride)return;const v=position(p.x,p.y,.5);coords.push(v.x,0,v.z);const color=p.eligible?a.clone().lerp(b,p.y*.65):new THREE.Color(0x798591);colors.push(color.r,color.g,color.b);
      for(const z of [0,.5,1]){const v=position(p.x,p.y,z);ghosts.push(v.x,v.y,v.z);const col=color.clone().lerp(zColor,z*.8);ghostColors.push(col.r,col.g,col.b);}
    });
    const make=(pts,col,opacity,size)=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));const m=new THREE.PointsMaterial({size,map:this.glowTexture,vertexColors:true,transparent:true,opacity,depthWrite:false,blending:THREE.NormalBlending});return new THREE.Points(g,m);};
    this.activeCloud=make(coords,colors,1,.105);this.poolGroup.add(this.activeCloud);
    this.poolGroup.add(make(ghosts,ghostColors,.27,.06));
    this.pathKey='';
  }
  buildMarkers(){
    this.cursor=new THREE.Group();
    this.cursor.add(new THREE.Mesh(new THREE.SphereGeometry(.052,24,16),new THREE.MeshBasicMaterial({color:0x123F64})));
    const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:this.glowTexture,color:S,transparent:true,depthWrite:false,blending:THREE.NormalBlending}));sprite.scale.set(.72,.72,1);this.cursor.add(sprite);this.glow=sprite;sprite.visible=false;
    for(let i=0;i<3;i++){const ring=new THREE.Mesh(new THREE.TorusGeometry(.102,.004,6,60),new THREE.MeshBasicMaterial({color:S,transparent:true,opacity:i===0?.8:.28}));if(i===0)ring.rotation.x=Math.PI/2;if(i===1)ring.rotation.y=Math.PI/2;this.cursor.add(ring);}
    this.scene.add(this.cursor);
    this.anchorA=new THREE.Mesh(new THREE.SphereGeometry(.031,16,12),new THREE.MeshBasicMaterial({color:S}));this.scene.add(this.anchorA);
    this.anchorB=new THREE.Mesh(new THREE.OctahedronGeometry(.046),new THREE.MeshBasicMaterial({color:T,wireframe:true}));this.scene.add(this.anchorB);
    this.guides=new THREE.Group();this.scene.add(this.guides);
  }
  addLabel(text,cls,getPosition){const el=document.createElement('div');el.className='axis-label '+cls;el.innerHTML=text;this.labels.appendChild(el);this.labelNodes.push({el,getPosition,cls});}
  buildLabels(){
    this.addLabel('X · R³ SPECTRAL<em>reference-relative distance</em>','x',()=>position(1.06,-.17,0));
    this.addLabel('Y · T³ TEMPORAL<em>reference-relative distance</em>','y',()=>position(-.32,.96,0));
    this.addLabel('Z · MASKER<em>stronger competition ↑</em>','z',()=>position(-.02,0,1.27));
    this.addLabel('F','anchor reference',()=>position((this.state.mapMode==='bank'?this.state.pool.reference.x:0)-.05,(this.state.mapMode==='bank'?this.state.pool.reference.y:0)-.015,this.state.z+.06));
    this.addLabel('B','anchor destination',()=>position(1.025,1.045,this.state.z+.055));
    this.addLabel('ANCHOR','anchor selected',()=>position(this.state.anchor?.x??this.state.x,this.state.anchor?.y??this.state.y,this.state.z+.15));
    this.addLabel('0','tick',()=>position(-.045,-.025,-.05));
    this.addLabel('1','tick',()=>position(1,-.045,-.045));
    this.addLabel('1','tick',()=>position(-.045,1,-.045));
    this.addLabel('−12 dB','tick',()=>position(-.1,0,1));
    this.addLabel('+12 dB','tick',()=>position(-.13,0,0));
  }
  clear(group){while(group.children.length){const c=group.children[0];group.remove(c);c.geometry?.dispose();if(Array.isArray(c.material))c.material.forEach(m=>m.dispose());else c.material?.dispose();}}
  update(next){
    this.state={...this.state,...next};const st=this.state;
    if(st.pool&&st.pool!==this.poolRef)this.buildPool(st.pool);
    const p=position(st.anchor?.x??st.x,st.anchor?.y??st.y,st.z);
    this.cursor.position.copy(p);this.slice.position.y=p.y;
    if(this.activeCloud)this.activeCloud.position.y=p.y;
    const selected=this.labels.querySelector('.selected');if(selected)selected.textContent=st.anchor?.id||'ANCHOR';
    this.labels.querySelector('.z em').textContent=st.masker==='speech'?'human speech · level ↑':'other sounds · level ↑';
    this.anchorA.position.copy(position(st.mapMode==='bank'?st.pool.reference.x:0,st.mapMode==='bank'?st.pool.reference.y:0,st.z));this.anchorB.position.copy(position(1,1,st.z));this.anchorB.visible=st.mapMode==='personal';this.cursor.visible=!!st.anchor;
    this.labels.querySelector('.destination').hidden=st.mapMode!=='personal';this.labels.querySelector('.selected').hidden=!st.anchor;
    this.labels.querySelector('.x em').textContent=st.mapMode==='bank'?'normalized bank projection':'reference-relative distance';this.labels.querySelector('.y em').textContent=st.mapMode==='bank'?'normalized bank projection':'reference-relative distance';
    this.maskerMaterial.uniforms.uLevel.value=Math.max(0,Math.min(1,st.z));
    this.maskerMaterial.uniforms.uSpeech.value=st.masker==='speech'?1:0;
    this.speechShape.update(st);
    this.clear(this.guides);
    this.guides.visible=!!st.anchor;
    this.guides.add(this.line([p,position(st.x,st.y,0)],Z,.45,true));
    this.guides.add(this.line([p,position(st.x,0,st.z)],T,.35,true));
    this.guides.add(this.line([p,position(0,st.y,st.z)],S,.35,true));
    this.guides.add(this.line([position(st.x,st.y,0),position(st.x,0,0)],T,.32,true));
    this.guides.add(this.line([position(st.x,st.y,0),position(0,st.y,0)],S,.32,true));
    if(st.pool){const neighbors=[...st.pool.candidates].sort((a,b)=>Math.hypot(a.x-st.x,a.y-st.y)-Math.hypot(b.x-st.x,b.y-st.y)).slice(1,8);for(const n of neighbors)this.guides.add(this.line([p,position(n.x,n.y,st.z)],S,.35));}
    const pathKey=st.z.toFixed(3)+'/'+st.route+'/'+st.mapMode;
    if(pathKey!==this.pathKey){this.updatePaths();this.pathKey=pathKey;}
  }
  updatePaths(){
    const st=this.state;this.clear(this.pathGroup);if(st.mapMode!=='personal'||!st.pool.candidates.length)return;
    for(const name of ['joint','spectral','temporal']){
      const active=name===st.route;const points=[];
      for(let i=0;i<=80;i++){const p=routePoint(i/80,name);points.push(position(p.x,p.y,st.z+.003));}
      const color=name==='spectral'?S:name==='temporal'?T:0x243B4E;
      if(active){
        const matched=[];let previous='';for(let i=0;i<=32;i++){const target=routePoint(i/32,name),a=st.pool?nearestAnchor(st.pool,target.x,target.y).anchor:target;if(a.id!==previous||!a.id){matched.push(position(a.x,a.y,st.z+.003));previous=a.id;}}
        if(matched.length<2)continue;
        const curve=new THREE.CurvePath();for(let i=1;i<matched.length;i++)curve.add(new THREE.LineCurve3(matched[i-1],matched[i]));
        for(const [radius,opacity] of [[.030,.05],[.012,.12],[.004,.95]])this.pathGroup.add(new THREE.Mesh(new THREE.TubeGeometry(curve,120,radius,5,false),new THREE.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,blending:THREE.NormalBlending})));
        for(const q of matched){const dot=new THREE.Mesh(new THREE.SphereGeometry(.022,8,8),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.9}));dot.position.copy(q);this.pathGroup.add(dot);}
      }else this.pathGroup.add(this.line(points,color,st.mapMode==='personal'?.18:.08,true));
    }
  }
  resize(){
    const w=this.mount.clientWidth,h=this.mount.clientHeight;if(!w||!h)return;
    const aspect=w/h;this.renderer.setSize(w,h,false);this.camera.aspect=aspect;
    // Keep enough horizontal field of view when the cube shares its figure.
    this.camera.fov=aspect<.85?THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(22))/aspect)):(aspect<1.2?52:40);
    this.camera.updateProjectionMatrix();
  }
  reset(){this.top=false;this.camera.position.set(4.7,3.3,5.7);this.controls.target.set(0,-.08,0);this.controls.update();}
  toggleView(){this.top=!this.top;if(this.top){this.camera.position.set(.001,8.2,.001);this.controls.target.set(0,0,0);}else this.reset();this.controls.update();return this.top;}
  frame(now){
    requestAnimationFrame(this.frame);
    if(document.hidden||!this.active||now-this.last<32)return;this.last=now;
    this.controls.autoRotate=this.auto&&!this.top;this.controls.update();
    const pulse=window.matchMedia('(prefers-reduced-motion: reduce)').matches?1:1+.06*Math.sin(now*.0017);this.glow.scale.set(.72*pulse,.72*pulse,1);
    this.maskerMaterial.uniforms.uTime.value=now*.001;
    this.speechShape.render();
    this.renderer.render(this.scene,this.camera);
    const w=this.mount.clientWidth,h=this.mount.clientHeight;
    for(const item of this.labelNodes){const p=item.getPosition().project(this.camera);let x=(p.x*.5+.5)*w,y=(-p.y*.5+.5)*h;if(['x','y','z'].includes(item.cls)){const margin=w<500?83:105;x=Math.max(margin,Math.min(w-margin,x));y=Math.max(w<500?132:150,Math.min(h-70,y));}item.el.style.left=x+'px';item.el.style.top=y+'px';item.el.style.visibility=p.z>1?'hidden':'visible';}
  }
}
