import * as THREE from 'three';
import { GLTFLoader } from '../../node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from '../../node_modules/three/examples/jsm/loaders/FBXLoader.js';
import { MeshSurfaceSampler } from '../../node_modules/three/examples/jsm/math/MeshSurfaceSampler.js';
import { WebGPURenderer } from '../../node_modules/three/build/three.webgpu.js';
import { PointsNodeMaterial } from '../../node_modules/three/build/three.webgpu.nodes.js';

window.THREE = THREE;
window.GLTFLoader = GLTFLoader;
window.FBXLoader = FBXLoader;
window.MeshSurfaceSampler = MeshSurfaceSampler;
window.WebGPURenderer = WebGPURenderer;
window.PointsNodeMaterial = PointsNodeMaterial;
