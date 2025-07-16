async function initParticleField() {
    var canvas = document.querySelector('#texture-canvas');
    if (!canvas) {
        console.error('Canvas id="texture-canvas" not found.');
        return;
    }

    var width = canvas.offsetWidth,
        height = canvas.offsetHeight;

    var renderer = new window.THREE.WebGPURenderer({ canvas: canvas, antialias: true, alpha: true });
    await renderer.init();
    renderer.setPixelRatio(window.devicePixelRatio > 1 ? 2 : 1);
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 1);

    var scene = new window.THREE.Scene();
    var camera = new window.THREE.PerspectiveCamera(50, width / height, 0.1, 2000);
    camera.position.set(0, 0, 80);

    var ambientLight = new window.THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    var directionalLight = new window.THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);

    function extractVerticesFromObject(object) {
        var vertices = [];
        
        object.traverse(function(child) {
            if (child.isMesh && child.geometry) {
                var geometry = child.geometry;
                var positionAttribute = geometry.attributes.position;
                
                if (positionAttribute) {
                    var matrix = child.matrixWorld;
                    var tempVertex = new window.THREE.Vector3();
                    
                    // Extract all vertices
                    for (var i = 0; i < positionAttribute.count; i++) {
                        tempVertex.fromBufferAttribute(positionAttribute, i);
                        tempVertex.applyMatrix4(matrix);
                        vertices.push(tempVertex.x, tempVertex.y, tempVertex.z);
                    }
                    
                    // Sample additional points from triangle faces to fill gaps
                    if (geometry.index) {
                        var indexAttribute = geometry.index;
                        var samplesPerTriangle = 8; // Number of random samples per triangle
                        
                        for (var i = 0; i < indexAttribute.count; i += 3) {
                            var a = indexAttribute.getX(i);
                            var b = indexAttribute.getX(i + 1);
                            var c = indexAttribute.getX(i + 2);
                            
                            var vertA = new window.THREE.Vector3().fromBufferAttribute(positionAttribute, a);
                            var vertB = new window.THREE.Vector3().fromBufferAttribute(positionAttribute, b);
                            var vertC = new window.THREE.Vector3().fromBufferAttribute(positionAttribute, c);
                            
                            // Apply world matrix
                            vertA.applyMatrix4(matrix);
                            vertB.applyMatrix4(matrix);
                            vertC.applyMatrix4(matrix);
                            
                            // Sample random points on triangle surface
                            for (var j = 0; j < samplesPerTriangle; j++) {
                                var r1 = Math.random();
                                var r2 = Math.random();
                                
                                // Ensure point is inside triangle
                                if (r1 + r2 > 1) {
                                    r1 = 1 - r1;
                                    r2 = 1 - r2;
                                }
                                
                                var sampledPoint = new window.THREE.Vector3();
                                sampledPoint.copy(vertA);
                                sampledPoint.multiplyScalar(1 - r1 - r2);
                                
                                var tempB = vertB.clone().multiplyScalar(r1);
                                var tempC = vertC.clone().multiplyScalar(r2);
                                
                                sampledPoint.add(tempB).add(tempC);
                                
                                vertices.push(sampledPoint.x, sampledPoint.y, sampledPoint.z);
                            }
                        }
                    }
                }
            }
        });
        
        return vertices;
    }

    var loader = new window.GLTFLoader();
    var dnaUrl = 'https://cdn.jsdelivr.net/gh/23cubed/trx-cap@bfce75cfaf510a177a553bf3f44ed850367417aa/src/assets/DNA.gltf';

    loader.load(
        dnaUrl,
        function (gltf) {
            gltf.scene.updateMatrixWorld(true);
            
            var vertices = extractVerticesFromObject(gltf.scene);
            
            var particleGeometry = new window.THREE.BufferGeometry();
            particleGeometry.setAttribute('position', new window.THREE.Float32BufferAttribute(vertices, 3));
            
            // crisp dot texture via SVG
            var svg = '<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="15" fill="white"/></svg>';
            var dotTexture = new window.THREE.TextureLoader().load(
                'data:image/svg+xml;base64,' + btoa(svg),
                function(texture) {
                    // Texture loaded successfully, create particle system
                    var particleMaterial = new window.THREE.PointsNodeMaterial({
                        color: 0x00ffff,
                        size: 0.2,
                        sizeAttenuation: true,
                        transparent: true,
                        opacity: 0.8,
                        blending: window.THREE.AdditiveBlending,
                        map: texture
                    });
                    
                    var particleSystem = new window.THREE.Points(particleGeometry, particleMaterial);
                    
                    var box = new window.THREE.Box3().setFromObject(particleSystem);
                    var center = box.getCenter(new window.THREE.Vector3());
                    
                    particleSystem.position.sub(center);
                    particleSystem.rotation.x = Math.PI / 2;
                    particleSystem.scale.setScalar(20);
                    
                    scene.add(particleSystem);
                    renderer.render(scene, camera);
                }
            );
        },
        undefined,
        function (error) {
            console.error('Error loading GLTF model:', error);
        }
    );
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initParticleField().catch(error => {
            console.error('Failed to initialize particle field:', error);
        });
    });
} else {
    initParticleField().catch(error => {
        console.error('Failed to initialize particle field:', error);
    });
}