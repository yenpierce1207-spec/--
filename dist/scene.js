// A persistent WebGL world: UI panels can rerender without recreating the scene or GPU context.
let THREE, OrbitControls;
try {
  THREE = await import('./vendor/three.module.min.js');
  ({ OrbitControls } = await import('./vendor/OrbitControls.js'));
  startWorld();
} catch (error) {
  console.warn('3D scene unavailable; loading the compatible scene.', error);
  const fallback = document.createElement('script');
  fallback.src = 'scene-fallback.js';
  document.body.append(fallback);
}

function startWorld() {
  const { Scene, Color, PerspectiveCamera, WebGLRenderer, PCFSoftShadowMap, ACESFilmicToneMapping,
    HemisphereLight, DirectionalLight, Mesh, MeshStandardMaterial, MeshPhysicalMaterial,
    BoxGeometry, CylinderGeometry, SphereGeometry, CapsuleGeometry, PlaneGeometry,
    Group, CanvasTexture, SRGBColorSpace, Vector2, Vector3, Raycaster, Plane, DoubleSide,
    RingGeometry, MeshBasicMaterial, TorusGeometry } = THREE;
  const world = new Scene();
  world.background = new Color('#dce4dc');
  const renderer = new WebGLRenderer({ antialias:true, alpha:false, powerPreference:'high-performance' });
  renderer.domElement.id = 'shopScene';
  renderer.domElement.setAttribute('aria-label','可旋轉的 3D 精肉部門場景');
  renderer.domElement.tabIndex = 0;
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=PCFSoftShadowMap;
  renderer.outputColorSpace=SRGBColorSpace;
  renderer.toneMapping=ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.13;
  const camera=new PerspectiveCamera(42,innerWidth/innerHeight,.1,100);
  const controls=new OrbitControls(camera,renderer.domElement);
  controls.target.set(5.5,.5,5);
  controls.enableDamping=true;
  controls.dampingFactor=.09;
  controls.enablePan=false;
  controls.minDistance=9;
  controls.maxDistance=34;
  controls.minPolarAngle=.35;
  controls.maxPolarAngle=1.22;
  controls.mouseButtons={LEFT:THREE.MOUSE.ROTATE,MIDDLE:THREE.MOUSE.DOLLY,RIGHT:THREE.MOUSE.ROTATE};
  controls.touches={ONE:THREE.TOUCH.ROTATE,TWO:THREE.TOUCH.DOLLY_ROTATE};
  let homeDistance=21, initializedCamera=false;
  function resetCamera(){
    const portrait=innerWidth<700;
    homeDistance=portrait?29:21;
    controls.target.set(5.5,.5,5);
    camera.position.set(5.5+homeDistance*.57,.5+homeDistance*.58,5+homeDistance*.58);
    controls.update();
  }
  world.add(new HemisphereLight('#fff8ea','#779282',2.15));
  const sun=new DirectionalLight('#fff3d6',3.1);
  sun.position.set(-3,15,9);sun.target.position.set(5,0,4);
  sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
  Object.assign(sun.shadow.camera,{left:-14,right:14,top:14,bottom:-14,near:1,far:35});
  sun.shadow.normalBias=.025;sun.shadow.bias=-.0001;sun.shadow.radius=4;
  world.add(sun,sun.target);
  const fill=new DirectionalLight('#d8edff',.85);fill.position.set(13,8,-7);world.add(fill);
  const materials=new Map();
  function mat(color,options={}){
    const key=JSON.stringify([color,options]);
    if(!materials.has(key))materials.set(key,new MeshStandardMaterial({color,roughness:.72,...options}));
    return materials.get(key);
  }
  const steel=mat('#b6c5c2',{metalness:.72,roughness:.28});
  const darkSteel=mat('#506b62',{metalness:.48,roughness:.42});
  const glass=new MeshPhysicalMaterial({color:'#d7f2e8',transparent:true,opacity:.2,roughness:.12,metalness:.08,depthWrite:false,side:DoubleSide});
  const unitBox=new BoxGeometry(1,1,1);
  function block(parent,x,y,z,w,h,d,material,shadow=true){
    const m=new Mesh(unitBox,typeof material==='string'?mat(material):material);
    m.position.set(x,y,z);m.scale.set(w,h,d);m.castShadow=shadow;m.receiveShadow=true;parent.add(m);return m;
  }
  function cylinder(parent,x,y,z,r,h,material,segments=16){
    const m=new Mesh(new CylinderGeometry(r,r,h,segments),typeof material==='string'?mat(material):material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
  }
  function sphere(parent,x,y,z,r,color,scale=[1,1,1]){let m=new Mesh(new SphereGeometry(r,16,12),mat(color));m.position.set(x,y,z);m.scale.set(...scale);m.castShadow=true;parent.add(m);return m;}
  function textPanel(parent,text,w,h,color='#f5edda',bg='#244b3d',fontSize=50){
    const c=document.createElement('canvas');c.width=1024;c.height=Math.round(1024*h/w);
    const x=c.getContext('2d');x.fillStyle=bg;x.fillRect(0,0,c.width,c.height);x.fillStyle=color;x.font=`700 ${fontSize}px "Noto Sans TC", sans-serif`;x.textAlign='center';x.textBaseline='middle';
    const lines=text.split('\n');lines.forEach((line,i)=>x.fillText(line,c.width/2,c.height/2+(i-(lines.length-1)/2)*(fontSize*1.4),960));
    const tx=new CanvasTexture(c);tx.colorSpace=SRGBColorSpace;
    const m=new Mesh(new PlaneGeometry(w,h),new MeshStandardMaterial({map:tx,roughness:.9,side:DoubleSide}));parent.add(m);return m;
  }
  // A deep base, raised tile joints and wall mouldings anchor the room in space.
  block(world,5.5,-.24,5,11.45,.48,10.45,'#3d6653');
  block(world,5.5,-.03,5,11.5,.12,10.5,'#e8e5d6');
  for(let x=0;x<11;x++)for(let z=0;z<10;z++)block(world,x+.5,.026,z+.5,.984,.044,.984,(x+z)%2?'#e2e7dc':'#f2f0e7',false);
  const ground=block(world,5.5,-.53,5,160,.1,160,'#d8e0d5',false);
  ground.receiveShadow=true;
  const walls=[];
  const rear=new Group();world.add(rear);walls.push(rear);
  block(rear,5.5,1.33,-.04,11.4,2.66,.18,'#e9e8da');
  block(rear,5.5,.48,.062,11.3,.91,.028,'#9cb3a2');
  block(rear,5.5,.98,.075,11.3,.06,.035,'#3f6d58');
  block(rear,5.5,2.67,-.04,11.55,.08,.25,'#f6f2e6');
  const side=new Group();world.add(side);walls.push(side);
  block(side,-.04,1.33,5,.18,2.66,10.2,'#dedfd2');
  block(side,.062,.48,5,.028,.91,10.12,'#9cb3a2');
  block(side,.075,.98,5,.035,.06,10.1,'#3f6d58');
  block(side,-.04,2.67,5,.25,.08,10.35,'#f6f2e6');
  for(let x=.5;x<11;x+=.5)block(rear,x,1.73,.061,.006,1.34,.008,'#cbd2c6',false);
  for(let y=1.25;y<2.65;y+=.35)block(rear,5.5,y,.061,11,.006,.008,'#cbd2c6',false);
  const sign=textPanel(rear,'肉 舖 日 常  /  FRESH MEAT',4.5,.57,'#fff4dd','#a34637',64);sign.position.set(5.3,2.1,.17);
  block(rear,5.3,2.1,.10,4.66,.71,.1,'#e2b771');
  for(let x of [1.3,5.6,9.7]){block(rear,x,2.45,.46,1.4,.07,.15,'#485b51');block(rear,x,2.40,.46,1.25,.022,.12,mat('#fff7d7',{emissive:'#fff0bd',emissiveIntensity:1.8}),false);}
  const wallClock=new Group();rear.add(wallClock);wallClock.position.set(9.7,1.83,.2);
  const clockFace=new Mesh(new CylinderGeometry(.23,.23,.04,32),mat('#f8f3df'));clockFace.rotation.x=Math.PI/2;wallClock.add(clockFace);
  block(wallClock,0,.055,.04,.022,.13,.02,'#314e3b');block(wallClock,.07,0,.045,.15,.02,.02,'#314e3b');
  const windowFrame=block(side,.07,1.65,6,.1,1.06,2.5,'#688a78');
  block(side,.13,1.65,6,.025,.88,2.3,mat('#b6d5da',{roughness:.23,metalness:.13}));
  block(side,.15,1.65,6,.035,.9,.065,'#e4e4d5');
  // Order desk, computer, stool, paperwork and delivery boxes.
  const desk=new Group();world.add(desk);
  block(desk,2.5,1.04,1.575,3.2,.14,1.2,'#c0aa83');
  block(desk,1.3,.52,1.575,.53,.98,1.06,'#53715b');block(desk,3.75,.52,1.575,.22,.98,1.06,'#53715b');
  for(let y of [.3,.6,.88]){block(desk,1.3,y,2.115,.43,.012,.026,'#304e3c');block(desk,1.3,y+.08,2.145,.16,.025,.045,steel);}
  block(desk,2.7,1.17,1.45,.48,.08,.35,darkSteel);block(desk,2.7,1.42,1.40,.06,.5,.07,darkSteel);block(desk,2.7,1.6,1.43,.84,.51,.08,'#233e32');
  const screen=textPanel(desk,'ORDER DESK\n09:00  /  OPEN',.75,.42,'#a6d6b1','#18392e',66);screen.position.set(2.7,1.6,1.481);
  block(desk,2.7,1.13,1.93,.62,.032,.22,'#485951');
  block(desk,1.88,1.131,1.78,.6,.025,.47,'#f5eedb');
  for(let i=0;i<4;i++)block(desk,1.88,1.147,1.63+i*.07,.42,.002,.008,'#aaa992',false);
  cylinder(desk,3.38,1.21,1.85,.09,.19,'#a04735');
  cylinder(desk,2.5,.51,2.58,.3,.11,'#aa6c48');cylinder(desk,2.5,.27,2.58,.05,.47,steel);
  for(let i=0;i<3;i++){block(world,1.1+i*.55,.24,.54,.47,.46,.44,'#b89d73');block(world,1.1+i*.55,.478,.54,.06,.005,.45,'#e6d3a7');}
  // Stainless prep bench with individual legs, a scale, boards and a slicer.
  const prep=new Group();world.add(prep);
  for(let x of [6.27,8.97])for(let z of [1.32,2.08])block(prep,x,.5,z,.08,1,.08,steel);
  block(prep,7.62,1.03,1.72,3.12,.12,1.14,steel);block(prep,7.62,.3,1.72,2.8,.05,.88,darkSteel);
  block(prep,6.92,1.112,1.8,.95,.045,.63,'#eee6cd');
  for(let i=0;i<3;i++)sphere(prep,6.66+i*.22,1.16,1.77,.14,i%2?'#ba6157':'#d17c70',[1,.35,1.6]);
  block(prep,7.72,1.15,1.65,.42,.17,.4,'#d8ded4');block(prep,7.72,1.25,1.65,.45,.045,.44,steel);
  block(prep,8.46,1.19,1.75,.62,.26,.64,'#82968e');
  const blade=new Mesh(new CylinderGeometry(.3,.3,.035,32),steel);blade.rotation.x=Math.PI/2;blade.position.set(8.46,1.5,1.69);blade.castShadow=true;prep.add(blade);
  block(prep,8.46,1.24,2.03,.58,.04,.5,steel);block(prep,8.73,1.52,1.93,.045,.4,.045,'#344f40');
  const prepNote=textPanel(prep,'CUT & PREP',1.8,.25,'#425e4f','#e2e2d6',90);prepNote.position.set(7.62,.7,2.304);
  // Refrigerated display: thick plinth, steel rails, clear glazing and raised meat trays.
  const counter=new Group();world.add(counter);
  block(counter,4.25,.48,5.6,5.55,.92,1.4,'#234e3d');block(counter,4.25,.14,5.6,5.67,.1,1.5,darkSteel);
  block(counter,4.25,.94,5.6,5.72,.12,1.5,steel);
  for(let x=1.65;x<6.9;x+=.14)block(counter,x,.31,6.31,.04,.26,.016,'#153b2d',false);
  block(counter,4.25,.72,6.32,5.37,.19,.035,'#e7e0c8');
  const meatNames=['CHICKEN','PORK SLICES','BEEF','WAGYU','OMI'];
  for(let i=0;i<5;i++){
    const x=2.06+i*1.09;
    block(counter,x,1.04,5.55,.94,.07,.97,'#d5dcd4');block(counter,x,1.086,5.55,.83,.028,.86,'#faf4e5');
    for(let j=0;j<3;j++){
      const color=i===0?'#d9a395':i>2?'#b96059':'#ca7b6b';
      const meat=sphere(counter,x-.24+j*.23,1.15,5.55,.18,color,[.74,.37,1.8]);meat.rotation.y=-.13;
      if(i>1){let fat=block(counter,x-.25+j*.23,1.215,5.56,.027,.012,.47,'#edd6c0',false);fat.rotation.y=-.13;}
    }
    const price=textPanel(counter,`${meatNames[i]}\n$${[89,139,480,780,1250][i]}`,.73,.30,'#304b3d','#fff2d2',86);price.position.set(x,.75,6.346);
  }
  for(let x of [1.47,7.03]){block(counter,x,1.31,5.6,.035,.69,1.38,glass,false);block(counter,x,1.68,5.6,.045,.045,1.44,steel);}
  const frontGlass=block(counter,4.25,1.39,6.24,5.52,.63,.028,glass,false);frontGlass.rotation.x=-.16;
  block(counter,4.25,1.69,6.19,5.65,.045,.055,steel);block(counter,4.25,1.7,5.6,5.62,.025,1.18,glass,false);
  // Upright cold storage with glass doors, shelves, handles and cool internal light.
  const fridge=new Group();world.add(fridge);
  block(fridge,9.22,1.18,6.1,.13,2.36,3.1,'#587867');
  for(let y of [.13,2.27])block(fridge,9.82,y,6.1,1.25,.18,3.1,'#587867');
  for(let z of [4.58,7.62])block(fridge,9.82,1.18,z,1.25,2.36,.10,'#587867');
  block(fridge,10.47,1.18,6.1,.07,2.08,.055,steel);
  for(let z of [5.34,6.86]){
    block(fridge,10.48,1.2,z,.028,1.78,1.37,glass,false);
    for(let y of [.5,1,1.5]){block(fridge,9.85,y,z,1.05,.045,1.31,steel);for(let k=0;k<3;k++)block(fridge,10.1,y+.13,z-.42+k*.4,.45,.2,.28,k%2?'#c19c72':'#e1d4b1');}
    block(fridge,10.53,1.22,z+.51,.055,.45,.04,steel);
    block(fridge,10.37,2.02,z,.03,.025,1.2,mat('#cbe8dd',{emissive:'#9bd9c7',emissiveIntensity:.8}),false);
  }
  const coldSign=textPanel(fridge,'COLD STORAGE',2.5,.3,'#e5efdb','#274d3c',88);coldSign.rotation.y=Math.PI/2;coldSign.position.set(10.49,2.24,6.1);
  // A plant, floor markings and a break bench make the room feel occupied.
  cylinder(world,.7,.22,8.8,.23,.44,'#9b7551');for(let i=0;i<6;i++){let leaf=sphere(world,.7+Math.sin(i)*.16,.72+i*.035,8.8+Math.cos(i)*.16,.23,i%2?'#527952':'#78936a',[.45,1.45,.45]);leaf.rotation.z=Math.sin(i)*.45;}
  block(world,2.2,.48,8.8,2.6,.12,.62,'#b69d76');for(let x of [1.15,3.25])block(world,x,.22,8.8,.09,.45,.5,'#48614d');
  const floorSign=textPanel(world,'FRESH CUTS · EVERY DAY',4.1,.42,'#70866f','#e9e9dd',75);floorSign.rotation.x=-Math.PI/2;floorSign.position.set(5.6,.059,8.5);

  const stations=[
    {x:2.3,y:3.2,name:'小林',job:'叫貨與到貨',view:'orders',color:'#c39b51',line:'主任，今天鸡肉有近效期庫存。外購成品14:00才到，上午的客人可不會等到下午。先看庫存，再填叫貨單。'.replace('鸡','雞')},
    {x:7.5,y:3.2,name:'阿宏',job:'加工與排班',view:'production',color:'#629ba1',line:'早班9–13、14–18；中班11–15、16–20；晚班13–17、18–22。前三班各休息一小時；短班9–15，12:00–12:30休息半小時。先排人，再決定加工量和順序。'},
    {x:8.4,y:7.8,name:'店長',job:'營業結算',view:'finance',color:'#a27f9e',line:'賣完不一定叫得好，剩貨也不一定全是損失。要一起看缺貨、報廢和利益。做完決策，我們就開門營業。'}
  ,
    {x:5.6,y:8.5,name:'副主任',job:'巡場與建議',view:'deputy',color:'#647aac',line:'主任，我整理了現場巡查與改善建議。'}
  ];
  function makePerson(color,hat=true){
    const group=new Group();world.add(group);const torso=new Group();group.add(torso);
    block(torso,0,.83,0,.44,.56,.29,color);
    block(torso,0,.8,.158,.33,.44,.025,'#f0ebdb');block(torso,0,.65,.183,.23,.14,.025,'#d6d0bd');
    block(torso,0,1.105,0,.12,.12,.12,'#d9ac8c');
    sphere(torso,0,1.3,0,.205,'#e8bb99',[.92,1.02,.86]);
    sphere(torso,0,1.28,.177,.037,'#d49f7d',[.8,1,1]);
    sphere(torso,-.064,1.335,.163,.014,'#32352e');sphere(torso,.064,1.335,.163,.014,'#32352e');
    if(hat){cylinder(torso,0,1.49,0,.213,.1,'#f6f1e2',16);sphere(torso,0,1.56,-.012,.20,'#fff8e9',[1,.43,1]);}
    else sphere(torso,0,1.445,-.035,.198,'#544537',[1,.5,.9]);
    const arms=[],legs=[];
    for(let side of [-1,1]){
      const arm=new Group();arm.position.set(side*.295,1.01,0);torso.add(arm);block(arm,0,-.18,0,.12,.35,.15,color);sphere(arm,0,-.40,0,.075,'#e3b393',[.8,1.1,.85]);arms.push(arm);
      const leg=new Group();leg.position.set(side*.125,.58,0);group.add(leg);block(leg,0,-.24,0,.155,.48,.19,'#394c40');block(leg,0,-.51,.055,.18,.12,.29,'#243c2d');legs.push(leg);
    }
    return {group,torso,arms,legs};
  }
  const staffModels=Object.keys(G.shifts).map(()=>makePerson('#98b5a4'));
  const npcs=stations.map(s=>{let p=makePerson(s.color);p.group.position.set(s.x,.06,s.y);p.group.rotation.y=-.15;return p});
  const customers=['#b79073','#7e9eaa','#ab8297'].map(c=>makePerson(c,false));
  let player={x:4.3,y:7.3},path=[],keys={},walked=0;
  const character=makePerson('#b74e3e');
  const ring=new Mesh(new RingGeometry(.30,.38,40),new MeshBasicMaterial({color:'#ebba6f',side:DoubleSide,transparent:true,opacity:.9}));ring.rotation.x=-Math.PI/2;world.add(ring);
  const marker=new Mesh(new RingGeometry(.12,.2,32),new MeshBasicMaterial({color:'#e6a84c',side:DoubleSide,transparent:true}));marker.rotation.x=-Math.PI/2;marker.visible=false;world.add(marker);
  const obstacles=[{x:1,y:1,w:3,d:1.15},{x:6.1,y:1.2,w:3.1,d:1.05},{x:1.45,y:4.9,w:5.6,d:1.45},{x:9.15,y:4.55,w:1.35,d:3.1},{x:.85,y:8.4,w:2.7,d:.85}];
  function passable(x,y){return x>.45&&x<10.55&&y>.5&&y<9.55&&!obstacles.some(o=>x>o.x-.22&&x<o.x+o.w+.22&&y>o.y-.22&&y<o.y+o.d+.22)}
  function routeTo(x,y){
    const step=.32,start=[Math.round(player.x/step),Math.round(player.y/step)],end=[Math.round(x/step),Math.round(y/step)],key=p=>p.join(',');
    const q=[start],seen=new Map([[key(start),null]]);let found;
    while(q.length){const p=q.shift();if(Math.hypot(p[0]-end[0],p[1]-end[1])<1.5){found=p;break;}
      for(let [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){let n=[p[0]+dx,p[1]+dy],k=key(n);if(!seen.has(k)&&passable(n[0]*step,n[1]*step)){seen.set(k,p);q.push(n)}}
    }
    path=[];if(found){let p=found;while(p&&key(p)!==key(start)){path.unshift({x:p[0]*step,y:p[1]*step});p=seen.get(key(p))}marker.position.set(found[0]*step,.07,found[1]*step);marker.visible=true;}
  }
  function hour(){return pendingOutcome?parseInt(playbackEvents()[playStep].time):result?22:9}
  function talk(s){if(s.view==='deputy'){openDeputy();return}
    path=[];keys={};marker.visible=false;
    if(pendingOutcome){showPlayback();return}
    let c=document.querySelector('#conversation');c.classList.remove('hidden');
    c.innerHTML=`<div class="speaker">${s.name}｜${s.job}</div><p>${result&&s.view==='finance'?'今天辛苦了。損益已經算好了，來看看哪些決策有效、哪些可以改進。':s.line}</p><div><button class="primary" id="talkOpen">${s.view==='orders'?'打開叫貨單':s.view==='production'?'安排排班與加工':'查看結算'} →</button><button class="quiet" id="talkClose">稍後再說</button></div>`;
    document.querySelector('#talkOpen').onclick=()=>{view=s.view;sceneOnly=false;render()};document.querySelector('#talkClose').onclick=()=>c.classList.add('hidden');
  }
  function selectStation(i){if(!started)return;let s=stations[i];player={x:s.x+.55,y:s.y+.45};talk(s)}
  window.shopGuide=()=>selectStation(result?2:orderReady?1:0);
  const ray=new Raycaster(),pointer=new Vector2(),floorPlane=new Plane(new Vector3(0,1,0),-.06),intersection=new Vector3();
  let pointerDown=null;
  renderer.domElement.addEventListener('pointerdown',e=>{pointerDown={x:e.clientX,y:e.clientY,time:performance.now()};});
  renderer.domElement.addEventListener('pointerup',e=>{
    if(!pointerDown||e.button!==0)return;
    const drag=Math.hypot(e.clientX-pointerDown.x,e.clientY-pointerDown.y);pointerDown=null;
    if(drag>7||!started||!sceneOnly||!document.querySelector('#conversation').classList.contains('hidden'))return;
    pointer.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);ray.setFromCamera(pointer,camera);
    if(ray.ray.intersectPlane(floorPlane,intersection)&&passable(intersection.x,intersection.z))routeTo(intersection.x,intersection.z);
  });
  renderer.domElement.addEventListener('contextmenu',e=>e.preventDefault());
  const touchKeys=['ArrowUp','ArrowLeft','ArrowDown','ArrowRight'];
  function attachUI(){
    keys={};
    const placeholder=document.querySelector('#shopScene');
    if(placeholder!==renderer.domElement)placeholder.replaceWith(renderer.domElement);
    const layer=document.createElement('div');layer.className='npc-layer';
    layer.innerHTML=stations.map((s,i)=>`<button class="npc-pin" style="--pin:${s.color}" data-station="${i}" aria-label="與${s.name}對話"><span>!</span>${s.name}｜${s.job}</button>`).join('')+'<div id="interactHint" class="interact-hint"></div>';
    document.querySelector('#app').append(layer);
    layer.querySelectorAll('[data-station]').forEach(b=>b.onclick=()=>selectStation(Number(b.dataset.station)));
    const tools=document.createElement('div');tools.className='camera-tools';tools.setAttribute('aria-label','3D 視角控制');
    tools.innerHTML='<span class="camera-title">3D 視角</span><button data-camera="left" aria-label="向左旋轉視角">↶</button><button data-camera="right" aria-label="向右旋轉視角">↷</button><button data-camera="in" aria-label="放大場景">＋</button><button data-camera="out" aria-label="縮小場景">－</button><button data-camera="home" aria-label="重設視角">⌂</button><small>拖曳旋轉・滾輪縮放</small>';
    document.querySelector('#app').append(tools);
    tools.querySelectorAll('[data-camera]').forEach(b=>b.onclick=()=>{
      let offset=camera.position.clone().sub(controls.target),a=b.dataset.camera;
      if(a==='home')resetCamera();
      else if(a==='left'||a==='right'){offset.applyAxisAngle(new Vector3(0,1,0),a==='left'?-.32:.32);camera.position.copy(controls.target).add(offset);}
      else {let len=offset.length(),next=Math.min(controls.maxDistance,Math.max(controls.minDistance,len*(a==='in'?.85:1.15)));offset.setLength(next);camera.position.copy(controls.target).add(offset);}
      controls.update();
    });
    const dpad=document.createElement('div');dpad.className='scene-dpad';dpad.innerHTML=touchKeys.map((k,i)=>`<button aria-label="${['向前走','向左走','向後走','向右走'][i]}" data-walk="${k}">${['▲','◀','▼','▶'][i]}</button>`).join('');document.querySelector('#app').append(dpad);
    dpad.querySelectorAll('button').forEach(b=>{b.onpointerdown=e=>{e.preventDefault();keys[b.dataset.walk]=true;b.setPointerCapture(e.pointerId)};b.onpointerup=b.onpointercancel=()=>keys[b.dataset.walk]=false;});
    renderer.domElement.dataset.renderer='webgl';
    resize();
  }
  window.initShop=attachUI;
  function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();if(!initializedCamera){resetCamera();initializedCamera=true;}}
  addEventListener('resize',resize);
  addEventListener('keydown',e=>{
    if(['INPUT','TEXTAREA'].includes(e.target.tagName)||!started||!sceneOnly)return;
    let k=e.key.length===1?e.key.toLowerCase():e.key;
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','e'].includes(k))e.preventDefault();keys[k]=true;
    if(k==='e'&&!e.repeat){let s=stations.find(s=>Math.hypot(s.x-player.x,s.y-player.y)<1.4);if(s)talk(s)}
  });
  addEventListener('keyup',e=>keys[e.key.length===1?e.key.toLowerCase():e.key]=false);addEventListener('blur',()=>keys={});
  let last=performance.now();
  const projected=new Vector3(),forward=new Vector3(),right=new Vector3();
  function animate(now){
    const dt=Math.min(.04,(now-last)/1000);last=now;
    const allowed=started&&sceneOnly&&document.querySelector('#conversation')?.classList.contains('hidden');
    let moving=false,dx=0,dz=0;
    if(allowed){
      const horizontal=(keys.d||keys.ArrowRight?1:0)-(keys.a||keys.ArrowLeft?1:0),vertical=(keys.w||keys.ArrowUp?1:0)-(keys.s||keys.ArrowDown?1:0);
      if(horizontal||vertical){path=[];marker.visible=false;camera.getWorldDirection(forward);forward.y=0;forward.normalize();right.crossVectors(forward,new Vector3(0,1,0)).normalize();dx=right.x*horizontal+forward.x*vertical;dz=right.z*horizontal+forward.z*vertical;let len=Math.hypot(dx,dz);dx/=len;dz/=len;let nx=player.x+dx*dt*2.8,nz=player.y+dz*dt*2.8;if(passable(nx,player.y))player.x=nx;if(passable(player.x,nz))player.y=nz;moving=true;}
      else if(path.length){let t=path[0],dist=Math.hypot(t.x-player.x,t.y-player.y);dx=(t.x-player.x)/(dist||1);dz=(t.y-player.y)/(dist||1);if(dist<dt*2.8){player={...t};path.shift()}else{player.x+=dx*dt*2.8;player.y+=dz*dt*2.8;}moving=true;if(!path.length)marker.visible=false;}
    }
    if(moving){walked+=dt*9;const angle=Math.atan2(dx,dz);character.group.rotation.y+=Math.atan2(Math.sin(angle-character.group.rotation.y),Math.cos(angle-character.group.rotation.y))*.2;}
    character.group.position.set(player.x,.06,player.y);character.torso.position.y=moving?Math.abs(Math.sin(walked))*.025:Math.sin(now*.002)*.008;
    character.legs.forEach((leg,i)=>leg.rotation.x=moving?Math.sin(walked+i*Math.PI)*.5:0);character.arms.forEach((arm,i)=>arm.rotation.x=moving?-Math.sin(walked+i*Math.PI)*.38:0);
    ring.position.set(player.x,.064,player.y);ring.material.opacity=.6+Math.sin(now*.004)*.18;
    const h=hour();Object.entries(G.shifts).forEach(([id,s],i)=>{let p=staffModels[i],resting=h>=s.windows[0][1]&&h<s.windows[1][0];p.group.visible=!!plan.staff[id]&&h>=s.windows[0][0]&&h<s.windows[1][1];p.group.position.set(resting?1.5+i*.55:6.5+i*.8,.06,resting?8.1:2.65);p.group.rotation.y=resting?0:Math.PI;p.arms[0].rotation.x=resting?0:Math.sin(now*.003+i)*.18-.5;});
    customers.forEach((p,i)=>{p.group.visible=!!pendingOutcome&&h>=11&&h<22;p.group.position.set(2.2+i*1.45+Math.sin(now*.0007+i)*.08,.06,7.12);p.group.rotation.y=Math.PI;});
    // Fade only a rear wall that the orbit camera moves behind, so it never hides the whole shop.
    rear.visible=camera.position.z>-.6;side.visible=camera.position.x>-.6;
    controls.update();renderer.render(world,camera);
    stations.forEach((s,i)=>{let pin=document.querySelector(`[data-station="${i}"]`);if(!pin)return;projected.set(s.x,2.12,s.y).project(camera);pin.style.left=(projected.x*.5+.5)*innerWidth+'px';pin.style.top=(-projected.y*.5+.5)*innerHeight+'px';pin.style.visibility=projected.z>1?'hidden':'visible';pin.classList.toggle('target',i===(result?2:orderReady?1:0));});
    let hint=document.querySelector('#interactHint'),near=stations.find(s=>Math.hypot(s.x-player.x,s.y-player.y)<1.4);if(hint)hint.textContent=near?`E · 與${near.name}對話`:'點地板走動 · 拖曳旋轉視角';
    document.querySelector('.scene-dpad')?.classList.toggle('hidden',!allowed);
    requestAnimationFrame(animate);
  }
  render();requestAnimationFrame(animate);
}
