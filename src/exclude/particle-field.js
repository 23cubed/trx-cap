// Position configuration - single source of truth
var MESH_POSITIONS = {
    TREX: { x: 60, y: -5, z: 0 },
    DNA: { x: 40, y: -40, z: 0 }
};

function initTRex(scene, setParticleSystem) {
    var loader = new window.GLTFLoader();
    var tRexUrl = 'https://cdn.jsdelivr.net/gh/23cubed/trx-cap@24ae1e4fd28d49513b02d608aebfad9b71e24b4e/src/assets/t-rex.glb';

    loader.load(
        tRexUrl,
        function (gltf) {
            gltf.scene.updateMatrixWorld(true);
        
            // Use vertex mapping instead of surface sampling for T-Rex
            // Find the first Mesh child
            var mesh = null;
            gltf.scene.traverse(function(child) {
                if (child.isMesh) mesh = child;
            });
            if (!mesh) return;
            
            // Scale the mesh geometry before extracting vertices
            var meshScale = 120;
            mesh.geometry.scale(meshScale, meshScale, meshScale);
            
            // Optionally ensure normals are current for shading
            mesh.geometry.computeVertexNormals();
            // Use vertex mapping - extract all vertices from the mesh
            var positionAttribute = mesh.geometry.getAttribute('position');
            var numParticles = positionAttribute.count;
            var positions = new Float32Array(numParticles * 3);
            var colors = new Float32Array(numParticles * 3);
            
            for (var i = 0; i < numParticles; i++) {
                positions[3 * i]     = positionAttribute.getX(i);
                positions[3 * i + 1] = positionAttribute.getY(i);
                positions[3 * i + 2] = positionAttribute.getZ(i);
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
            
            // Center all positions around origin and apply y-axis rotation (-90 degrees)
            for (var i = 0; i < numParticles; i++) {
                var x = positions[3 * i] - centerX;
                var y = positions[3 * i + 1] - centerY;
                var z = positions[3 * i + 2] - centerZ;
                
                // Apply +90 degree rotation around y-axis: (x, y, z) -> (-z, y, x)
                positions[3 * i] = -z;
                positions[3 * i + 1] = y;
                positions[3 * i + 2] = x;
            }
            


            var particleGeometry = new window.THREE.BufferGeometry();
            particleGeometry.setAttribute('position', new window.THREE.Float32BufferAttribute(positions, 3));
            particleGeometry.setAttribute('color', new window.THREE.Float32BufferAttribute(colors, 3));

            // Load crisp dot texture via SVG
            var svg = '<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="15" fill="white"/></svg>';
            var texture = new window.THREE.TextureLoader().load('data:image/svg+xml;base64,' + btoa(svg));

            // Create PointsMaterial with fixed screen size and vertex colors
            var particleMaterial = new window.THREE.PointsMaterial({
                size: 1.5,
                sizeAttenuation: false,
                vertexColors: true,
                map: texture,
                transparent: true,
                blending: window.THREE.AdditiveBlending,
                depthWrite: false
            });

            var newParticleSystem = new window.THREE.Points(particleGeometry, particleMaterial);
            newParticleSystem.position.set(MESH_POSITIONS.TREX.x, MESH_POSITIONS.TREX.y, MESH_POSITIONS.TREX.z);

            scene.add(newParticleSystem);
            setParticleSystem(newParticleSystem);
        },
        undefined,
        function (error) {
            console.error('Error loading GLTF model:', error);
        }
    );
}

function initDNAHelix(scene, setParticleSystem) {
    var loader = new window.GLTFLoader();
    var dnaUrl = 'https://cdn.jsdelivr.net/gh/23cubed/trx-cap@9d0d8d4d456323041e25cbfd5d329340e9c12059/src/assets/DNA-2.glb';

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
            var meshScale = 2;
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
           
        }

        var particleGeometry = new window.THREE.BufferGeometry();
        particleGeometry.setAttribute('position', new window.THREE.Float32BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new window.THREE.Float32BufferAttribute(colors, 3));

        // Load crisp dot texture via SVG
        var svg = '<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="15" fill="white"/></svg>';
        var texture = new window.THREE.TextureLoader().load('data:image/svg+xml;base64,' + btoa(svg));

        // Create PointsMaterial with fixed screen size and vertex colors
        var particleMaterial = new window.THREE.PointsMaterial({
            size: 3,
            sizeAttenuation: false,
            vertexColors: true,
            map: texture,
            transparent: true,
            blending: window.THREE.AdditiveBlending,
            depthWrite: false
        });

        var newParticleSystem = new window.THREE.Points(particleGeometry, particleMaterial);
        newParticleSystem.position.set(MESH_POSITIONS.DNA.x, MESH_POSITIONS.DNA.y, MESH_POSITIONS.DNA.z);

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
    renderer.setClearColor(0x004f2d, 1);

    // Store renderer reference for cleanup
    if (!window.activeRenderers) {
        window.activeRenderers = [];
    }
    window.activeRenderers.push({
        renderer: renderer,
        canvas: canvas,
        canvasId: 'texture-canvas'
    });

    var scene = new window.THREE.Scene();
    var camera = new window.THREE.PerspectiveCamera(50, width / height, 0.1, 2000);
    camera.position.set(0, 0, 80);

    var particleSystem = null;
    var tRexPositions = null;
    var dnaPositions = null;
    var currentPositions = null;
    var targetPositions = null;
    var isShowingTRex = true;
    var isMorphing = false;
    var morphProgress = 0;
    var morphDuration = 2000; // 2 seconds
    var morphStartTime = 0;
    var startPosition = new window.THREE.Vector3();
    var targetPosition = new window.THREE.Vector3();
    
    // Mouse repulsion variables
    var mouse = new window.THREE.Vector2();
    var mouseWorldPos = new window.THREE.Vector3();
    var repulsionRadius = 10;
    var repulsionStrength = 0.4;
    var repulsionOffsets = null; // Store current repulsion offsets for each particle
    
    // Rotation smoothing variables
    var currentRotation = 0;
    var rotationEaseSpeed = 0.05; // How fast rotation responds to mouse changes
    
    // Depth-based opacity settings
    var depthRange = 20; // Z-distance range for opacity falloff
    var minOpacity = 0.5; // Minimum opacity for furthest particles
    var maxOpacity = 0.5; // Maxiamum opacity for nearest particles

    function updateDepthBasedColors() {
        if (!particleSystem) return;
        
        var positionAttribute = particleSystem.geometry.getAttribute('position');
        var colorAttribute = particleSystem.geometry.getAttribute('color');
        
        // Find the center z-position of all particles
        var avgZ = 0;
        for (var i = 0; i < positionAttribute.count; i++) {
            avgZ += positionAttribute.getZ(i);
        }
        avgZ /= positionAttribute.count;
        
        // Use fixed depth range centered around particle positions
        var nearZ = avgZ + depthRange / 2;  // Closer to camera
        var farZ = avgZ - depthRange / 2;   // Further from camera
        
        // Update colors based on z-position
        for (var i = 0; i < positionAttribute.count; i++) {
            var z = positionAttribute.getZ(i);
            
            // Normalize z to 0-1 range based on fixed depth range
            // Closer to camera (higher z) = higher value
            var normalizedZ = Math.max(0, Math.min(1, (z - farZ) / (nearZ - farZ)));
            
            // Calculate opacity (closer particles are brighter)
            var opacity = minOpacity + (maxOpacity - minOpacity) * normalizedZ;
            
            // Apply opacity to RGB values (for additive blending, darker = more transparent)
            colorAttribute.setXYZ(i, opacity, opacity, opacity);
        }
        
        colorAttribute.needsUpdate = true;
    }

    // Start a render loop for crisp particles
    renderer.setAnimationLoop(function() {
        // Handle canvas resizing
        if (resizeRendererToDisplaySize(renderer)) {
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }
        if (particleSystem && isMorphing) {
            var elapsed = Date.now() - morphStartTime;
            morphProgress = Math.min(elapsed / morphDuration, 1);
            
            // Use easing function for smooth animation
            var easedProgress = 0.5 - 0.5 * Math.cos(morphProgress * Math.PI);
            
            // Animate particle positions
            var positionAttribute = particleSystem.geometry.getAttribute('position');
            for (var i = 0; i < positionAttribute.count; i++) {
                var startX = currentPositions[3 * i];
                var startY = currentPositions[3 * i + 1];
                var startZ = currentPositions[3 * i + 2];
                
                var endX = targetPositions[3 * i];
                var endY = targetPositions[3 * i + 1];
                var endZ = targetPositions[3 * i + 2];
                
                positionAttribute.setXYZ(i,
                    startX + (endX - startX) * easedProgress,
                    startY + (endY - startY) * easedProgress,
                    startZ + (endZ - startZ) * easedProgress
                );
            }
            positionAttribute.needsUpdate = true;
            
            // Animate particle system position
            particleSystem.position.lerpVectors(startPosition, targetPosition, easedProgress);
            
            if (morphProgress >= 1) {
                isMorphing = false;
                currentPositions = targetPositions;
                updateDepthBasedColors();
            }
        }
        
        // Apply smooth magnetic repulsion effect
        if (particleSystem && currentPositions) {
            if (!repulsionOffsets) {
                repulsionOffsets = new Float32Array(currentPositions.length);
            }
            
            var positionAttribute = particleSystem.geometry.getAttribute('position');
            var easeSpeed = 0.08; // How fast particles respond to repulsion
            
            // Transform mouse world position to particle system's local coordinate space
            // Account for both position and rotation
            var relativeMouseX = mouseWorldPos.x - particleSystem.position.x;
            var relativeMouseY = mouseWorldPos.y - particleSystem.position.y;
            
            // Apply inverse Y-axis rotation to get mouse position in particle system's local space
            // Y-axis rotation affects X and Z coordinates, but since we're working mostly in X-Y plane (Z≈0):
            var actualRotation = particleSystem.rotation.y;
            var cosRotation = Math.cos(-actualRotation);
            var sinRotation = Math.sin(-actualRotation);
            
            // For Y-axis rotation: newX = x*cos(θ) + z*sin(θ), but z≈0, so newX ≈ x*cos(θ)
            // Approximate inverse transformation (ignoring z): localX = worldX / cos(θ)
            var localMouseX = cosRotation !== 0 ? relativeMouseX / cosRotation : relativeMouseX;
            var localMouseY = relativeMouseY; // Y coordinate is unaffected by Y-axis rotation
            
            for (var i = 0; i < positionAttribute.count; i++) {
                // Get base position (current morph state without repulsion)
                var baseX, baseY, baseZ;
                if (isMorphing) {
                    // During morphing, calculate the pure morph position without repulsion
                    var startX = currentPositions[3 * i];
                    var startY = currentPositions[3 * i + 1];
                    var startZ = currentPositions[3 * i + 2];
                    
                    var endX = targetPositions[3 * i];
                    var endY = targetPositions[3 * i + 1];
                    var endZ = targetPositions[3 * i + 2];
                    
                    var elapsed = Date.now() - morphStartTime;
                    var progress = Math.min(elapsed / morphDuration, 1);
                    var easedProgress = 0.5 - 0.5 * Math.cos(progress * Math.PI);
                    
                    baseX = startX + (endX - startX) * easedProgress;
                    baseY = startY + (endY - startY) * easedProgress;
                    baseZ = startZ + (endZ - startZ) * easedProgress;
                } else {
                    // Use stored current positions
                    baseX = currentPositions[3 * i];
                    baseY = currentPositions[3 * i + 1];
                    baseZ = currentPositions[3 * i + 2];
                }
                
                // Calculate distance from particle to mouse (using local coordinate space)
                var dx = baseX - localMouseX;
                var dy = baseY - localMouseY;
                var distance = Math.sqrt(dx * dx + dy * dy);
                
                // Calculate target repulsion offset
                var targetOffsetX = 0;
                var targetOffsetY = 0;
                
                if (distance < repulsionRadius && distance > 0.1) {
                    // Smooth falloff with easing
                    var influence = Math.pow(1 - distance / repulsionRadius, 2);
                    var repulsionForce = influence * repulsionStrength;
                    var normalizedDx = dx / distance;
                    var normalizedDy = dy / distance;
                    
                    targetOffsetX = normalizedDx * repulsionForce;
                    targetOffsetY = normalizedDy * repulsionForce;
                }
                
                // Smoothly interpolate current offset toward target
                repulsionOffsets[3 * i] += (targetOffsetX - repulsionOffsets[3 * i]) * easeSpeed;
                repulsionOffsets[3 * i + 1] += (targetOffsetY - repulsionOffsets[3 * i + 1]) * easeSpeed;
                
                // Apply the smoothed offset to the base position
                var finalX = baseX + repulsionOffsets[3 * i];
                var finalY = baseY + repulsionOffsets[3 * i + 1];
                
                // Only update position if we're not currently morphing, or add offset to morph
                if (isMorphing) {
                    // During morphing, the morph animation handles base position, we just add offset
                    positionAttribute.setXYZ(i, finalX, finalY, baseZ);
                } else {
                    // When not morphing, set the final position with repulsion
                    positionAttribute.setXYZ(i, finalX, finalY, baseZ);
                }
            }
            positionAttribute.needsUpdate = true;
            
            // Update depth-based colors after position changes
            updateDepthBasedColors();
        }
        
        if (particleSystem) {
            // Smooth rotation based on mouse position
            // Left side (-1) = -30 degrees, Right side (+1) = +15 degrees
            var leftRotation = -30 * Math.PI / 180; // -30 degrees in radians
            var rightRotation = 15 * Math.PI / 180; // +15 degrees in radians
            
            // Interpolate between rotations based on mouse.x (-1 to +1)
            // Convert mouse.x from [-1, 1] to [0, 1] for interpolation
            var t = (mouse.x + 1) / 2;
            var targetRotation = leftRotation + (rightRotation - leftRotation) * t;
            
            // Smoothly interpolate current rotation toward target rotation
            currentRotation += (targetRotation - currentRotation) * rotationEaseSpeed;
            particleSystem.rotation.y = currentRotation;
        }
        renderer.render(scene, camera);
    });

    var ambientLight = new window.THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    var directionalLight = new window.THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);

    function morphToTarget(targetPos) {
        if (!particleSystem || !currentPositions || !targetPos) return;
        
        targetPositions = targetPos;
        isMorphing = true;
        morphProgress = 0;
        morphStartTime = Date.now();
    }



    // Mouse tracking for repulsion effect and morph triggering
    function updateMousePosition(event) {
        // Get canvas rectangle to properly map coordinates
        var rect = canvas.getBoundingClientRect();
        
        // Use canvas dimensions to match camera aspect ratio
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        // Convert screen coordinates to world coordinates at z=0 plane
        var vector = new window.THREE.Vector3(mouse.x, mouse.y, 0);
        vector.unproject(camera);
        
        // Since camera is at z=80 and particles are around z=0, project onto z=0 plane
        var dir = vector.sub(camera.position).normalize();
        var distance = -camera.position.z / dir.z;
        mouseWorldPos.copy(camera.position).add(dir.multiplyScalar(distance));
        
        // Trigger morph based on cursor position
        // Left side (mouse.x < 0) = DNA, Right side (mouse.x >= 0) = T-Rex
        if (mouse.x < 0 && isShowingTRex) {
            // Switch to DNA
            if (dnaPositions) {
                // If currently morphing, capture current morph positions as new start (without repulsion)
                if (isMorphing) {
                    var newCurrentPositions = new Float32Array(currentPositions.length);
                    
                    // Calculate pure morph positions without repulsion offsets
                    var elapsed = Date.now() - morphStartTime;
                    var progress = Math.min(elapsed / morphDuration, 1);
                    var easedProgress = 0.5 - 0.5 * Math.cos(progress * Math.PI);
                    
                    for (var j = 0; j < currentPositions.length / 3; j++) {
                        var startX = currentPositions[3 * j];
                        var startY = currentPositions[3 * j + 1];
                        var startZ = currentPositions[3 * j + 2];
                        
                        var endX = targetPositions[3 * j];
                        var endY = targetPositions[3 * j + 1];
                        var endZ = targetPositions[3 * j + 2];
                        
                        newCurrentPositions[3 * j] = startX + (endX - startX) * easedProgress;
                        newCurrentPositions[3 * j + 1] = startY + (endY - startY) * easedProgress;
                        newCurrentPositions[3 * j + 2] = startZ + (endZ - startZ) * easedProgress;
                    }
                    
                    currentPositions = newCurrentPositions;
                }
                startPosition.copy(particleSystem.position);
                targetPosition.set(MESH_POSITIONS.DNA.x, MESH_POSITIONS.DNA.y, MESH_POSITIONS.DNA.z);
                morphToTarget(dnaPositions);
                isShowingTRex = false;
            }
        } else if (mouse.x >= 0 && !isShowingTRex) {
            // Switch to T-Rex
            if (tRexPositions) {
                // If currently morphing, capture current positions as new start
                if (isMorphing) {
                    var positionAttribute = particleSystem.geometry.getAttribute('position');
                    currentPositions = new Float32Array(positionAttribute.array);
                }
                startPosition.copy(particleSystem.position);
                targetPosition.set(MESH_POSITIONS.TREX.x, MESH_POSITIONS.TREX.y, MESH_POSITIONS.TREX.z);
                morphToTarget(tRexPositions);
                isShowingTRex = true;
            }
        }
    }
    
    // Handle window resize using Three.js standard approach
    function resizeRendererToDisplaySize(renderer) {
        var canvas = renderer.domElement;
        var width = canvas.clientWidth;
        var height = canvas.clientHeight;
        var needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
            renderer.setSize(width, height, false);
        }
        return needResize;
    }
    
    // Add event listeners
    window.addEventListener('mousemove', updateMousePosition);

    // Initialize T-Rex and store positions
    initTRex(scene, function(ps) {
        var positionAttribute = ps.geometry.getAttribute('position');
        tRexPositions = new Float32Array(positionAttribute.array);
        currentPositions = new Float32Array(positionAttribute.array);
        repulsionOffsets = new Float32Array(positionAttribute.array.length);
        
        if (!particleSystem) {
            particleSystem = ps;
            scene.add(particleSystem);
            updateDepthBasedColors();
        }
    });
    
    // Initialize DNA and store positions
    initDNAHelix(scene, function(ps) {
        var positionAttribute = ps.geometry.getAttribute('position');
        
        // Ensure DNA has same number of particles as T-Rex
        if (tRexPositions) {
            var tRexParticleCount = tRexPositions.length / 3;
            var dnaParticleCount = positionAttribute.count;
            
            dnaPositions = new Float32Array(tRexPositions.length);
            
            // Map DNA positions to match T-Rex particle count
            for (var i = 0; i < tRexParticleCount; i++) {
                var dnaIndex = i % dnaParticleCount;
                dnaPositions[3 * i] = positionAttribute.getX(dnaIndex);
                dnaPositions[3 * i + 1] = positionAttribute.getY(dnaIndex);
                dnaPositions[3 * i + 2] = positionAttribute.getZ(dnaIndex);
            }
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initParticleField);
} else {
    initParticleField();
}