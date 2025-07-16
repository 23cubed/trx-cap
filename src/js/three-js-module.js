import * as THREE from 'three/build/three.webgpu.js';
import * as TSL from 'three/build/three.tsl.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

Object.assign(THREE, TSL);

window.THREE = THREE;
window.GLTFLoader = GLTFLoader;
