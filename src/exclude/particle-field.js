function initDNAHelix(scene, setParticleSystem) {
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
            
            // Scale the mesh geometry before sampling particles
            var meshScale = 20;
            mesh.geometry.scale(meshScale, meshScale, meshScale);
            
            // Optionally ensure normals are current for shading
            mesh.geometry.computeVertexNormals();
            // Setup sampler and sample exactly numParticles
            var numParticles = 5000;
            var sampler = new window.MeshSurfaceSampler(mesh).build();
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
            // Calculate center of mass from positions to center the geometry
            var centerX = 0, centerY = 0, centerZ = 0;
            for (var i = 0; i < numParticles; i++) {
                centerX += positions[3 * i];
                centerY += positions[3 * i + 1];
                centerZ += positions[3 * i + 2];
            }
            centerX /= numParticles;
            centerY /= numParticles;
            centerZ /= numParticles;
            
            // Center all positions around origin and apply x-axis rotation
            for (var i = 0; i < numParticles; i++) {
                var x = positions[3 * i] - centerX;
                var y = positions[3 * i + 1] - centerY;
                var z = positions[3 * i + 2] - centerZ;
                
                // Apply 90-degree rotation around x-axis: (x, y, z) -> (x, -z, y)
                positions[3 * i] = x;
                positions[3 * i + 1] = -z;
                positions[3 * i + 2] = y;
            }

            var particleGeometry = new window.THREE.BufferGeometry();
            particleGeometry.setAttribute('position', new window.THREE.Float32BufferAttribute(positions, 3));
            particleGeometry.setAttribute('color', new window.THREE.Float32BufferAttribute(colors, 3));

            // Load crisp dot texture via SVG
            var svg = '<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="15" fill="white"/></svg>';
            var texture = new window.THREE.TextureLoader().load('data:image/svg+xml;base64,' + btoa(svg));

            // Create PointsMaterial with fixed screen size and vertex colors
            var particleMaterial = new window.THREE.PointsMaterial({
                size: 1,
                sizeAttenuation: false,
                vertexColors: true,
                map: texture,
                alphaTest: 0.5
            });

            var newParticleSystem = new window.THREE.Points(particleGeometry, particleMaterial);

            scene.add(newParticleSystem);
            setParticleSystem(newParticleSystem);
        },
        undefined,
        function (error) {
            console.error('Error loading GLTF model:', error);
        }
    );
}

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

    var scene = new window.THREE.Scene();
    var camera = new window.THREE.PerspectiveCamera(50, width / height, 0.1, 2000);
    camera.position.set(0, 0, 80);

    var particleSystem = null;

    // Start a render loop for crisp particles
    renderer.setAnimationLoop(function() {
        if (particleSystem) {
            //particleSystem.rotation.y += 0.01;
        }
        renderer.render(scene, camera);
    });

    var ambientLight = new window.THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    var directionalLight = new window.THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);

    initDNAHelix(scene, function(ps) {
        particleSystem = ps;
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initParticleField);
} else {
    initParticleField();
}