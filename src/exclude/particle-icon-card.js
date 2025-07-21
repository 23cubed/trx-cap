function initParticleIconCard(meshUrl, iconCardId, particleColor, maxParticles, useMeshSample) {
    var iconCard = document.getElementById(iconCardId);
    if (!iconCard) {
        return;
    }

    var canvas = iconCard.querySelector('.icon-card-icon-canvas');
    if (!canvas) {
        return;
    }

    var width = canvas.offsetWidth,
        height = canvas.offsetHeight;

    var renderer = new window.THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    
    canvas.style.backgroundColor = 'transparent';

    var scene = new window.THREE.Scene();
    var camera = new window.THREE.PerspectiveCamera(50, width / height, 0.1, 2000);
    camera.position.set(0, 0, 80);

    var particleSystem = null;
    var mouse = new window.THREE.Vector2();
    var mouseWorldPos = new window.THREE.Vector3();
    var repulsionRadius = 10;
    var repulsionStrength = 2;
    var repulsionOffsets = null;
    var basePositions = null;
    
    // Rotation smoothing variables
    var currentRotation = 0;
    var targetRotation = 0;
    var rotationEaseSpeed = 0.05;
    var isMouseOverCanvas = false;



    function loadMeshAndCreateParticles() {
        if (!window.THREE || !window.GLTFLoader) {
            return;
        }
        
        var loader = new window.GLTFLoader();
        
        loader.load(
            meshUrl,
            function (gltf) {
                var mesh = null;
                gltf.scene.traverse(function(child) {
                    if (child.isMesh) {
                        mesh = child;
                    }
                });
                
                if (!mesh) {
                    return;
                }

                var meshScale = 120;
                mesh.geometry.scale(meshScale, meshScale, meshScale);
                
                mesh.geometry.computeVertexNormals();

                var positionAttribute = mesh.geometry.getAttribute('position');
                var totalVertices = positionAttribute.count;
                
                var numParticles = Math.min(maxParticles, totalVertices);
                var positions = new Float32Array(numParticles * 3);
                var colors = new Float32Array(numParticles * 3);
                
                if (useMeshSample) {
                    for (var i = 0; i < numParticles; i++) {
                        var randomIndex = Math.floor(Math.random() * totalVertices);
                        positions[3 * i] = positionAttribute.getX(randomIndex);
                        positions[3 * i + 1] = positionAttribute.getY(randomIndex);
                        positions[3 * i + 2] = positionAttribute.getZ(randomIndex);
                        
                        colors[3 * i] = particleColor.r;
                        colors[3 * i + 1] = particleColor.g;
                        colors[3 * i + 2] = particleColor.b;
                    }
                } else {
                    var step = Math.floor(totalVertices / numParticles);
                    for (var i = 0; i < numParticles; i++) {
                        var vertexIndex = i * step;
                        positions[3 * i] = positionAttribute.getX(vertexIndex);
                        positions[3 * i + 1] = positionAttribute.getY(vertexIndex);
                        positions[3 * i + 2] = positionAttribute.getZ(vertexIndex);
                        
                        colors[3 * i] = particleColor.r;
                        colors[3 * i + 1] = particleColor.g;
                        colors[3 * i + 2] = particleColor.b;
                    }
                }

                var centerX = 0, centerY = 0, centerZ = 0;
                for (var i = 0; i < numParticles; i++) {
                    centerX += positions[3 * i];
                    centerY += positions[3 * i + 1];
                    centerZ += positions[3 * i + 2];
                }
                centerX /= numParticles;
                centerY /= numParticles;
                centerZ /= numParticles;

                var minX = Infinity, maxX = -Infinity;
                var minY = Infinity, maxY = -Infinity;
                
                for (var i = 0; i < numParticles; i++) {
                    var x = positions[3 * i] - centerX;
                    var y = positions[3 * i + 1] - centerY;
                    var z = positions[3 * i + 2] - centerZ;
                    
                    minX = Math.min(minX, x);
                    maxX = Math.max(maxX, x);
                    minY = Math.min(minY, y);
                    maxY = Math.max(maxY, y);
                    
                    positions[3 * i] = x;
                    positions[3 * i + 1] = y;
                    positions[3 * i + 2] = z;
                }

                var meshWidth = maxX - minX;
                var meshHeight = maxY - minY;
                
                var canvasAspect = width / height;
                var meshAspect = meshWidth / meshHeight;
                
                var fov = 50 * Math.PI / 180;
                var distance = 80;
                var worldHeight = 2 * Math.tan(fov / 2) * distance;
                var worldWidth = worldHeight * canvasAspect;
                
                var scaleX = worldWidth / meshWidth;
                var scaleY = worldHeight / meshHeight;
                var baseScale = Math.min(scaleX, scaleY);
                
                // Add safety factor for ±15 degree rotation
                // cos(15°) ≈ 0.966, so we need additional margin
                var rotationSafetyFactor = 0.85;
                var scale = baseScale * rotationSafetyFactor;
                
                for (var i = 0; i < numParticles; i++) {
                    positions[3 * i] *= scale;
                    positions[3 * i + 1] *= scale;
                    positions[3 * i + 2] *= scale;
                }

                basePositions = new Float32Array(positions);
                repulsionOffsets = new Float32Array(positions.length);

                var particleGeometry = new window.THREE.BufferGeometry();
                particleGeometry.setAttribute('position', new window.THREE.Float32BufferAttribute(positions, 3));
                particleGeometry.setAttribute('color', new window.THREE.Float32BufferAttribute(colors, 3));

                var svg = '<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="15" fill="white"/></svg>';
                var texture = new window.THREE.TextureLoader().load('data:image/svg+xml;base64,' + btoa(svg));

                var particleMaterial = new window.THREE.PointsMaterial({
                    size: 1,
                    sizeAttenuation: false,
                    vertexColors: true,
                    map: texture,
                    transparent: true,
                    blending: window.THREE.NormalBlending,
                    depthWrite: false
                });

                particleSystem = new window.THREE.Points(particleGeometry, particleMaterial);
                scene.add(particleSystem);

                gltf.scene.traverse(function(child) {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(function(material) { material.dispose(); });
                        } else {
                            child.material.dispose();
                        }
                    }
                });

                startRenderLoop();
            },
            function(progress) {
            },
            function (error) {
            }
        );
    }

    function updateMousePosition(event) {
        isMouseOverCanvas = true;
        
        var rect = canvas.getBoundingClientRect();
        
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        var vector = new window.THREE.Vector3(mouse.x, mouse.y, 0);
        vector.unproject(camera);
        
        var dir = vector.sub(camera.position).normalize();
        var distance = -camera.position.z / dir.z;
        mouseWorldPos.copy(camera.position).add(dir.multiplyScalar(distance));
        
        // Calculate target rotation based on mouse position
        // Left side (-1) = -15 degrees, Right side (+1) = +15 degrees
        var leftRotation = -15 * Math.PI / 180; // -15 degrees in radians
        var rightRotation = 15 * Math.PI / 180; // +15 degrees in radians
        
        // Interpolate between rotations based on mouse.x (-1 to +1)
        // Convert mouse.x from [-1, 1] to [0, 1] for interpolation
        var t = (mouse.x + 1) / 2;
        targetRotation = leftRotation + (rightRotation - leftRotation) * t;
    }
    
    function resetRotation() {
        isMouseOverCanvas = false;
        targetRotation = 0;
    }

    function startRenderLoop() {
        var frameCount = 0;
        renderer.setAnimationLoop(function() {
            frameCount++;
            
            if (particleSystem && basePositions) {
                var positionAttribute = particleSystem.geometry.getAttribute('position');
                var easeSpeed = 0.08;
                
                for (var i = 0; i < positionAttribute.count; i++) {
                    var baseX = basePositions[3 * i];
                    var baseY = basePositions[3 * i + 1];
                    var baseZ = basePositions[3 * i + 2];
                    
                    var targetOffsetX = 0;
                    var targetOffsetY = 0;
                    
                    if (isMouseOverCanvas) {
                        var dx = baseX - mouseWorldPos.x;
                        var dy = baseY - mouseWorldPos.y;
                        var distance = Math.sqrt(dx * dx + dy * dy);
                        
                        if (distance < repulsionRadius && distance > 0.1) {
                            var influence = Math.pow(1 - distance / repulsionRadius, 2);
                            var repulsionForce = influence * repulsionStrength;
                            var normalizedDx = dx / distance;
                            var normalizedDy = dy / distance;
                            
                            targetOffsetX = normalizedDx * repulsionForce;
                            targetOffsetY = normalizedDy * repulsionForce;
                        }
                    }
                    
                    repulsionOffsets[3 * i] += (targetOffsetX - repulsionOffsets[3 * i]) * easeSpeed;
                    repulsionOffsets[3 * i + 1] += (targetOffsetY - repulsionOffsets[3 * i + 1]) * easeSpeed;
                    
                    var finalX = baseX + repulsionOffsets[3 * i];
                    var finalY = baseY + repulsionOffsets[3 * i + 1];
                    
                                    positionAttribute.setXYZ(i, finalX, finalY, baseZ);
            }
            positionAttribute.needsUpdate = true;
        }
        
        if (particleSystem) {
            // Smoothly interpolate current rotation toward target rotation
            currentRotation += (targetRotation - currentRotation) * rotationEaseSpeed;
            particleSystem.rotation.y = currentRotation;
        }
        
        renderer.clear();
        renderer.render(scene, camera);
        });
    }

    canvas.addEventListener('mousemove', updateMousePosition);
    canvas.addEventListener('mouseleave', resetRotation);

    var ambientLight = new window.THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    var directionalLight = new window.THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);

    loadMeshAndCreateParticles();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        initParticleIconCard(
            'https://cdn.jsdelivr.net/gh/23cubed/trx-cap@97179b960bea711960734281ef5832a603e19a97/src/assets/Fingerprint.glb',
            'icon-card-healthcare-tech',
            { r: 0.451, g: 0.451, b: 0.451 },
            3000,
            false
        );
    });
} else {
    initParticleIconCard(
        'https://cdn.jsdelivr.net/gh/23cubed/trx-cap@97179b960bea711960734281ef5832a603e19a97/src/assets/Fingerprint.glb',
        'icon-card-healthcare-tech',
        { r: 0.451, g: 0.451, b: 0.451 },
        3000,
        false
    );
}
