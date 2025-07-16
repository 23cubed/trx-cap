import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

function initParticleField() {
    var canvas = document.querySelector('#texture-canvas');
    if (!canvas) return console.error('Canvas id="texture-canvas" not found.');

    var width = canvas.offsetWidth,
        height = canvas.offsetHeight;

    var renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio > 1 ? 2 : 1);
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 2000);
    camera.position.set(0, 0, 80);

    // crisp dot texture via SVG
    var svg = '<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="15" fill="white"/></svg>';
    var dotTexture = new THREE.TextureLoader().load('data:image/svg+xml;base64,' + btoa(svg));

    // prepare for DNA model load
    var gltfLoader = new GLTFLoader();
    var dnaUrl = 'https://cdn.jsdelivr.net/gh/23cubed/trx-cap@bfce75cfaf510a177a553bf3f44ed850367417aa/src/assets/DNA.gltf';
    var dots; // will hold THREE.Points

    gltfLoader.load(dnaUrl, function(gltf) {
        var positionsArr = [];
        gltf.scene.traverse(function(child) {
            if (child.isMesh) {
                var attr = child.geometry.attributes.position;
                for (var i = 0; i < attr.count; i++) {
                    positionsArr.push(attr.getX(i), attr.getY(i), attr.getZ(i));
                }
            }
        });

        var buffer = new THREE.BufferGeometry();
        buffer.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positionsArr), 3));

        var material = new THREE.ShaderMaterial({
            uniforms: { dotTexture: { value: dotTexture } },
            vertexShader: `
                void main() {
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = 1.0;
                }
            `,
            fragmentShader: `
                uniform sampler2D dotTexture;
                void main() {
                    vec4 c = texture2D(dotTexture, gl_PointCoord);
                    gl_FragColor = vec4(1.0, 1.0, 1.0, c.a);
                }
            `,
            transparent: true
        });

        dots = new THREE.Points(buffer, material);
        scene.add(dots);

        // start rendering once model is in
        gsap.ticker.add(render);
    });

    window.addEventListener('mousemove', function(e) {
        if (!dots) return;
        var mx = (e.clientX / window.innerWidth - 0.5) * Math.PI * 0.2;
        var my = (e.clientY / window.innerHeight - 0.5) * Math.PI * 0.5;
        gsap.to(dots.rotation, { x: my, z: mx, duration: 2, ease: 'power1.out' });
    });

    window.addEventListener('resize', function() {
        width = canvas.offsetWidth;
        height = canvas.offsetHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    });

    function render() {
        renderer.render(scene, camera);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initParticleField);
} else {
    initParticleField();
}

export { initParticleField }; 