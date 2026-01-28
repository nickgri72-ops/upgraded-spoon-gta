import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/loaders/GLTFLoader.js";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.4));
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(50, 100, 50);
scene.add(light);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(500, 500),
  new THREE.MeshStandardMaterial({ color: 0x228B22 })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

const loader = new GLTFLoader();

let player, car;
let inCar = false;
let canToggleCar = true;
let bullets = [];

loader.load('models/player.glb', (gltf) => {
  player = gltf.scene;
  player.scale.set(1, 1, 1);
  player.position.set(0, 0, 0);
  scene.add(player);
});

loader.load('models/car.glb', (gltf) => {
  car = gltf.scene;
  car.scale.set(1, 1, 1);
  car.position.set(5, 0, 5);
  scene.add(car);
});

let keys = {};
document.addEventListener("keydown", (e) => keys[e.key.toLowerCase()] = true);
document.addEventListener("keyup", (e) => keys[e.key.toLowerCase()] = false);

document.addEventListener("click", () => {
  if (!player) return;
  const bullet = new THREE.Mesh(
    new THREE.SphereGeometry(0.2),
    new THREE.MeshBasicMaterial({ color: 0xffff00 })
  );
  bullet.position.copy(player.position);
  bullet.velocity = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).multiplyScalar(0.5);
  scene.add(bullet);
  bullets.push(bullet);
});

function animate() {
  requestAnimationFrame(animate);

  if (player && car) {
    // ENTER
    if (!inCar && keys.e && canToggleCar && player.position.distanceTo(car.position) < 2) {
      inCar = true;
      canToggleCar = false;
      setTimeout(() => canToggleCar = true, 300);
    }

    // EXIT
    if (inCar && keys.f && canToggleCar) {
      inCar = false;
      canToggleCar = false;
      player.position.set(car.position.x + 2, car.position.y, car.position.z);
      setTimeout(() => canToggleCar = true, 300);
    }

    // MOVE
    if (!inCar) {
      if (keys.w) player.position.z -= 0.1;
      if (keys.s) player.position.z += 0.1;
      if (keys.a) player.position.x -= 0.1;
      if (keys.d) player.position.x += 0.1;
    } else {
      if (keys.w) car.position.z -= 0.2;
      if (keys.s) car.position.z += 0.2;
      if (keys.a) car.rotation.y += 0.05;
      if (keys.d) car.rotation.y -= 0.05;
      player.position.copy(car.position);
    }
  }

  bullets.forEach(b => b.position.add(b.velocity));

  const target = inCar ? car : player;
  if (target) {
    camera.position.lerp(new THREE.Vector3(target.position.x, target.position.y + 5, target.position.z + 10), 0.1);
    camera.lookAt(target.position);
  }
