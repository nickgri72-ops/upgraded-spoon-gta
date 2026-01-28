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

let carSpeed = 0;
let carRotationSpeed = 0.03;

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

// CAMERA CONTROL
let mouseDown = false;
let prevMouseX = 0;
let prevMouseY = 0;
let cameraRotation = { x: 0, y: 0 };

document.addEventListener("mousedown", (e) => {
  mouseDown = true;
  prevMouseX = e.clientX;
  prevMouseY = e.clientY;
});

document.addEventListener("mouseup", () => {
  mouseDown = false;
});

document.addEventListener("mousemove", (e) => {
  if (!mouseDown) return;

  const deltaX = e.clientX - prevMouseX;
  const deltaY = e.clientY - prevMouseY;

  cameraRotation.y += deltaX * 0.002;
  cameraRotation.x += deltaY * 0.002;

  cameraRotation.x = Math.max(-1.2, Math.min(1.2, cameraRotation.x));

  prevMouseX = e.clientX;
  prevMouseY = e.clientY;
});

document.addEventListener("click", () => {
  if (!player) return;
  const bullet = new THREE.Mesh(
    new THREE.SphereGeometry(0.2),
    new THREE.MeshBasicMaterial({ color: 0xffff00 })
  );
  bullet.position.copy(player.position);
  bullet.velocity = new THREE.Vector3(0, 0, -1)
    .applyQuaternion(camera.quaternion)
    .multiplyScalar(0.5);

  scene.add(bullet);
  bullets.push(bullet);
});

function animate() {
  requestAnimationFrame(animate);

  if (player && car) {
    // ENTER CAR
    if (!inCar && keys.e && canToggleCar && player.position.distanceTo(car.position) < 2) {
      inCar = true;
      canToggleCar = false;
      setTimeout(() => canToggleCar = true, 300);
    }

    // EXIT CAR
    if (inCar && keys.f && canToggleCar) {
      inCar = false;
      canToggleCar = false;
      player.position.set(car.position.x + 2, car.position.y, car.position.z);
      setTimeout(() => canToggleCar = true, 300);
    }

    // PLAYER MOVEMENT
    if (!inCar) {
      if (keys.w) player.position.z -= 0.1;
      if (keys.s) player.position.z += 0.1;
      if (keys.a) player.position.x -= 0.1;
      if (keys.d) player.position.x += 0.1;
    } 
    // CAR MOVEMENT (REALISTIC)
    else {
      if (keys.w) carSpeed = Math.min(carSpeed + 0.01, 0.4);
      if (keys.s) carSpeed = Math.max(carSpeed - 0.01, -0.2);

      if (!keys.w && !keys.s) {
        carSpeed *= 0.98; // friction
      }

      if (keys.a) car.rotation.y += carRotationSpeed;
      if (keys.d) car.rotation.y -= carRotationSpeed;

      // move car in facing direction
      car.position.x += Math.sin(car.rotation.y) * carSpeed;
      car.position.z += Math.cos(car.rotation.y) * carSpeed;

      player.position.copy(car.position);
    }
  }

  bullets.forEach(b => b.position.add(b.velocity));

  const target = inCar ? car : player;
  if (target) {
    const offset = new THREE.Vector3(0, 5, 10);
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraRotation.y);

    camera.position.lerp(
      new THREE.Vector3(target.position.x, target.position.y + 5, target.position.z,).add(offset),
      0.1
    );

    camera.lookAt(target.position);
  }

  renderer.render(scene, camera);
}

animate();
