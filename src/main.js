import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const $ = (id) => document.getElementById(id);
const app = $('app');
const speedEl = $('speed'), gearEl = $('gear'), gearNameEl = $('gearName');
const rpmEl = $('rpm'), rpmBar = $('rpmBar'), speedBar = $('speedBar');
const loading = $('loading'), toast = $('toast');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9eabb0);
scene.fog = new THREE.Fog(0x9eabb0, 65, 230);

const camera = new THREE.PerspectiveCamera(57, innerWidth / innerHeight, 0.1, 500);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
app.prepend(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xe8f1f2, 0x55584c, 1.75));
const sun = new THREE.DirectionalLight(0xffedcf, 3.1);
sun.position.set(-34, 55, 22);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -65; sun.shadow.camera.right = 65;
sun.shadow.camera.top = 65; sun.shadow.camera.bottom = -65;
sun.shadow.bias = -0.00018;
scene.add(sun);

const mat = (color, metalness = 0, roughness = 0.55, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, metalness, roughness, ...extra });
const ivory = mat(0xe8dfc8, 0.48, 0.27);
const ivoryDark = mat(0xc9bea5, 0.35, 0.34);
const chrome = mat(0xd9dfe0, 0.94, 0.18);
const darkChrome = mat(0x555e60, 0.82, 0.28);
const black = mat(0x171a1b, 0.08, 0.72);
const rubber = mat(0x17191a, 0.02, 0.9);
const glass = mat(0x263c43, 0.34, 0.12, { transparent: true, opacity: 0.63, side: THREE.DoubleSide });
const glassLight = mat(0xc5d4d4, 0.18, 0.12, { transparent: true, opacity: 0.24, side: THREE.DoubleSide });
const red = mat(0x9b211d, 0.12, 0.24, { emissive: 0x260300 });
const amber = mat(0xd28a25, 0.08, 0.25, { emissive: 0x281000 });
const headlightMat = mat(0xfff0c9, 0.18, 0.12, { emissive: 0x77613b });
const interior = mat(0x34302a, 0.05, 0.8);
const seatMat = mat(0x554b3d, 0.02, 0.88);
const tireSide = mat(0x242526, 0.02, 0.88);
const rimMat = mat(0xb8bfc0, 0.88, 0.25);

function mesh(geometry, material, parent, position = [0,0,0], rotation = [0,0,0], cast = true) {
  const o = new THREE.Mesh(geometry, material);
  o.position.set(...position); o.rotation.set(...rotation);
  o.castShadow = cast; o.receiveShadow = true; parent.add(o); return o;
}
function box(parent, size, pos, material, radius = 0, segments = 3) {
  const g = radius ? new RoundedBoxGeometry(...size, segments, radius) : new THREE.BoxGeometry(...size);
  return mesh(g, material, parent, pos);
}
function tube(parent, points, radius, material, closed = false) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)), closed);
  return mesh(new THREE.TubeGeometry(curve, Math.max(24, points.length * 8), radius, 8, closed), material, parent);
}
function sphere(parent, pos, scale, material) {
  const o = mesh(new THREE.SphereGeometry(1, 20, 14), material, parent, pos);
  o.scale.set(...scale); return o;
}
function quad(parent, points, material) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(points.flat(), 3));
  g.setIndex([0,1,2,0,2,3]); g.computeVertexNormals();
  return mesh(g, material, parent, [0,0,0], [0,0,0]);
}

// Test area, tarmac and distant scenery.
const ground = mesh(new THREE.PlaneGeometry(700,700), mat(0x65705d,0,0.98), scene, [0,-0.12,0], [-Math.PI/2,0,0], false);
ground.receiveShadow = true;
const road = mesh(new THREE.PlaneGeometry(22,260), mat(0x303638,0,0.97), scene, [0,-0.075,-30], [-Math.PI/2,0,0], false);
road.receiveShadow = true;
const shoulderMat = mat(0xaaa28b,0,0.96);
for (const x of [-11.3,11.3]) {
  const edge = mesh(new THREE.PlaneGeometry(.16,260), shoulderMat, scene, [x,-.06,-30], [-Math.PI/2,0,0], false);
}
const lineMat = mat(0xe5ddbd,0,0.9);
for (let z=-150; z<100; z+=10) mesh(new THREE.PlaneGeometry(.16,5),lineMat,scene,[0,-.055,z],[-Math.PI/2,0,0],false);
const gravel = mat(0x74796a,0,1);
for(let i=0;i<36;i++){
  const x=(i%2?1:-1)*(15+(i%6)*4);
  const z=-135+Math.floor(i/2)*15;
  const trunk=mesh(new THREE.CylinderGeometry(.16,.23,2.4,7),mat(0x554738),scene,[x,1.2,z]);
  const crown=mesh(new THREE.ConeGeometry(1.5,4.5,8),mat(i%3===0?0x52664c:0x647456),scene,[x,4.4,z]);
  crown.castShadow=true;
}
const hangar = new THREE.Group(); scene.add(hangar);
box(hangar,[18,5,.5],[0,2.5,-38],mat(0x777b78,0,0.85),.08);
for(let x=-7;x<=7;x+=2.8) box(hangar,[.09,5.2,.12],[x,2.6,-37.72],darkChrome);
box(hangar,[19,.35,.8],[0,5.1,-38],mat(0x454c4d),.05);

// Volga GAZ-24-10: dimensions are a stylised near-scale approximation.
const car = new THREE.Group(); scene.add(car);
const body = new THREE.Group(); car.add(body);

// Lower body with softened Soviet-era slab-sided contours.
box(body,[1.91,.57,4.72],[0,.91,0],ivory,.12,5);
box(body,[1.96,.28,1.23],[0,1.17,-1.66],ivory,.07,4);
box(body,[1.94,.25,1.15],[0,1.15,1.72],ivory,.07,4);
box(body,[1.91,.16,4.22],[0,1.23,0],ivory,.05,3);
box(body,[1.88,.12,4.15],[0,.62,0],ivoryDark,.035,3);

// Wheel arches: dark inner wells and rolled ivory lips.
for(const side of [-1,1]) for(const z of [-1.48,1.48]){
  const arch = new THREE.Mesh(new THREE.TorusGeometry(.57,.055,10,40,Math.PI),ivory);
  arch.rotation.set(0,0,Math.PI); arch.position.set(side*.965,.61,z); arch.castShadow=true; body.add(arch);
  const inner = new THREE.Mesh(new THREE.TorusGeometry(.52,.045,8,36,Math.PI),black);
  inner.rotation.set(0,0,Math.PI); inner.position.set(side*.91,.61,z); body.add(inner);
}

// Cabin shell: sloping windscreen pillars, roof, rear pillars.
const cabin = new THREE.Group(); body.add(cabin);
box(cabin,[1.66,.12,1.74],[0,2.035,.05],ivory,.055,4);
for(const s of [-1,1]){
  // A/B/C pillars are narrow body-coloured metal strips.
  tube(cabin,[[s*.83,1.32,-1.03],[s*.79,1.72,-.72],[s*.77,2.0,-.64]],.045,ivory);
  tube(cabin,[[s*.83,1.32,1.12],[s*.78,1.72,.78],[s*.77,2.0,.68]],.045,ivory);
  tube(cabin,[[s*.84,1.3,.12],[s*.78,1.65,.12],[s*.77,2.0,.12]],.035,ivoryDark);
}
// Glass panels on both sides, split into front/rear panes.
for(const s of [-1,1]){
  quad(cabin,[[s*.842,1.42,-.96],[s*.79,1.91,-.59],[s*.79,1.91,.02],[s*.842,1.42,-.05]],glass);
  quad(cabin,[[s*.842,1.42,.23],[s*.79,1.91,.23],[s*.79,1.91,.62],[s*.842,1.42,1.02]],glass);
  tube(cabin,[[s*.852,1.4,-.98],[s*.852,1.4,1.05]],.012,chrome);
}
// Front and rear windscreens.
quad(cabin,[[-.77,1.42,-1.075],[.77,1.42,-1.075],[.75,1.96,-.66],[-.75,1.96,-.66]],glass);
quad(cabin,[[-.75,1.96,.76],[.75,1.96,.76],[.77,1.42,1.16],[-.77,1.42,1.16]],glass);
box(cabin,[1.58,.035,.045],[0,1.39,-1.09],chrome);
box(cabin,[1.58,.035,.045],[0,1.39,1.17],chrome);

// Interior: floor, bench seats, rear bench, dashboard, steering wheel and instruments.
box(body,[1.62,.16,2.8],[0,.91,.05],interior,.04);
box(body,[1.48,.35,.58],[0,1.17,-.48],seatMat,.12,4);
box(body,[1.48,.48,.2],[0,1.48,-.72],seatMat,.08,4);
box(body,[1.48,.34,.56],[0,1.17,.72],seatMat,.12,4);
box(body,[1.48,.46,.2],[0,1.46,.96],seatMat,.08,4);
box(body,[1.68,.18,.18],[0,1.32,-1.02],interior,.035);
box(body,[1.65,.12,.18],[0,1.45,-.97],black,.025);
for(const s of [-1,1]){
  box(body,[.055,.25,.8],[s*.78,1.2,.06],interior,.02);
  box(body,[.08,.16,.22],[s*.79,1.42,.2],chrome,.02);
}
// steering column and wheel; visible from the windscreen.
const steeringWheel = new THREE.Group(); steeringWheel.position.set(-.48,1.47,-.78); body.add(steeringWheel);
const wheelRim = new THREE.Mesh(new THREE.TorusGeometry(.19,.018,8,32),black);
steeringWheel.add(wheelRim);
box(steeringWheel,[.025,.025,.025],[0,0,0],chrome,.01);
for(let a=0;a<3;a++){
  const angle=a*Math.PI*2/3;
  const spoke=box(steeringWheel,[.014,.19,.014],[Math.sin(angle)*.09,Math.cos(angle)*.09,0],chrome,.006);
  spoke.rotation.z=-angle;
}
box(body,[1.63,.27,.16],[0,1.53,-.91],interior,.045);
box(body,[.72,.09,.04],[-.43,1.61,-.82],darkChrome,.02);
for(let i=0;i<5;i++) sphere(body,[-.68+i*.17,1.62,-.79],[.045,.045,.025],chrome);
const gearStick=mesh(new THREE.CylinderGeometry(.018,.025,.34,10),chrome,body,[.18,1.27,-.05],[.18,0,0]);
sphere(body,[.18,1.45,-.08],[.055,.055,.055],black);

// Exterior door skins, panel seams, handles, mirrors, window trim.
for(const s of [-1,1]){
  for(const z of [-.58,.53]){
    const seamPoints=[[s*.966,1.28,z-.45],[s*.972,.88,z-.45],[s*.972,.78,z],[s*.972,.88,z+.45],[s*.966,1.28,z+.45]];
    tube(body,seamPoints,.008,ivoryDark);
    box(body,[.025,.035,.16],[s*.98,1.31,z+.25],chrome,.012);
  }
  tube(body,[[s*.975,1.29,-1.12],[s*.975,1.29,1.12]],.012,chrome);
  tube(body,[[s*.975,.75,-1.9],[s*.975,.75,1.92]],.012,chrome);
  // Mirror stem and housing.
  tube(body,[[s*.9,1.52,-.9],[s*1.05,1.61,-.92],[s*1.13,1.66,-.92]],.025,darkChrome);
  sphere(body,[s*1.16,1.67,-.92],[.12,.075,.16],chrome);
  sphere(body,[s*1.175,1.675,-.92],[.012,.052,.12],glassLight);
  // Front and rear mudflaps.
  box(body,[.035,.28,.24],[s*.91,.46,1.78],black,.025);
}

// Front grille with vertical bars, emblem, headlights and indicators.
box(body,[1.06,.43,.075],[0,1.0,-2.395],darkChrome,.035);
box(body,[.91,.33,.04],[0,1.0,-2.445],black,.015);
for(let x=-.39;x<=.391;x+=.13) box(body,[.025,.3,.025],[x,1.0,-2.47],chrome,.008);
sphere(body,[0,1.0,-2.51],[.09,.085,.025],chrome);
for(const s of [-1,1]){
  const h=mesh(new THREE.CylinderGeometry(.205,.205,.085,32),chrome,body,[s*.72,1.06,-2.43],[Math.PI/2,0,0]);
  mesh(new THREE.CylinderGeometry(.165,.165,.09,32),headlightMat,body,[s*.72,1.06,-2.48],[Math.PI/2,0,0]);
  box(body,[.25,.11,.07],[s*.72,.79,-2.43],amber,.035);
  box(body,[.24,.1,.07],[s*.72,.78,2.4],red,.025);
  box(body,[.23,.17,.08],[s*.73,1.0,2.405],red,.035);
  box(body,[.16,.11,.075],[s*.73,.83,2.41],amber,.02);
}
// Chrome bumpers, overriders and rubber strips.
for(const z of [-2.43,2.43]){
  box(body,[2.08,.13,.16],[0,.69,z],chrome,.055,5);
  box(body,[1.85,.035,.035],[0,.69,z+(z<0?-.09:.09)],black,.012);
  for(const s of [-1,1]) box(body,[.1,.28,.1],[s*.72,.78,z],chrome,.025);
}
box(body,[.82,.08,.035],[0,1.3,-2.39],chrome,.025);
box(body,[.62,.045,.025],[0,1.28,2.39],chrome,.015);
box(body,[1.42,.045,.025],[0,1.42,2.39],chrome,.015);

// Trunk lettering and fuel cap.
for(let i=0;i<5;i++) box(body,[.055,.035,.018],[ -.22+i*.11,1.19,2.405],chrome,.01);
sphere(body,[.91,1.12,1.72],[.035,.055,.025],chrome);

// Wheels with sidewall, tread, stamped steel rims, lug nuts and suspension hints.
const wheels=[];
for(const s of [-1,1]) for(const z of [-1.48,1.48]){
  const wheel=new THREE.Group(); wheel.position.set(s*1.0,.57,z); car.add(wheel);
  const tire=mesh(new THREE.CylinderGeometry(.49,.49,.27,40),rubber,wheel,[0,0,0],[0,0,Math.PI/2]);
  const sidewall=mesh(new THREE.TorusGeometry(.39,.075,12,40),tireSide,wheel,[s*.145,0,0],[0,Math.PI/2,0]);
  const rim=mesh(new THREE.CylinderGeometry(.285,.285,.285,32),rimMat,wheel,[s*.15,0,0],[0,0,Math.PI/2]);
  mesh(new THREE.CylinderGeometry(.22,.22,.29,32),darkChrome,wheel,[s*.158,0,0],[0,0,Math.PI/2]);
  mesh(new THREE.CylinderGeometry(.16,.16,.3,32),rimMat,wheel,[s*.165,0,0],[0,0,Math.PI/2]);
  mesh(new THREE.CylinderGeometry(.085,.085,.31,24),chrome,wheel,[s*.17,0,0],[0,0,Math.PI/2]);
  for(let n=0;n<8;n++){
    const a=n*Math.PI/4;
    sphere(wheel,[s*.177,Math.sin(a)*.205,Math.cos(a)*.205],[.025,.025,.025],chrome);
  }
  // Fine raised tread blocks around the circumference.
  for(let n=0;n<32;n++){
    const a=n*Math.PI*2/32;
    const tread=box(wheel,[.285,.035,.055],[0,Math.sin(a)*.485,Math.cos(a)*.485],tireSide,.008);
    tread.rotation.x=-a;
  }
  // Hub bolts and front steering knuckle are visual details only.
  wheels.push({group:wheel,front:z<0,side:s});
}

// Exhaust tail pipe.
tube(body,[[.45,.45,1.65],[.45,.32,1.95],[.45,.3,2.28],[.45,.3,2.48]],.035,darkChrome);

// Ground shadow catcher under the car.
const shadow = mesh(new THREE.CircleGeometry(2.15,48),mat(0x171b1a,0,1,{transparent:true,opacity:.16}),scene,[0,-.025,0],[-Math.PI/2,0,0],false);
shadow.scale.set(1,1.65,1);

// Controls: keyboard plus touch buttons.
const keys=new Set();
let cameraMode=0, speed=0, heading=0, steering=0, rpm=850, gear=0;
let engineOn=true, handbrake=false, steerAngle=0;
let verticalBounce=0, roll=0, pitch=0;
let toastTimer;
function notify(message){toast.textContent=message;toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),1800)}
function setCameraMode(){cameraMode=(cameraMode+1)%4;notify(['КАМЕРА: СЗАДИ','КАМЕРА: КАПОТ','КАМЕРА: САЛОН','КАМЕРА: СВЕРХУ'][cameraMode])}
function resetCar(){car.position.set(0,0,0);car.rotation.set(0,0,0);speed=0;heading=0;steering=0;rpm=850;gear=0;camera.position.set(7,4,9);notify('ВОЛГА ВОЗВРАЩЕНА НА ДОРОГУ')}
addEventListener('keydown',e=>{
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();
  keys.add(e.code);
  if(e.code==='KeyC'&&!e.repeat)setCameraMode();
  if(e.code==='KeyR'&&!e.repeat)resetCar();
  if(e.code==='KeyE'&&!e.repeat){engineOn=!engineOn;notify(engineOn?'ДВИГАТЕЛЬ ЗАПУЩЕН':'ДВИГАТЕЛЬ ЗАГЛУШЕН')}
});
addEventListener('keyup',e=>keys.delete(e.code));
addEventListener('blur',()=>keys.clear());
$('cameraButton').addEventListener('click',setCameraMode);
document.querySelectorAll('[data-key]').forEach(button=>{
  const code=button.dataset.key;
  const down=e=>{e.preventDefault();keys.add(code);button.setPointerCapture?.(e.pointerId)};
  const up=e=>{e.preventDefault();keys.delete(code)};
  button.addEventListener('pointerdown',down);
  button.addEventListener('pointerup',up);
  button.addEventListener('pointercancel',up);
  button.addEventListener('lostpointercapture',up);
});

// Procedural engine audio. Browsers unlock sound after the first user gesture.
let audioContext=null, engineOsc=null, engineHarmonic=null, engineFilter=null, engineGain=null;
function startEngineAudio(){
  if(audioContext)return;
  const AudioCtx=window.AudioContext||window.webkitAudioContext;
  if(!AudioCtx)return;
  audioContext=new AudioCtx();
  engineOsc=audioContext.createOscillator();
  engineHarmonic=audioContext.createOscillator();
  engineFilter=audioContext.createBiquadFilter();
  engineGain=audioContext.createGain();
  const harmonicGain=audioContext.createGain();
  engineOsc.type='sawtooth'; engineHarmonic.type='triangle';
  engineFilter.type='lowpass'; engineFilter.frequency.value=230;
  engineGain.gain.value=0;
  harmonicGain.gain.value=.18;
  engineOsc.connect(engineFilter);
  engineHarmonic.connect(harmonicGain); harmonicGain.connect(engineFilter);
  engineFilter.connect(engineGain); engineGain.connect(audioContext.destination);
  engineOsc.start(); engineHarmonic.start();
}
addEventListener('pointerdown',startEngineAudio,{once:true});
addEventListener('keydown',startEngineAudio,{once:true});

const clock=new THREE.Clock();
const forward=new THREE.Vector3(), desiredCamera=new THREE.Vector3(), targetLook=new THREE.Vector3();
const cameraOffset=new THREE.Vector3();
const gearRatios=[0,3.5,2.26,1.45,1.0,.82];
const maxSpeed=42; // m/s, approximate road speed cap
function smooth(current,target,rate,dt){return THREE.MathUtils.damp(current,target,rate,dt)}
function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),.035);
  const throttle=engineOn&&(keys.has('KeyW')||keys.has('ArrowUp'));
  const brake=keys.has('KeyS')||keys.has('ArrowDown');
  const left=keys.has('KeyA')||keys.has('ArrowLeft');
  const right=keys.has('KeyD')||keys.has('ArrowRight');
  handbrake=keys.has('Space');
  const absSpeed=Math.abs(speed);
  const steerTarget=(left?1:0)-(right?1:0);
  steering=smooth(steering,steerTarget,5.5,dt);
  steerAngle=steering*.48;

  // Approximate 2.4-litre petrol engine, 4-speed manual ratios with automatic shifting for playability.
  const targetGear=absSpeed<.35?0:absSpeed<5.2?1:absSpeed<10.5?2:absSpeed<17?3:absSpeed<25?4:5;
  if(speed>=0)gear=targetGear;
  const ratio=gearRatios[Math.max(0,gear)];
  const wheelRpm=absSpeed/(.49*2*Math.PI)*60;
  const targetRpm=engineOn?THREE.MathUtils.clamp(850+wheelRpm*ratio*3.25,850,5200):0;
  rpm=smooth(rpm,targetRpm,throttle?3.2:5.5,dt);
  const torqueFactor=THREE.MathUtils.clamp(1-Math.abs(rpm-2600)/4200,.35,1);
  const driveAcceleration=throttle?(gear===0?2.15:4.3*torqueFactor):0;
  const braking=brake?(speed>0?8.5:4.0):0;
  speed+=driveAcceleration*dt;
  if(brake)speed-=Math.sign(speed||1)*braking*dt;
  if(handbrake)speed-=Math.sign(speed||1)*Math.min(absSpeed*4,12)*dt;
  if(!throttle&&!brake)speed-=Math.sign(speed)*Math.min(absSpeed,0.52)*dt;
  speed=THREE.MathUtils.clamp(speed,-3.2,maxSpeed);
  if(speed<-.15)gear=-1; else if(absSpeed<.18&&!throttle)gear=0;

  const steeringAuthority=THREE.MathUtils.clamp(absSpeed/2.5,0,1);
  const yawRate=(speed/(2.65))*Math.tan(steerAngle)*.72;
  heading+=yawRate*dt;
  forward.set(-Math.sin(heading),0,-Math.cos(heading));
  car.position.addScaledVector(forward,speed*dt);
  car.rotation.y=heading;
  const accelVisual=throttle?-.018:brake?.025:0;
  pitch=smooth(pitch,accelVisual,4,dt);
  roll=smooth(roll,-steering*steeringAuthority*.035,3,dt);
  verticalBounce=smooth(verticalBounce,Math.sin(clock.elapsedTime*9)*Math.min(absSpeed/30,.025),5,dt);
  body.position.y=.0+verticalBounce;
  body.rotation.z=roll;
  body.rotation.x=pitch;
  steeringWheel.rotation.z=-steering*.48;
  wheels.forEach(w=>{
    w.group.rotation.x-=speed*dt/.49;
    if(w.front)w.group.rotation.y=steerAngle;
  });
  shadow.position.set(car.position.x,-.025,car.position.z);

  // Four camera views: chase, bonnet, cabin and high-angle.
  const sin=Math.sin(heading), cos=Math.cos(heading);
  if(cameraMode===0){
    desiredCamera.set(car.position.x+sin*8.8,4.0,car.position.z+cos*8.8);
    targetLook.set(car.position.x,1.05,car.position.z);
  }else if(cameraMode===1){
    desiredCamera.set(car.position.x-sin*.18,2.0,car.position.z-cos*1.15);
    targetLook.set(car.position.x-sin*15,1.6,car.position.z-cos*16);
  }else if(cameraMode===2){
    desiredCamera.set(car.position.x-sin*.42,1.72,car.position.z-cos*.1);
    targetLook.set(car.position.x-sin*12,1.65,car.position.z-cos*12);
  }else{
    desiredCamera.set(car.position.x+sin*2,12,car.position.z+cos*2);
    targetLook.set(car.position.x,0,car.position.z);
  }
  camera.position.lerp(desiredCamera,1-Math.exp(-4.2*dt));
  camera.lookAt(targetLook);

  const kmh=Math.round(absSpeed*3.6);
  speedEl.textContent=String(kmh);
  speedBar.style.width=Math.min(kmh/160*100,100)+'%';
  rpmEl.textContent=String(Math.round(rpm/10)*10);
  rpmBar.style.width=Math.min(rpm/5500*100,100)+'%';
  if(audioContext&&engineOsc){
    const base=Math.max(18,rpm/30);
    engineOsc.frequency.setTargetAtTime(base,audioContext.currentTime,.08);
    engineHarmonic.frequency.setTargetAtTime(base*2.02,audioContext.currentTime,.08);
    engineFilter.frequency.setTargetAtTime(engineOn?170+rpm*.075:90,audioContext.currentTime,.12);
    engineGain.gain.setTargetAtTime(engineOn?(throttle?.075:.038):.0001,audioContext.currentTime,.16);
  }
  const shownGear=speed<-.2?'R':gear===0?'N':String(gear);
  gearEl.textContent=shownGear;
  gearNameEl.textContent=shownGear==='R'?'ЗАДНИЙ ХОД':shownGear==='N'?'НЕЙТРАЛЬ':'ПЕРЕДАЧА';
  renderer.render(scene,camera);
}
animate();
setTimeout(()=>{loading.classList.add('hidden');setTimeout(()=>loading.remove(),550)},500);

addEventListener('resize',()=>{
  camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));
});
