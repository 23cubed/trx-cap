import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { PointsNodeMaterial } from 'three/examples/jsm/nodes/materials/PointsNodeMaterial.js';

window.THREE = THREE;
window.THREE.PointsNodeMaterial = PointsNodeMaterial;
window.GLTFLoader = GLTFLoader;
