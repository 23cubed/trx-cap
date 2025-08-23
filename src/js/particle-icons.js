// Cache a reusable particle sprite texture
var __ICON_PARTICLE_TEXTURE = null;
function getIconParticleTexture() {
    if (!__ICON_PARTICLE_TEXTURE) {
        var svg = '<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="15" fill="white"/></svg>';
        __ICON_PARTICLE_TEXTURE = new window.THREE.TextureLoader().load('data:image/svg+xml;base64,' + btoa(svg));
    }
    return __ICON_PARTICLE_TEXTURE;
}

function calculateMeshSurfaceArea(geometry) {
    var positionAttribute = geometry.getAttribute('position');
    var indexAttribute = geometry.getIndex();
    var totalArea = 0;
    
    var triangle = new window.THREE.Triangle();
    var v1 = new window.THREE.Vector3();
    var v2 = new window.THREE.Vector3();
    var v3 = new window.THREE.Vector3();
    var v4 = new window.THREE.Vector3();
    
    if (indexAttribute) {
        // Indexed geometry - check if it's quads or triangles
        var faceSize = indexAttribute.count % 4 === 0 ? 4 : 3;
        
        if (faceSize === 4) {
            // Quad mesh - split each quad into two triangles
            for (var i = 0; i < indexAttribute.count; i += 4) {
                var a = indexAttribute.getX(i);
                var b = indexAttribute.getX(i + 1);
                var c = indexAttribute.getX(i + 2);
                var d = indexAttribute.getX(i + 3);
                
                v1.fromBufferAttribute(positionAttribute, a);
                v2.fromBufferAttribute(positionAttribute, b);
                v3.fromBufferAttribute(positionAttribute, c);
                v4.fromBufferAttribute(positionAttribute, d);
                
                // First triangle: A-B-C
                triangle.set(v1, v2, v3);
                totalArea += triangle.getArea();
                
                // Second triangle: A-C-D
                triangle.set(v1, v3, v4);
                totalArea += triangle.getArea();
            }
        } else {
            // Triangle mesh
            for (var i = 0; i < indexAttribute.count; i += 3) {
                var a = indexAttribute.getX(i);
                var b = indexAttribute.getX(i + 1);
                var c = indexAttribute.getX(i + 2);
                
                v1.fromBufferAttribute(positionAttribute, a);
                v2.fromBufferAttribute(positionAttribute, b);
                v3.fromBufferAttribute(positionAttribute, c);
                
                triangle.set(v1, v2, v3);
                totalArea += triangle.getArea();
            }
        }
    } else {
        // Non-indexed geometry - check if it's quads or triangles
        var faceSize = positionAttribute.count % 4 === 0 ? 4 : 3;
        
        if (faceSize === 4) {
            // Quad mesh - split each quad into two triangles
            for (var i = 0; i < positionAttribute.count; i += 4) {
                v1.fromBufferAttribute(positionAttribute, i);
                v2.fromBufferAttribute(positionAttribute, i + 1);
                v3.fromBufferAttribute(positionAttribute, i + 2);
                v4.fromBufferAttribute(positionAttribute, i + 3);
                
                // First triangle: 0-1-2
                triangle.set(v1, v2, v3);
                totalArea += triangle.getArea();
                
                // Second triangle: 0-2-3
                triangle.set(v1, v3, v4);
                totalArea += triangle.getArea();
            }
        } else {
            // Triangle mesh
            for (var i = 0; i < positionAttribute.count; i += 3) {
                v1.fromBufferAttribute(positionAttribute, i);
                v2.fromBufferAttribute(positionAttribute, i + 1);
                v3.fromBufferAttribute(positionAttribute, i + 2);
                
                triangle.set(v1, v2, v3);
                totalArea += triangle.getArea();
            }
        }
    }
    
    return totalArea;
}

function initParticleIcon(canvasId, particleColor, maxParticles, useMeshSample) {
    var canvas = document.getElementById(canvasId);
    if (!canvas) {
        return Promise.resolve(false);
    }

    var meshUrl = canvas.getAttribute('data-mesh-url');
    if (!meshUrl) {
        return Promise.resolve(false);
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
    var repulsionRadius = 15;
    var repulsionStrength = 4;
    var repulsionOffsets = null;
    var basePositions = null;
    
    // Rotation smoothing variables
    var currentRotation = 0;
    var targetRotation = 0;
    var rotationEaseSpeed = 0.05;
    var isMouseOverCanvas = false;



    function loadMeshAndCreateParticles() {
        if (!window.THREE || !window.GLTFLoader) {
            return Promise.resolve(false);
        }
        
        return new Promise(function(resolve) {
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
                        resolve(false);
                        return;
                    }

                var meshScale = 120;
                mesh.geometry.scale(meshScale, meshScale, meshScale);
                
                mesh.geometry.computeVertexNormals();

                // Calculate and log surface area
                var originalVertexCount = mesh.geometry.getAttribute('position').count;
                var surfaceArea = calculateMeshSurfaceArea(mesh.geometry);
                console.log('Mesh "' + meshUrl + '" - Original vertices:', originalVertexCount, ', Surface area:', surfaceArea);

                var positionAttribute = mesh.geometry.getAttribute('position');
                var totalVertices = positionAttribute.count;
                
                var numParticles = maxParticles === null ? totalVertices : Math.min(maxParticles, totalVertices);
                var positions = new Float32Array(numParticles * 3);
                var colors = new Float32Array(numParticles * 3);
                
                if (useMeshSample) {
                    // Use proper mesh surface sampling
                    var sampler = new window.MeshSurfaceSampler(mesh).build();
                    var tempPosition = new window.THREE.Vector3();
                    for (var i = 0; i < numParticles; i++) {
                        sampler.sample(tempPosition);
                        positions[3 * i] = tempPosition.x;
                        positions[3 * i + 1] = tempPosition.y;
                        positions[3 * i + 2] = tempPosition.z;
                        
                        colors[3 * i] = particleColor.r;
                        colors[3 * i + 1] = particleColor.g;
                        colors[3 * i + 2] = particleColor.b;
                    }
                } else {
                    // Use every vertex sequentially - one particle per vertex
                    for (var i = 0; i < numParticles; i++) {
                        positions[3 * i] = positionAttribute.getX(i);
                        positions[3 * i + 1] = positionAttribute.getY(i);
                        positions[3 * i + 2] = positionAttribute.getZ(i);
                        
                        colors[3 * i] = particleColor.r;
                        colors[3 * i + 1] = particleColor.g;
                        colors[3 * i + 2] = particleColor.b;
                    }
                }

                // Calculate center of mass
                var centerX = 0, centerY = 0, centerZ = 0;
                for (var i = 0; i < numParticles; i++) {
                    centerX += positions[3 * i];
                    centerY += positions[3 * i + 1];
                    centerZ += positions[3 * i + 2];
                }
                centerX /= numParticles;
                centerY /= numParticles;
                centerZ /= numParticles;

                // Center all positions around origin
                for (var i = 0; i < numParticles; i++) {
                    positions[3 * i] -= centerX;
                    positions[3 * i + 1] -= centerY;
                    positions[3 * i + 2] -= centerZ;
                }

                // Calculate bounding box of centered mesh
                var minX = Infinity, maxX = -Infinity;
                var minY = Infinity, maxY = -Infinity;
                
                for (var i = 0; i < numParticles; i++) {
                    var x = positions[3 * i];
                    var y = positions[3 * i + 1];
                    
                    minX = Math.min(minX, x);
                    maxX = Math.max(maxX, x);
                    minY = Math.min(minY, y);
                    maxY = Math.max(maxY, y);
                }

                var meshWidth = maxX - minX;
                var meshHeight = maxY - minY;
                
                // Calculate visible world dimensions at z=0
                var fov = 50 * Math.PI / 180;
                var distance = 80;
                var worldHeight = 2 * Math.tan(fov / 2) * distance;
                var worldWidth = worldHeight * (width / height);
                
                // Add margins and safety factor for rotation
                var margin = 0.85; // 15% margin
                var availableWidth = worldWidth * margin;
                var availableHeight = worldHeight * margin;
                
                // Calculate scale to fit within available space
                var scaleX = availableWidth / meshWidth;
                var scaleY = availableHeight / meshHeight;
                var scale = Math.min(scaleX, scaleY);
                
                // Apply scaling
                for (var i = 0; i < numParticles; i++) {
                    positions[3 * i] *= scale;
                    positions[3 * i + 1] *= scale;
                    positions[3 * i + 2] *= scale;
                }
                
                // Recalculate bounds after scaling to ensure perfect centering
                var scaledMinX = Infinity, scaledMaxX = -Infinity;
                var scaledMinY = Infinity, scaledMaxY = -Infinity;
                
                for (var i = 0; i < numParticles; i++) {
                    scaledMinX = Math.min(scaledMinX, positions[3 * i]);
                    scaledMaxX = Math.max(scaledMaxX, positions[3 * i]);
                    scaledMinY = Math.min(scaledMinY, positions[3 * i + 1]);
                    scaledMaxY = Math.max(scaledMaxY, positions[3 * i + 1]);
                }
                
                // Center the scaled mesh within the viewport
                var scaledCenterX = (scaledMinX + scaledMaxX) / 2;
                var scaledCenterY = (scaledMinY + scaledMaxY) / 2;
                
                for (var i = 0; i < numParticles; i++) {
                    positions[3 * i] -= scaledCenterX;
                    positions[3 * i + 1] -= scaledCenterY;
                }

                basePositions = new Float32Array(positions);
                repulsionOffsets = new Float32Array(positions.length);

                var particleGeometry = new window.THREE.BufferGeometry();
                var posAttr = new window.THREE.Float32BufferAttribute(positions, 3);
                var colAttr = new window.THREE.Float32BufferAttribute(colors, 3);
                posAttr.setUsage(window.THREE.DynamicDrawUsage);
                colAttr.setUsage(window.THREE.DynamicDrawUsage);
                particleGeometry.setAttribute('position', posAttr);
                particleGeometry.setAttribute('color', colAttr);

                var particleMaterial = new window.THREE.PointsMaterial({
                    size: 0.7,
                    sizeAttenuation: false,
                    vertexColors: true,
                    map: getIconParticleTexture(),
                    transparent: true,
                    blending: window.THREE.NormalBlending,
                    depthWrite: false
                });

                particleSystem = new window.THREE.Points(particleGeometry, particleMaterial);
                particleSystem.frustumCulled = false;
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
                resolve(true);
            },
            function(progress) {
            },
            function (error) {
                resolve(false);
            }
        );
        });
    }

    var __tmpVec = new window.THREE.Vector3();
    function updateMousePosition(event) {
        isMouseOverCanvas = true;
        
        var rect = canvas.getBoundingClientRect();
        
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        var vector = __tmpVec.set(mouse.x, mouse.y, 0);
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
                var posArray = positionAttribute.array;
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
                        var distance = Math.hypot(dx, dy);
                        
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
                    var idx = 3 * i;
                    posArray[idx] = finalX;
                    posArray[idx + 1] = finalY;
                    posArray[idx + 2] = baseZ;
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

    return loadMeshAndCreateParticles();
}

export { initParticleIcon };
