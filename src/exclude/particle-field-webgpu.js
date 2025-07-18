function initParticleField() {
    console.log('🚀 Starting WebGPU particle field initialization');
    
    var canvas = document.querySelector('#texture-canvas');
    if (!canvas) {
        console.error('❌ Canvas id="texture-canvas" not found.');
        return;
    }
    console.log('✅ Canvas found:', canvas);

    var width = canvas.offsetWidth,
        height = canvas.offsetHeight;
    console.log('📐 Canvas dimensions:', width, 'x', height);

    console.log('🎮 Creating WebGPU renderer...');
    var renderer = new window.WebGPURenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 1);
    console.log('✅ WebGPU renderer created successfully');

    var scene = new window.THREE.Scene();
    var camera = new window.THREE.PerspectiveCamera(50, width / height, 0.1, 2000);
    camera.position.set(0, 0, 80);
    console.log('✅ Scene and camera created');

    var ambientLight = new window.THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    var directionalLight = new window.THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);
    console.log('✅ Lights added to scene');

    // Start a render loop for crisp particles
    renderer.setAnimationLoop(function() {
        renderer.render(scene, camera);
    });
    console.log('🔄 Animation loop started');

        var loader = new window.GLTFLoader();
    var dnaUrl = 'https://cdn.jsdelivr.net/gh/23cubed/trx-cap@bfce75cfaf510a177a553bf3f44ed850367417aa/src/assets/DNA.gltf';
    console.log('📦 Loading GLTF from:', dnaUrl);

    loader.load(
        dnaUrl,
        function (gltf) {
            console.log('✅ GLTF loaded successfully:', gltf);
            gltf.scene.updateMatrixWorld(true);
        
        // Find the first Mesh child
        console.log('🔍 Searching for mesh in GLTF scene...');
        var mesh = null;
        gltf.scene.traverse(function(child) {
            if (child.isMesh) {
                console.log('✅ Found mesh:', child);
                mesh = child;
            }
        });
        if (!mesh) {
            console.error('❌ No mesh found in GLTF scene');
            return;
        }
        
        // Scale the mesh geometry before sampling particles
        var meshScale = 20;
        mesh.geometry.scale(meshScale, meshScale, meshScale);
        console.log('📏 Scaled mesh by factor:', meshScale);
        
        // Optionally ensure normals are current for shading
        mesh.geometry.computeVertexNormals();
        
        // Setup sampler and sample points from DNA mesh
        var numParticles = 5000;
        var sampler = new window.MeshSurfaceSampler(mesh).build();
        console.log('🧬 Created mesh surface sampler');
        
        var points = [];
        var tempPosition = new window.THREE.Vector3();
        console.log('🎲 Sampling', numParticles, 'points from DNA mesh...');
        
        for (var i = 0; i < numParticles; i++) {
            sampler.sample(tempPosition);
            points.push(tempPosition.clone());
        }
        console.log('✅ Created points array with', points.length, 'points from mesh');
        
        // Use setFromPoints method like the working example
        console.log('🔧 Creating BufferGeometry from points...');
        var particleGeometry = new window.THREE.BufferGeometry().setFromPoints(points);
        console.log('✅ Particle geometry created:', particleGeometry);
        
        // Use regular PointsMaterial (working solution)
        console.log('🎨 Creating PointsMaterial...');
        var particleMaterial = new window.THREE.PointsMaterial({ 
            color: 0xffffff,
            size: 3,
            sizeAttenuation: false
        });
        console.log('✅ Particle material created:', particleMaterial);

        console.log('⭐ Creating Points system...');
        var particleSystem = new window.THREE.Points(particleGeometry, particleMaterial);
        console.log('✅ Particle system created:', particleSystem);
        
        // Center and position the particle system
        var box = new window.THREE.Box3().setFromObject(particleSystem);
        var center = box.getCenter(new window.THREE.Vector3());
        console.log('📍 Particle system center:', center);

        particleSystem.position.sub(center);
        particleSystem.rotation.x = Math.PI / 2;
        console.log('🔄 Positioned and rotated particle system');

        console.log('🎭 Adding particle system to scene...');
        scene.add(particleSystem);
        console.log('🎉 DNA particle system successfully added to scene!');
        },
        undefined,
        function (error) {
            console.error('❌ Error loading GLTF model:', error);
        }
    );
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initParticleField);
} else {
    initParticleField();
}