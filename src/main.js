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

// Горький / советский городской район по визуальному референсу из загруженного проекта.
const ground = mesh(new THREE.PlaneGeometry(800,800),mat(0x405238,0,0.98),scene,[0,-.13,0],[-Math.PI/2,0,0],false);
const asphalt = mat(0x292c30,0,0.94), sidewalk = mat(0x96999a,0,0.9), curb = mat(0x656a6b,0,0.9);
const laneWhite = mat(0xd9dcda,0,0.85), grass = mat(0x405a35,0,0.98);
const windowDark = mat(0x344b5c,.12,.25), windowLit = mat(0xb99a63,.08,.3,{emissive:0x32230e});
const concrete = mat(0x92999d,0,0.9), brick = mat(0x914c3e,0,0.9);
const roadMain = mesh(new THREE.PlaneGeometry(16,640),asphalt,scene,[0,-.07,0],[-Math.PI/2,0,0],false);
for(const z of [-160,0,160]) mesh(new THREE.PlaneGeometry(540,14),asphalt,scene,[0,-.065,z],[-Math.PI/2,0,0],false);
for(const x of [-9.8,9.8]) mesh(new THREE.BoxGeometry(3.6,.22,640),sidewalk,scene,[x,.11,0],[0,0,0],false);
for(const z of [-160,0,160]){
  for(const x of [-.15,.15]) mesh(new THREE.PlaneGeometry(.18,640),laneWhite,scene,[x,-.045,0],[-Math.PI/2,0,0],false);
  for(const offset of [-11,11]) for(let x=-7.2;x<=7.2;x+=1.4)
    mesh(new THREE.PlaneGeometry(.6,5.2),laneWhite,scene,[x,-.035,z+offset],[-Math.PI/2,0,0],false);
}
for(let z=-300;z<300;z+=9){
  if([-160,0,160].some(v=>Math.abs(z-v)<12)) continue;
  for(const x of [-3.8,3.8]) mesh(new THREE.PlaneGeometry(.16,3.8),laneWhite,scene,[x,-.04,z],[-Math.PI/2,0,0],false);
}
// Боковые улицы, дворы и кварталы.
for(const x of [-45,45]) mesh(new THREE.PlaneGeometry(12,640),asphalt,scene,[x,-.075,0],[-Math.PI/2,0,0],false);
for(const z of [-80,-240,80,240]) mesh(new THREE.PlaneGeometry(260,12),asphalt,scene,[0,-.075,z],[-Math.PI/2,0,0],false);
const panelCanvas=document.createElement('canvas');
panelCanvas.width=512;panelCanvas.height=512;
const panelCtx=panelCanvas.getContext('2d');
panelCtx.fillStyle='#9ba2a8';panelCtx.fillRect(0,0,512,512);
for(let y=18;y<512;y+=96)for(let x=18;x<512;x+=96){
  panelCtx.fillStyle='#e2e4e3';panelCtx.fillRect(x,y,58,66);
  panelCtx.fillStyle='#304555';panelCtx.fillRect(x+4,y+4,50,58);
  if((x+y)%5===0){panelCtx.fillStyle='#d2b77d';panelCtx.fillRect(x+6,y+6,20,48);}
  panelCtx.fillStyle='#d8dadd';panelCtx.fillRect(x+28,y+4,3,58);
  panelCtx.fillRect(x+2,y+30,54,3);
}
const panelTexture=new THREE.CanvasTexture(panelCanvas);
panelTexture.colorSpace=THREE.SRGBColorSpace;
const enterableBuildings=[];
function createRoomInterior(w,d){
  const room=new THREE.Group();
  const iw=Math.max(7,w-1.8), id=Math.max(7,d-1.8);
  const wall=mat(0xb8b09e,0,0.92), floor=mat(0x77736a,0,0.96);
  box(room,[iw,.16,id],[0,.08,0],floor);
  box(room,[(iw-1.2)/2,2.9,.16],[-(iw+1.2)/4,1.53,-id/2],wall);
  box(room,[(iw-1.2)/2,2.9,.16],[(iw+1.2)/4,1.53,-id/2],wall);
  box(room,[1.2,.75,.16],[0,2.62,-id/2],wall);
  box(room,[iw,2.9,.16],[0,1.53,id/2],wall);
  box(room,[.16,2.9,id],[-iw/2,1.53,0],wall);
  box(room,[.16,2.9,id],[iw/2,1.53,0],wall);
  box(room,[iw,.16,id],[0,3.02,0],mat(0xaaa493,0,.95));
  box(room,[Math.min(3.8,iw*.55),.95,.55],[0,.62,-id*.28],mat(0x765b43,0,.8),.04,2);
  box(room,[Math.min(3.5,iw*.5),.08,.62],[0,1.12,-id*.28],mat(0x9a8060,0,.72),.025,2);
  box(room,[1.35,.78,.55],[-iw*.28,.48,id*.22],mat(0x5d5142,0,.9),.05,3);
  box(room,[1.35,.78,.55],[iw*.28,.48,id*.22],mat(0x5d5142,0,.9),.05,3);
  box(room,[1.7,.35,.12],[0,.65,id/2-.22],mat(0x9a9b91,0,.8));
  for(const x of [-.9,.9])sphere(room,[x,2.82,0],[.16,.07,.16],mat(0xffe5b4,.05,.3,{emissive:0x594522}));
  return room;
}
function registerEnterable(exterior,x,z,w,d,name){
  const doorMat=mat(0x594331,0,0.82), frameMat=mat(0xaaa18e,0,0.8);
  box(exterior,[1.18,2.18,.14],[0,1.09,-d/2-.095],doorMat,.025,2);
  box(exterior,[1.34,.12,.2],[0,2.2,-d/2-.095],frameMat,.02,2);
  for(const side of [-1,1])box(exterior,[.1,2.2,.2],[side*.64,1.1,-d/2-.095],frameMat,.02,2);
  box(exterior,[1.5,.18,.85],[0,.09,-d/2-.42],concrete,.025,2);
  const interior=createRoomInterior(w,d);
  interior.position.set(x,0,z);scene.add(interior);interior.visible=false;
  enterableBuildings.push({exterior,interior,x,z,w,d,name,doorX:x,doorZ:z-d/2-.9});
}
function cityBuilding(x,z,w,h,d,material,style=0){
  const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);
  box(g,[w,h,d],[0,h/2,0],material,.08,3);
  box(g,[w+.25,.35,d+.25],[0,h+.16,0],mat(style===1?0x4a4c4d:0x65696a,0,.9),.04,2);
  const facadeMat=new THREE.MeshStandardMaterial({map:panelTexture,roughness:.82});
  const front=mesh(new THREE.PlaneGeometry(w-.8,h-.8),facadeMat,g,[0,h/2,-d/2-.045]);
  const side=mesh(new THREE.PlaneGeometry(d-.8,h-.8),facadeMat,g,[w/2+.045,h/2,0],[0,Math.PI/2,0]);
  if(style===1){
    for(const dz of [-d/3,0,d/3]){
      box(g,[2.4,.15,1.8],[w/2-2.5,2.8,dz],concrete,.03,2);
      box(g,[.12,2.4,1.5],[w/2-.9,1.2,dz],mat(0x49372c),.02,1);
    }
  }
  registerEnterable(g,x,z,w,d,style===1?'ЖИЛОЙ ПОДЪЕЗД':'ОБЩЕСТВЕННОЕ ЗДАНИЕ');
  return g;
}
// Пятиэтажные хрущёвки и девятиэтажные панельные дома.
for(const p of [{x:-32,z:-80},{x:-32,z:-220},{x:32,z:-80},{x:32,z:-220},{x:34,z:80},{x:34,z:220}]){
  cityBuilding(p.x,p.z,34,16,14,concrete,1);
  for(const dz of [-9,0,9]){
    box(scene,[2.4,.15,1.8],[p.x+(p.x<0?7.6:-7.6),2.8,p.z+dz],concrete,.03,2);
    box(scene,[.12,2.4,1.6],[p.x+(p.x<0?7.0:-7.0),1.2,p.z+dz],mat(0x49372c),.02,1);
  }
}
for(const p of [{x:-68,z:-80},{x:-68,z:-220},{x:70,z:-80},{x:70,z:-220},{x:70,z:80},{x:-70,z:220}])
  cityBuilding(p.x,p.z,22,28,20,mat(0x9ba2a8),1);
// Универмаг и кинотеатр «Родина».
cityBuilding(-30,80,28,8,18,mat(0xaaa89d),0);
box(scene,[18,2.2,.15],[-15.8,6.2,80],mat(0xa51c1c),.04,2);
cityBuilding(-34,-134,32,12,22,brick,0);
box(scene,[20,2.2,.15],[-17.8,8.5,-134],mat(0x234e80),.04,2);
// Советская АЗС №42 с навесом, колонками и кассой.
const stationX=-44, stationZ=20;
box(scene,[36,.12,44],[stationX,.06,stationZ],concrete,.03,2);
box(scene,[28,.65,22],[stationX,5.2,stationZ],mat(0x273a49,.35,.4),.08,3);
box(scene,[17,1.7,.12],[stationX,5.2,stationZ+11.1],mat(0xa51c1c),.03,2);
for(const x of [-53,-35]) for(const z of [14,26])
  mesh(new THREE.CylinderGeometry(.35,.35,5.2,12),mat(0x33414a,.5,.4),scene,[x,2.6,z]);
for(const z of [16.5,23.5]){
  box(scene,[.85,1.7,1.0],[stationX,1.0,z],mat(0xb52626),.08,3);
  box(scene,[.58,.55,.07],[stationX,.99,z-.53],mat(0xd9d6c7),.02,2);
  tube(scene,[[stationX+.4,1.6,z],[stationX+.9,1.8,z+.4],[stationX+1.1,.35,z+.7]],.035,black);
}
cityBuilding(stationX-14,stationZ,8,3.6,6,mat(0x283c4b),0);
box(scene,[6,.8,.08],[stationX-14,2.5,stationZ-3.05],mat(0x9c2525),.02,2);
// Фонари, берёзы, автобусная остановка и таксофон.
for(let z=-280;z<=280;z+=55){
  if([-160,0,160].some(v=>Math.abs(z-v)<15)) continue;
  for(const side of [-1,1]){
    const x=side*11.2;
    mesh(new THREE.CylinderGeometry(.12,.16,8.5,10),mat(0x70777b,.55,.4),scene,[x,4.25,z]);
    tube(scene,[[x,8.1,z],[x-side*.8,8.35,z],[x-side*1.8,8.1,z]],.055,chrome);
    sphere(scene,[x-side*1.8,8.05,z],[.2,.12,.25],mat(0xffdba0,.1,.25,{emissive:0x6c4c20}));
  }
}
for(let z=-260;z<=260;z+=35){
  if([-160,0,160].some(v=>Math.abs(z-v)<20)) continue;
  for(const side of [-1,1]){
    const x=side*14.5;
    mesh(new THREE.CylinderGeometry(.22,.28,4.2,10),mat(0xe7e9e7),scene,[x,2.1,z]);
    mesh(new THREE.ConeGeometry(2.4,6.2,10),mat(0x486b32),scene,[x,5.8,z]);
  }
}
box(scene,[6.4,2.8,2.6],[11.8,1.5,-45],mat(0x315d82),.06,3);
box(scene,[5.8,2.2,.05],[11.8,1.5,-43.68],glass,.02,2);
box(scene,[.9,2.2,.9],[-11.5,1.2,35],mat(0xb62222),.04,3);
// Светофоры на трёх перекрёстках.
for(const z of [-160,0,160]) for(const x of [-9.5,9.5]){
  mesh(new THREE.CylinderGeometry(.1,.12,5.2,8),mat(0x555b60),scene,[x,2.6,z+(x<0?-9:9)]);
  box(scene,[.44,1.35,.44],[x,4.4,z+(x<0?-9:9)],mat(0x202326),.05,2);
  for(let i=0;i<3;i++) sphere(scene,[x,4.78-i*.38,z+(x<0?-8.75:8.75)],[.13,.13,.08],mat([0xb51f1f,0xb58a22,0x1e8b4b][i],0,.3,{emissive:[0x310000,0x302000,0x003010][i]}));
}
//

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

// A compact procedural town around the driving area: connected streets, sidewalks,
// varied apartment blocks, shops, windows, street lamps and small courtyards.
const cityRoad = mat(0x343a3b,0,0.98);
const sidewalkMat = mat(0xaaa99c,0,0.95);
const curbMat = mat(0x777a75,0,0.92);
const facadeMats = [0xb9aa91,0x9daba9,0xb7b4a8,0x9c8d7e,0xc0b49b,0x879a9b].map(c=>mat(c,0,0.88));
const windowMat = mat(0x40545b,0.18,0.22,{emissive:0x101b20});
const litWindowMat = mat(0xc6ad78,0.08,0.3,{emissive:0x33240e});
const roofMat = mat(0x555b59,0,0.9);
const city = new THREE.Group(); scene.add(city);
// Streets run in both directions, forming a navigable grid.
for(let x=-105;x<=105;x+=30){
  mesh(new THREE.PlaneGeometry(13,330),cityRoad,city,[x,-.068,-15],[-Math.PI/2,0,0],false);
  for(const side of [-1,1]){
    mesh(new THREE.PlaneGeometry(2.2,330),sidewalkMat,city,[x+side*7.6,-.045,-15],[-Math.PI/2,0,0],false);
    mesh(new THREE.BoxGeometry(.16,.18,330),curbMat,city,[x+side*6.45,.035,-15], [0,0,0],false);
  }
}
for(let z=-165;z<=135;z+=30){
  mesh(new THREE.PlaneGeometry(240,13),cityRoad,city,[0,-.067,z],[-Math.PI/2,0,0],false);
  for(const side of [-1,1]){
    mesh(new THREE.PlaneGeometry(240,2.2),sidewalkMat,city,[0,-.044,z+side*7.6],[-Math.PI/2,0,0],false);
    mesh(new THREE.BoxGeometry(240,.18,.16),curbMat,city,[0,.035,z+side*6.45],[0,0,0],false);
  }
}
// Buildings occupy the blocks between streets; each gets a distinct height and facade.
let buildingIndex=0;
for(let x=-90;x<105;x+=30){
  for(let z=-150;z<135;z+=30){
    if(Math.abs(x+15)<16 && Math.abs(z+15)<17) continue;
    const w=12+(buildingIndex%3)*2.1;
    const d=12+((buildingIndex*2)%3)*1.8;
    const floors=2+(buildingIndex*7%5);
    const h=floors*3.05;
    const bx=x+15, bz=z+15;
    const b=new THREE.Group(); b.position.set(bx,0,bz); city.add(b);
    const facade=facadeMats[buildingIndex%facadeMats.length];
    box(b,[w,h,d],[0,h/2,0],facade,.12,3);
    box(b,[w+.35,.28,d+.35],[0,h+.12,0],roofMat,.06,2);
    // Recessed-looking front windows and a shopfront at street level.
    for(let floor=0;floor<floors;floor++){
      const y=1.05+floor*3.05;
      const count=Math.max(2,Math.floor(w/3.1));
      for(let n=0;n<count;n++){
        const wx=-w/2+1.55+n*(w-3.1)/(count-1||1);
        box(b,[1.12,1.35,.055],[wx,y,-d/2-.035],(floor===0&&buildingIndex%4===0)?litWindowMat:windowMat,.035,2);
        box(b,[1.2,.055,.075],[wx,y-.72,-d/2-.035],chrome,.012,2);
      }
    }
    if(buildingIndex%4===0){
      box(b,[w*.72,1.75,.09],[0,1.0,-d/2-.08],mat(0x52666a,0.15,.25),.035,2);
      box(b,[w*.76,.16,.12],[0,1.95,-d/2-.08],mat(0xe0d1ad,0,0.6),.025,2);
    }
    // Side windows make the blocks readable when driving along cross streets.
    for(let floor=0;floor<floors;floor++){
      const y=1.05+floor*3.05;
      for(const side of [-1,1]){
        box(b,[.055,1.25,1.05],[side*(w/2+.035),y,0],windowMat,.025,2);
      }
    }
    registerEnterable(b,bx,bz,w,d,'ДОМ №'+(buildingIndex+1));
    buildingIndex++;
  }
}
// Street lamps at intersections and occasional planted trees in courtyards.
const lampMetal=mat(0x353d3d,.72,.32), lampGlow=mat(0xffe2a4,.05,.25,{emissive:0x8a6328});
for(let x=-105;x<=105;x+=30) for(let z=-165;z<=135;z+=30){
  if((x/30+z/30)%2!==0) continue;
  const lx=x+8, lz=z+8;
  mesh(new THREE.CylinderGeometry(.055,.085,4.8,8),lampMetal,city,[lx,2.4,lz]);
  tube(city,[[lx,4.65,lz],[lx,5.0,lz-.35],[lx,5.05,lz-.85]],.045,lampMetal);
  sphere(city,[lx,5.0,lz-.86],[.16,.1,.2],lampGlow);
}
for(let i=0;i<32;i++){
  const x=-100+(i*37%200), z=-155+(i*53%280);
  if(Math.abs((x+15)%30)<7 || Math.abs((z+15)%30)<7) continue;
  mesh(new THREE.CylinderGeometry(.12,.2,2.3,7),mat(0x554738),city,[x,1.15,z]);
  mesh(new THREE.SphereGeometry(1,10,8),mat(0x536b4e),city,[x,2.9,z]).scale.set(1.15,1.35,1.15);
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
  // Steering happens around a fixed kingpin pivot; wheel spin is isolated in its child.
  const steeringPivot=new THREE.Group();
  steeringPivot.position.set(s*1.0,.57,z);
  car.add(steeringPivot);
  const wheel=new THREE.Group(); steeringPivot.add(wheel);
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
  wheels.push({group:wheel,pivot:steeringPivot,front:z<0,side:s});
}

// Boot inventory: one full 5 L can, one empty 5 L can and the hand-crank starter rod.
const inventoryProps = new THREE.Group(); car.add(inventoryProps);
function makeJerryCan(x,z,color){
  const can=new THREE.Group(); inventoryProps.add(can); can.position.set(x,1.48,z);
  box(can,[.32,.52,.19],[0,0,0],mat(color,.15,.48),.035,3);
  box(can,[.18,.08,.08],[0,.31,0],chrome,.02,2);
  box(can,[.13,.12,.08],[.18,.18,0],mat(0x242729),.02,2);
  return can;
}
const fullCanModel=makeJerryCan(-.38,1.72,0x9b2924);
const emptyCanModel=makeJerryCan(.38,1.72,0x8b8e8b);
const starterRod=mesh(new THREE.CylinderGeometry(.025,.025,.85,8),chrome,inventoryProps,[0,1.65,1.95],[0,0,Math.PI/2]);

// Exhaust tail pipe.
tube(body,[[.45,.45,1.65],[.45,.32,1.95],[.45,.3,2.28],[.45,.3,2.48]],.035,darkChrome);

// Ground shadow catcher under the car.
const shadow = mesh(new THREE.CircleGeometry(2.15,48),mat(0x171b1a,0,1,{transparent:true,opacity:.16}),scene,[0,-.025,0],[-Math.PI/2,0,0],false);
shadow.scale.set(1,1.65,1);

// Controls: keyboard plus touch buttons.
const keys=new Set();
let cameraMode=0, speed=0, heading=0, steering=0, rpm=0, gear=0;
let engineOn=false, handbrake=false, steerAngle=0;
let verticalBounce=0, roll=0, pitch=0;
let isOnFoot=false, starterHold=0, stallCountdown=85+Math.random()*55;
let activeBuilding=null;
let fuelLiters=38, fullCanLiters=5, emptyCanLiters=0, canisterCapacity=5;
let mileageKm=42150, fuelFlow=0;
let gameTime=0, promptText='';
let toastTimer;
function notify(message){toast.textContent=message;toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),2200)}
function setCameraMode(){cameraMode=(cameraMode+1)%4;notify(['КАМЕРА: СЗАДИ','КАМЕРА: КАПОТ','КАМЕРА: САЛОН','КАМЕРА: СВЕРХУ'][cameraMode])}
function resetCar(){if(activeBuilding){activeBuilding.interior.visible=false;activeBuilding.exterior.visible=true;activeBuilding=null;}car.position.set(0,0,0);car.rotation.set(0,0,0);speed=0;heading=0;steering=0;rpm=0;gear=0;engineOn=false;isOnFoot=false;player.visible=false;starterHold=0;camera.position.set(7,4,9);notify('ВОЛГА ВОЗВРАЩЕНА · ЗАЖМИ E ДЛЯ ЗАПУСКА')}
const player=new THREE.Group(); scene.add(player);
const playerBody=mesh(new THREE.CapsuleGeometry(.28,.82,4,8),mat(0x303c4a),player,[0,.88,0]);
const playerHead=sphere(player,[0,1.55,0],[.23,.25,.23],mat(0xc69b78));
const playerLegL=mesh(new THREE.CylinderGeometry(.09,.1,.65,8),mat(0x252a30),player,[-.13,.34,0]);
const playerLegR=mesh(new THREE.CylinderGeometry(.09,.1,.65,8),mat(0x252a30),player,[.13,.34,0]);
player.visible=false;
const prompt=$('gamePrompt');
function updatePrompt(text){if(prompt)prompt.textContent=text;}
function worldPoint(localX,localZ){
  const a=heading;
  return new THREE.Vector3(car.position.x+localX*Math.cos(a)+localZ*Math.sin(a),0,car.position.z-localX*Math.sin(a)+localZ*Math.cos(a));
}
function exitCar(){
  if(Math.abs(speed)>1.2){notify('СНАЧАЛА ОСТАНОВИ ВОЛГУ');return;}
  const p=worldPoint(-1.65,.15); player.position.copy(p); player.rotation.y=heading;
  player.visible=true; isOnFoot=true; speed=0; notify('ТЫ ВЫШЕЛ ИЗ МАШИНЫ · E У ДВЕРИ — СЕСТЬ');
}
function enterCar(){
  if(Math.hypot(player.position.x-car.position.x,player.position.z-car.position.z)>3.0)return;
  isOnFoot=false;player.visible=false;starterHold=0;notify('ТЫ СЕЛ В ВОЛГУ');
}
function nearestBuilding(){
  let best=null,bestDistance=Infinity;
  for(const b of enterableBuildings){
    const distance=Math.hypot(player.position.x-b.doorX,player.position.z-b.doorZ);
    if(distance<2.2&&distance<bestDistance){best=b;bestDistance=distance;}
  }
  return best;
}
function enterBuilding(b){
  if(!b)return;
  activeBuilding=b;b.exterior.visible=false;b.interior.visible=true;
  player.position.set(b.x,0,b.z);player.rotation.y=0;
  notify('ТЫ ВОШЁЛ: '+b.name+' · E — ВЫЙТИ');
}
function leaveBuilding(){
  if(!activeBuilding)return;
  const b=activeBuilding;b.interior.visible=false;b.exterior.visible=true;
  player.position.set(b.doorX,0,b.doorZ-1.2);activeBuilding=null;
  notify('ТЫ ВЫШЕЛ НА УЛИЦУ');
}
function inStation(x,z){return Math.abs(x-stationX)<9 && Math.abs(z-stationZ)<11;}
function refuelAtStation(){
  if(!inStation(car.position.x,car.position.z)){notify('ПОДЪЕДЬ К КОЛОНКЕ АЗС');return;}
  if(engineOn){notify('ЗАГЛУШИ ДВИГАТЕЛЬ ПЕРЕД ЗАПРАВКОЙ');return;}
  const before=fuelLiters;
  fuelLiters=55;
  fullCanLiters=5;
  emptyCanLiters=5;
  notify('АЗС: БАК + КАНИСТРЫ ЗАПРАВЛЕНЫ');
}
function pourCanIntoTank(){
  if(Math.hypot(player.position.x-car.position.x,player.position.z-car.position.z)>3.4){notify('ПОДОЙДИ К БАГАЖНИКУ');return;}
  if(fullCanLiters<=0){notify('ПОЛНАЯ КАНИСТРА ПУСТА');return;}
  const amount=Math.min(fullCanLiters,55-fuelLiters);
  fuelLiters+=amount;fullCanLiters-=amount;
  notify('В БАК ЗАЛИТО '+amount.toFixed(1)+' Л');
}
function shiftGear(next){
  if(!keys.has('KeyC') && gear!==0){notify('ВЫЖМИ СЦЕПЛЕНИЕ: C');return;}
  if(Math.abs(speed)>1.5 && next===-1){notify('ЗАДНЮЮ ВКЛЮЧАЙ ПОСЛЕ ОСТАНОВКИ');return;}
  gear=THREE.MathUtils.clamp(next,-1,4);
  notify('ПЕРЕДАЧА: '+(gear===-1?'R':gear===0?'N':gear));
}
addEventListener('keydown',e=>{
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();
  keys.add(e.code);
  if(e.code==='KeyV'&&!e.repeat&&!isOnFoot)setCameraMode();
  if(e.code==='Backspace'&&!e.repeat)resetCar();
  if(e.code==='KeyI'&&!e.repeat&&!isOnFoot){engineOn=false;rpm=0;notify('ДВИГАТЕЛЬ ЗАГЛУШЕН');}
  if(e.code==='KeyE'&&!e.repeat){
    if(!isOnFoot){if(engineOn)exitCar();}
    else if(activeBuilding)leaveBuilding();
    else {
      const door=worldPoint(-1.65,.15);
      if(Math.hypot(player.position.x-door.x,player.position.z-door.z)<1.9)enterCar();
      else enterBuilding(nearestBuilding());
    }
  }
  if(!isOnFoot&&!e.repeat){
    if(e.code==='Digit0')shiftGear(0);
    if(e.code==='Digit1')shiftGear(1);
    if(e.code==='Digit2')shiftGear(2);
    if(e.code==='Digit3')shiftGear(3);
    if(e.code==='Digit4')shiftGear(4);
    if(e.code==='KeyX')shiftGear(-1);
    if(e.code==='ShiftLeft'||e.code==='ShiftRight')shiftGear(Math.min(4,Math.max(1,gear+1)));
    if(e.code==='ControlLeft'||e.code==='ControlRight')shiftGear(Math.max(-1,gear-1));
    if(e.code==='KeyF'&&isOnFoot)pourCanIntoTank();
    if(e.code==='KeyR'&&!isOnFoot)refuelAtStation();
  }
});
addEventListener('keyup',e=>keys.delete(e.code));
document.querySelectorAll('.touch-controls [data-key]').forEach(button=>{
  const code=button.dataset.key;
  const press=e=>{
    e.preventDefault();
    if(!keys.has(code))window.dispatchEvent(new KeyboardEvent('keydown',{code,bubbles:true}));
    button.classList.add('pressed');
  };
  const release=e=>{
    e.preventDefault();
    window.dispatchEvent(new KeyboardEvent('keyup',{code,bubbles:true}));
    button.classList.remove('pressed');
  };
  button.addEventListener('pointerdown',press);
  button.addEventListener('pointerup',release);
  button.addEventListener('pointercancel',release);
  button.addEventListener('lostpointercapture',release);
  button.addEventListener('contextmenu',e=>e.preventDefault());
});
addEventListener('blur',()=>keys.clear());

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
  gameTime+=dt;
  if(!isOnFoot){
    if(!engineOn&&keys.has('KeyE')){
      if(gear!==0){starterHold=0;updatePrompt('СТАРТЕР ЗАБЛОКИРОВАН: ВКЛЮЧИ НЕЙТРАЛЬ');}
      else if(fuelLiters<=0){starterHold=0;updatePrompt('НЕТ БЕНЗИНА — ЗАПРАВЬ БАК');}
      else{
        starterHold+=dt;
        updatePrompt('ЗАПУСК ДВИГАТЕЛЯ: УДЕРЖИВАЙ E · '+Math.min(100,Math.round(starterHold/1.65*100))+'%');
        if(starterHold>=1.65){engineOn=true;rpm=850;starterHold=0;stallCountdown=85+Math.random()*85;notify('СТАРТЕР ПРОКРУТИЛ ДВИГАТЕЛЬ — ВОЛГА ЗАВЕЛАСЬ');}
      }
    }else if(!keys.has('KeyE')&&!engineOn){starterHold=0;}
    const throttle=engineOn&&(keys.has('KeyW')||keys.has('ArrowUp'));
    const brake=keys.has('KeyS')||keys.has('ArrowDown');
    const left=keys.has('KeyA')||keys.has('ArrowLeft');
    const right=keys.has('KeyD')||keys.has('ArrowRight');
    handbrake=keys.has('Space');
    const absSpeed=Math.abs(speed);
    const steerTarget=(left?1:0)-(right?1:0);
    steering=smooth(steering,steerTarget,5.5,dt);
    steerAngle=steering*.30;
    const clutch=keys.has('KeyC');
    const gearRatio=gear===-1?3.2:([0,0,3.54,2.26,1.45,1.0][gear]||0);
    const direction=gear===-1?-1:1;
    const gearTop=gear===-1?5:([0,0,11,19,30,43][gear]||0);
    const drive=throttle&&engineOn&&gear!==0&&!clutch&&absSpeed<gearTop?direction*(gear===1?3.4:gear===2?2.5:gear===3?1.8:gear===4?1.25:2.5):0;
    speed+=drive*dt;
    if(brake)speed-=Math.sign(speed||1)*9*dt;
    if(handbrake)speed-=Math.sign(speed||1)*Math.min(absSpeed*4,12)*dt;
    if(!throttle&&!brake)speed-=Math.sign(speed)*Math.min(absSpeed,.48)*dt;
    if(gear===-1)speed=THREE.MathUtils.clamp(speed,-5,0);
    else if(gear>0)speed=THREE.MathUtils.clamp(speed,0,gearTop);
    else speed=THREE.MathUtils.clamp(speed,-43,43);
    const targetRpm=engineOn?(gear===0||clutch?850+(throttle?Math.min(3900,Math.abs(speed)*100):0):THREE.MathUtils.clamp(850+absSpeed*gearRatio*24,850,4800)):0;
    rpm=smooth(rpm,targetRpm,throttle?3.2:5.5,dt);
    if(engineOn){
      stallCountdown-=dt;
      if(stallCountdown<=0){
        engineOn=false;speed*=.98;rpm=0;starterHold=0;
        notify('ДВИГАТЕЛЬ ЗАГЛОХ! ВЫЙДИ И ЗАВЕДИ РУЧКОЙ');
        stallCountdown=85+Math.random()*85;
      }
      fuelFlow=.00022+absSpeed*11.5/100000;
      fuelLiters=Math.max(0,fuelLiters-fuelFlow*dt);
      mileageKm+=absSpeed*dt/1000;
      if(fuelLiters<=0){engineOn=false;notify('БЕНЗИН ЗАКОНЧИЛСЯ! НУЖНА КАНИСТРА ИЛИ АЗС');}
    }else{rpm=smooth(rpm,0,4,dt);}
    heading+=(speed/2.65)*Math.tan(steerAngle)*.72*dt;
    forward.set(-Math.sin(heading),0,-Math.cos(heading));
    car.position.addScaledVector(forward,speed*dt);
    car.rotation.y=heading;
    pitch=smooth(pitch,throttle?-.018:brake?.025:0,4,dt);
    roll=smooth(roll,-steering*THREE.MathUtils.clamp(absSpeed/2.5,0,1)*.035,3,dt);
    verticalBounce=smooth(verticalBounce,Math.sin(clock.elapsedTime*9)*Math.min(absSpeed/30,.025),5,dt);
    body.position.y=verticalBounce;body.rotation.z=roll;body.rotation.x=pitch;
    steeringWheel.rotation.z=-steering*.48;
    wheels.forEach(w=>{w.group.rotation.x-=speed*dt/.49;if(w.front)w.pivot.rotation.y=steerAngle;});
    shadow.position.set(car.position.x,-.025,car.position.z);
    const sin=Math.sin(heading),cos=Math.cos(heading);
    if(cameraMode===0){desiredCamera.set(car.position.x+sin*8.8,4,car.position.z+cos*8.8);targetLook.set(car.position.x,1.05,car.position.z);}
    else if(cameraMode===1){desiredCamera.set(car.position.x-sin*.18,2,car.position.z-cos*1.15);targetLook.set(car.position.x-sin*15,1.6,car.position.z-cos*16);}
    else if(cameraMode===2){desiredCamera.set(car.position.x-sin*.42,1.72,car.position.z-cos*.1);targetLook.set(car.position.x-sin*12,1.65,car.position.z-cos*12);}
    else{desiredCamera.set(car.position.x+sin*2,12,car.position.z+cos*2);targetLook.set(car.position.x,0,car.position.z);}
    camera.position.lerp(desiredCamera,1-Math.exp(-4.2*dt));camera.lookAt(targetLook);
    const kmh=Math.round(absSpeed*3.6);
    speedEl.textContent=String(kmh);speedBar.style.width=Math.min(kmh/160*100,100)+'%';
    rpmEl.textContent=String(Math.round(rpm/10)*10);rpmBar.style.width=Math.min(rpm/5500*100,100)+'%';
    const shownGear=gear===-1?'R':gear===0?'N':String(gear);
    gearEl.textContent=shownGear;gearNameEl.textContent=shownGear==='R'?'ЗАДНИЙ ХОД':shownGear==='N'?'НЕЙТРАЛЬ':'ПЕРЕДАЧА';
    if(audioContext&&engineOsc){
      const base=engineOn?Math.max(18,rpm/30):(keys.has('KeyE')?55:18);
      engineOsc.frequency.setTargetAtTime(base,audioContext.currentTime,.08);
      engineHarmonic.frequency.setTargetAtTime(base*2.02,audioContext.currentTime,.08);
      engineFilter.frequency.setTargetAtTime(engineOn?170+rpm*.075:90,audioContext.currentTime,.12);
      engineGain.gain.setTargetAtTime(engineOn?(throttle?.075:.038):(keys.has('KeyE')?.012:.0001),audioContext.currentTime,.16);
    }
    const nearStation=inStation(car.position.x,car.position.z);
    updatePrompt((nearStation?(engineOn?'АЗС: I — заглушить, затем R — заправить бак и канистры':'АЗС: R — заправить бак и обе канистры'):(engineOn?'WASD — ехать · C — сцепление · Shift/Ctrl — передачи · 1–4 / 0 / X — выбор · I — заглушить · E — выйти':'НЕЙТРАЛЬ · УДЕРЖИВАЙ E ДЛЯ ЗАПУСКА СТАРТЕРОМ'))+' · БАК '+fuelLiters.toFixed(1)+'/55 л · КАНИСТРЫ '+fullCanLiters.toFixed(1)+'+'+emptyCanLiters.toFixed(1)+' л');
  }else{
    const f=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0);
    const r=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0);
    const run=keys.has('ShiftLeft')||keys.has('ShiftRight');
    const moveSpeed=run?5.2:2.6;
    const fx=-Math.sin(player.rotation.y),fz=-Math.cos(player.rotation.y);
    const rx=Math.cos(player.rotation.y),rz=-Math.sin(player.rotation.y);
    const mx=fx*f+rx*r,mz=fz*f+rz*r,mag=Math.hypot(mx,mz)||1;
    player.position.x+=mx/mag*moveSpeed*dt*(f||r?1:0);
    player.position.z+=mz/mag*moveSpeed*dt*(f||r?1:0);
    if(activeBuilding){
      player.position.x=THREE.MathUtils.clamp(player.position.x,activeBuilding.x-activeBuilding.w/2+1.2,activeBuilding.x+activeBuilding.w/2-1.2);
      player.position.z=THREE.MathUtils.clamp(player.position.z,activeBuilding.z-activeBuilding.d/2+1.2,activeBuilding.z+activeBuilding.d/2-1.2);
    }
    if(r)player.rotation.y+=r*dt*1.8;
    const doorPoint=worldPoint(-1.65,.15);
    const nearDoor=!activeBuilding&&Math.hypot(player.position.x-doorPoint.x,player.position.z-doorPoint.z)<1.9;
    const nearbyBuilding=!activeBuilding?nearestBuilding():null;
    const front=worldPoint(0,-2.8);
    const nearFront=!activeBuilding&&Math.hypot(player.position.x-front.x,player.position.z-front.z)<2.1;
    if(!activeBuilding&&nearFront&&keys.has('KeyE')&&!engineOn){
      starterRod.visible=false;
      starterHold+=dt;
      updatePrompt('РУЧКА ЗАВОДА: УДЕРЖИВАЙ E '+Math.min(100,Math.round(starterHold/2.4*100))+'%');
      if(starterHold>=2.4){
        if(fuelLiters>0){engineOn=true;rpm=850;starterHold=0;starterRod.visible=true;notify('ВОЛГА ЗАВЕЛАСЬ С РУЧКИ!');}
        else{starterHold=0;notify('НЕТ БЕНЗИНА — СНАЧАЛА ЗАПРАВЬ КАНИСТРУ');}
      }
    }else if(!keys.has('KeyE')){starterHold=0;starterRod.visible=true;}
    if(activeBuilding)updatePrompt(activeBuilding.name+' · WASD — ходить · Shift — бежать · E — выйти');
    else if(nearDoor)updatePrompt('E — сесть в Волгу · F — перелить бензин из полной канистры в бак');
    else if(nearbyBuilding)updatePrompt('E — войти в '+nearbyBuilding.name);
    else if(!nearFront)updatePrompt('WASD — идти · Shift — бежать · Подойди к передку и удерживай E, чтобы завести ручкой');
    if(nearFront&&!engineOn&&starterHold===0)updatePrompt('У РАДИАТОРА: удерживай E 2.4 секунды — завести ручкой');
    const footCameraDistance=activeBuilding?THREE.MathUtils.clamp(activeBuilding.d*.22,1.7,3.0):5;
    const footCameraHeight=activeBuilding?2.15:3.0;
    camera.position.lerp(new THREE.Vector3(player.position.x+Math.sin(player.rotation.y)*footCameraDistance,footCameraHeight,player.position.z+Math.cos(player.rotation.y)*footCameraDistance),1-Math.exp(-5*dt));
    camera.lookAt(player.position.x,1.25,player.position.z);
    playerBody.position.y=.88+Math.abs(Math.sin(gameTime*9))*((f||r)? .035:0);
    playerLegL.rotation.x=Math.sin(gameTime*9)*((f||r)? .35:0);
    playerLegR.rotation.x=-Math.sin(gameTime*9)*((f||r)? .35:0);
    const kmh=Math.round(Math.abs(speed)*3.6);speedEl.textContent=String(kmh);
    rpmEl.textContent=String(Math.round(rpm));gearEl.textContent=gear===-1?'R':gear===0?'N':String(gear);
  }
  renderer.render(scene,camera);
}

animate();
setTimeout(()=>{loading.classList.add('hidden');setTimeout(()=>loading.remove(),550)},500);

addEventListener('resize',()=>{
  camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));
});
