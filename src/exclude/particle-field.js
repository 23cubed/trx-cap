function initParticleField() {
    var canvas = document.querySelector('#texture-canvas');
    if (!canvas) {
        console.error('Canvas id="texture-canvas" not found.');
        return;
    }

    var width = canvas.offsetWidth,
        height = canvas.offsetHeight;

    var renderer = new window.THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 1);

    // Start a render loop for crisp particles
    renderer.setAnimationLoop(function() {
        renderer.render(scene, camera);
    });

    var scene = new window.THREE.Scene();
    var camera = new window.THREE.PerspectiveCamera(50, width / height, 0.1, 2000);
    camera.position.set(0, 0, 80);

    var ambientLight = new window.THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    var directionalLight = new window.THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);

    var loader = new window.GLTFLoader();
    var dnaUrl = 'https://cdn.jsdelivr.net/gh/23cubed/trx-cap@bfce75cfaf510a177a553bf3f44ed850367417aa/src/assets/DNA.gltf';

    loader.load(
        dnaUrl,
        function (gltf) {
            gltf.scene.updateMatrixWorld(true);
            
            // Uniformly sample points on the mesh surface using MeshSurfaceSampler
            // Find the first Mesh child
            var mesh = null;
            gltf.scene.traverse(function(child) {
                if (child.isMesh) mesh = child;
            });
            if (!mesh) return;
            // Optionally ensure normals are current for shading
            mesh.geometry.computeVertexNormals();
            // Setup sampler and sample exactly numParticles
            var numParticles = 5000;
            var sampler = new window.THREE.MeshSurfaceSampler(mesh).build();
            var positions = new Float32Array(numParticles * 3);
            var colors = new Float32Array(numParticles * 3);
            var tempPosition = new window.THREE.Vector3();
            for (var i = 0; i < numParticles; i++) {
                sampler.sample(tempPosition);
                positions[3 * i]     = tempPosition.x;
                positions[3 * i + 1] = tempPosition.y;
                positions[3 * i + 2] = tempPosition.z;
                // white color
                colors[3 * i]     = 1;
                colors[3 * i + 1] = 1;
                colors[3 * i + 2] = 1;
            }
            var particleGeometry = new window.THREE.BufferGeometry();
            particleGeometry.setAttribute('position', new window.THREE.Float32BufferAttribute(positions, 3));
            particleGeometry.setAttribute('color', new window.THREE.Float32BufferAttribute(colors, 3));

            // Load crisp dot texture via SVG
            var svg = '<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="15" fill="white"/></svg>';
            var texture = new window.THREE.TextureLoader().load('data:image/svg+xml;base64,' + btoa(svg));

            // Create PointsMaterial with fixed screen size and vertex colors
            var particleMaterial = new window.THREE.PointsMaterial({
                size: 5,
                sizeAttenuation: false,
                vertexColors: true,
                map: texture,
                alphaTest: 0.5
            });

            var particleSystem = new window.THREE.Points(particleGeometry, particleMaterial);
            var box = new window.THREE.Box3().setFromObject(particleSystem);
            var center = box.getCenter(new window.THREE.Vector3());

            particleSystem.position.sub(center);
            particleSystem.rotation.x = Math.PI / 2;
            particleSystem.scale.setScalar(20);

            scene.add(particleSystem);
        },
        undefined,
        function (error) {
            console.error('Error loading GLTF model:', error);
        }
    );
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initParticleField);
} else {
    initParticleField();
}