import * as THREE from 'three';
import './style.css';

const app = document.querySelector('#app');
const speedValue = document.querySelector('#speed');
const gearValue = document.querySelector('#gear');
const loading = document.querySelector('#loading');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9db4c2);
scene.fog = new THREE.Fog(0x9db4c2, 45, 170);

const camera = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, 0.1, 300);
camera.position.set(7, 5, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
app.prepend(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xe5f2ff, 0x59604b, 2.0));
const sun = new THREE.DirectionalLight(0xffedcf, 3.0);
sun.position.set(-25, 35, 18);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -45;
sun.shadow.camera.right = 45;
sun.shadow.camera.top = 45;
sun.shadow.camera.bottom = -45;
scene.add(sun);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(500, 500),
  new THREE.MeshStandardMaterial({ color: 0x59645b, roughness: 0.96 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.04;
ground.receiveShadow = true;
scene.add(ground);

const asphalt = new THREE.Mesh(
  new THREE.PlaneGeometry(18, 180),
  new THREE.MeshStandardMaterial({ color: 0x343a3d, roughness: 1 })
);
asphalt.rotation.x = -Math.PI / 2;
asphalt.position.y = -0.015;
asphalt.receiveShadow = true;
scene.add(asphalt);

const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xd9d2ad });
for (let z = -85; z < 90; z += 9) {
  const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 4.5), lineMaterial);
  dash.rotation.x = -Math.PI / 2;
  dash.position.set(0, 0.005, z);
  scene.add(dash);
}

function box(parent, size, position, material, cast = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position);
  mesh.castShadow = cast;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

const paint = new THREE.MeshStandardMaterial({ color: 0x263f50, metalness: 0.72, roughness: 0.28 });
const chrome = new THREE.MeshStandardMaterial({ color: 0xc9d0d2, metalness: 0.9, roughness: 0.2 });
const glass = new THREE.MeshStandardMaterial({ color: 0x263c45, metalness: 0.25, roughness: 0.12, transparent: true, opacity: 0.78 });
const rubber = new THREE.MeshStandardMaterial({ color: 0x17191a, roughness: 0.92 });
const hub = new THREE.MeshStandardMaterial({ color: 0xaeb5b8, metalness: 0.85, roughness: 0.3 });
const lamp = new THREE.MeshStandardMaterial({ color: 0xffe7b0, emissive: 0x5b431b, roughness: 0.25 });
const tailLamp = new THREE.MeshStandardMaterial({ color: 0x9e2520, emissive: 0x310400 });

const car = new THREE.Group();
scene.add(car);

// Simplified GAZ-24-10 body blockout. Forward direction is local -Z.
box(car, [2.05, 0.62, 4.75], [0, 0.86, 0], paint);
box(car, [1.94, 0.18, 1.12], [0, 1.17, -1.66], paint);
box(car, [1.88, 0.15, 1.02], [0, 1.17, 1.72], paint);
box(car, [1.78, 0.82, 2.15], [0, 1.53, 0.05], paint);
box(car, [1.72, 0.66, 1.92], [0, 1.55, 0.05], glass);
box(car, [1.83, 0.1, 0.12], [0, 1.96, -1.02], chrome);
box(car, [1.83, 0.1, 0.12], [0, 1.96, 1.12], chrome);

// Window pillars and roof trim
for (const x of [-0.88, 0.88]) {
  for (const z of [-1.0, 1.08]) box(car, [0.075, 0.76, 0.09], [x, 1.55, z], chrome);
}
box(car, [1.82, 0.09, 2.0], [0, 1.98, 0.05], paint);

// Bumpers, grille, headlights and tail lamps
box(car, [2.12, 0.16, 0.13], [0, 0.72, -2.42], chrome);
box(car, [2.12, 0.16, 0.13], [0, 0.72, 2.42], chrome);
box(car, [0.82, 0.34, 0.045], [0, 0.91, -2.405], chrome);
for (const x of [-0.73, 0.73]) {
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.07, 24), lamp);
  head.rotation.x = Math.PI / 2;
  head.position.set(x, 1.0, -2.43);
  car.add(head);
  const rear = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, 0.07), tailLamp);
  rear.position.set(x, 1.0, 2.42);
  car.add(rear);
}

// Wheels with simple visible steel rims
const wheels = [];
for (const x of [-1.06, 1.06]) {
  for (const z of [-1.55, 1.55]) {
    const wheel = new THREE.Group();
    wheel.position.set(x, 0.53, z);
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.27, 32), rubber);
    tire.rotation.z = Math.PI / 2;
    tire.castShadow = true;
    wheel.add(tire);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.285, 24), hub);
    rim.rotation.z = Math.PI / 2;
    wheel.add(rim);
    const center = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.3, 16), chrome);
    center.rotation.z = Math.PI / 2;
    wheel.add(center);
    car.add(wheel);
    wheels.push(wheel);
  }
}

// Mirrors and door handles
for (const x of [-1.03, 1.03]) {
  box(car, [0.18, 0.08, 0.2], [x, 1.68, -0.76], chrome);
  box(car, [0.035, 0.035, 0.18], [x * 0.98, 1.35, 0.15], chrome);
}

const keys = new Set();
addEventListener('keydown', (event) => {
  keys.add(event.code);
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) event.preventDefault();
  if (event.code === 'KeyC' && !event.repeat) cameraMode = (cameraMode + 1) % 3;
  if (event.code === 'KeyR' && !event.repeat) resetCar();
});
addEventListener('keyup', (event) => keys.delete(event.code));
addEventListener('blur', () => keys.clear());

let speed = 0;
let heading = 0;
let cameraMode = 0;
let steering = 0;
let distance = 0;

function resetCar() {
  car.position.set(0, 0, 0);
  car.rotation.set(0, 0, 0);
  speed = 0;
  heading = 0;
  steering = 0;
  distance = 0;
}

const clock = new THREE.Clock();
const forward = new THREE.Vector3();
const desiredCamera = new THREE.Vector3();
const lookTarget = new THREE.Vector3();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.04);

  const throttle = keys.has('KeyW') || keys.has('ArrowUp');
  const brake = keys.has('KeyS') || keys.has('ArrowDown');
  const left = keys.has('KeyA') || keys.has('ArrowLeft');
  const right = keys.has('KeyD') || keys.has('ArrowRight');
  const handbrake = keys.has('Space');

  if (throttle) speed += 5.5 * dt;
  if (brake) speed -= 9.0 * dt;
  if (!throttle && !brake) speed *= Math.pow(0.985, dt * 60);
  if (handbrake) speed *= Math.pow(0.91, dt * 60);
  speed = THREE.MathUtils.clamp(speed, -7, 34);

  const steerTarget = (left ? 1 : 0) - (right ? 1 : 0);
  steering = THREE.MathUtils.damp(steering, steerTarget, 7, dt);
  const speedFactor = Math.min(Math.abs(speed) / 5, 1);
  heading += steering * speedFactor * Math.sign(speed || 1) * 0.82 * dt;

  forward.set(-Math.sin(heading), 0, -Math.cos(heading));
  car.position.addScaledVector(forward, speed * dt);
  car.rotation.y = heading;
  wheels.forEach((wheel, index) => {
    wheel.rotation.x -= speed * dt / 0.48;
    if (index < 2) wheel.rotation.y = -steering * 0.35;
  });

  if (cameraMode === 0) {
    desiredCamera.set(car.position.x + Math.sin(heading) * 8, 4.2, car.position.z + Math.cos(heading) * 8);
    lookTarget.set(car.position.x, 1.0, car.position.z);
  } else if (cameraMode === 1) {
    desiredCamera.set(car.position.x - Math.sin(heading) * 0.1, 2.15, car.position.z + 0.15);
    lookTarget.set(car.position.x - Math.sin(heading) * 12, 2.0, car.position.z - Math.cos(heading) * 12);
  } else {
    desiredCamera.set(car.position.x + Math.sin(heading) * 13, 8, car.position.z + Math.cos(heading) * 13);
    lookTarget.set(car.position.x, 0, car.position.z);
  }
  camera.position.lerp(desiredCamera, 1 - Math.exp(-4 * dt));
  camera.lookAt(lookTarget);

  speedValue.textContent = String(Math.round(Math.abs(speed) * 3.6));
  gearValue.textContent = speed < -0.2 ? 'R' : speed > 0.5 ? (speed < 8 ? '1' : speed < 15 ? '2' : speed < 23 ? '3' : '4') : 'N';
  renderer.render(scene, camera);
}
animate();
loading?.remove();

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
