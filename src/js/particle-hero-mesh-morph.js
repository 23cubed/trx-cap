// Mesh configuration - single source of truth
var MESH_CONFIG = {
    TREX: { 
        x: 170, y: -10, z: 0,
        scale: 155,
        url: 'https://rawcdn.githack.com/23cubed/trx-cap/783fcee5b72e33115c125437ad8e7ebce94c485d/src/assets/t-rex-250k-uniform.glb'
    },
    DNA: { 
        x: 40, y: 0, z: 0,
        scale: 45,
        url: 'https://rawcdn.githack.com/23cubed/trx-cap/783fcee5b72e33115c125437ad8e7ebce94c485d/src/assets/DNA-20k-uniform.glb'
    }
};

// Repulsion effect configuration
var REPULSION_CONFIG = {
    screenRadius: 0.5,
    strength: 0.2,
    easeSpeed: 0.08
};

// Morph animation configuration
var MORPH_CONFIG = {
    duration: 2, // Duration to scrub from DNA to T-Rex (or vice versa)
    interruptionEase: "power1.inOut", // Smoother ease when interrupting existing animations
    maxInterruptionScale: 6, // Maximum scale factor for early interruptions
    dissolveDistance: 8 // Maximum distance particles randomly scatter during transition
};

// Rotation configuration
var ROTATION_CONFIG = {
    leftRotation: -80 * Math.PI / 180,   // -80 degrees (left edge)
    centerRotation: -15 * Math.PI / 180,   // -20 degrees (center)
    rightRotation: -8 * Math.PI / 180,   // -10 degrees (right edge)
    easeSpeed: 0.05
};

// Load T-Rex GLTF model and convert to particle system
function initTRex(scene, assetUrl) {
    return new Promise(function(resolve, reject) {
        var loader = new window.GLTFLoader();
        try { console.log('[ParticleMorph] initTRex: start', assetUrl); } catch (e) {}
        loader.load(
            assetUrl,
            function (gltf) {
                gltf.scene.updateMatrixWorld(true);
                var mesh = null;
                gltf.scene.traverse(function(child) {
                    if (child.isMesh) mesh = child;
                });
                if (!mesh) {
                    try { console.warn('[ParticleMorph] initTRex: no mesh found'); } catch (e) {}
                    resolve(null);
                    return;
                }
                mesh.geometry.scale(MESH_CONFIG.TREX.scale, MESH_CONFIG.TREX.scale, MESH_CONFIG.TREX.scale);
                mesh.geometry.rotateY(-Math.PI / 2);
                mesh.geometry.center();
                mesh.geometry.computeVertexNormals();

                var positionAttribute = mesh.geometry.getAttribute('position');
                var numParticles = positionAttribute.count;
                var positions = new Float32Array(numParticles * 3);
                var colors = new Float32Array(numParticles * 3);

                for (var i = 0; i < numParticles; i++) {
                    positions[3 * i]     = positionAttribute.getX(i);
                    positions[3 * i + 1] = positionAttribute.getY(i);
                    positions[3 * i + 2] = positionAttribute.getZ(i);
                    colors[3 * i]     = 1;
                    colors[3 * i + 1] = 1;
                    colors[3 * i + 2] = 1;
                }

                var particleGeometry = new window.THREE.BufferGeometry();
                particleGeometry.setAttribute('position', new window.THREE.Float32BufferAttribute(positions, 3));
                particleGeometry.setAttribute('color', new window.THREE.Float32BufferAttribute(colors, 3));

                var svg = '<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="15" fill="white"/></svg>';
                var texture = new window.THREE.TextureLoader().load('data:image/svg+xml;base64,' + btoa(svg));

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
                newParticleSystem.position.set(MESH_CONFIG.TREX.x, MESH_CONFIG.TREX.y, MESH_CONFIG.TREX.z);

                scene.add(newParticleSystem);
                try { console.log('[ParticleMorph] initTRex: created Points with', numParticles, 'particles'); } catch (e) {}
                resolve(newParticleSystem);
            },
            function () {},
            function (error) {
                try { console.error('[ParticleMorph] initTRex: error', error); } catch (e) {}
                reject(error);
            }
        );
    });
}

// Load DNA helix GLTF model and convert to particle system
function initDNAHelix(scene, assetUrl) {
    return new Promise(function(resolve, reject) {
        var loader = new window.GLTFLoader();
        try { console.log('[ParticleMorph] initDNA: start', assetUrl); } catch (e) {}
        loader.load(
            assetUrl,
            function (gltf) {
                gltf.scene.updateMatrixWorld(true);
                var mesh = null;
                gltf.scene.traverse(function(child) {
                    if (child.isMesh) mesh = child;
                });
                if (!mesh) {
                    try { console.warn('[ParticleMorph] initDNA: no mesh found'); } catch (e) {}
                    resolve(null);
                    return;
                }
                mesh.geometry.scale(MESH_CONFIG.DNA.scale, MESH_CONFIG.DNA.scale, MESH_CONFIG.DNA.scale);
                mesh.geometry.center();
                mesh.geometry.computeVertexNormals();

                var positionAttribute = mesh.geometry.getAttribute('position');
                var numParticles = positionAttribute.count;
                var positions = new Float32Array(numParticles * 3);
                var colors = new Float32Array(numParticles * 3);

                for (var i = 0; i < numParticles; i++) {
                    positions[3 * i]     = positionAttribute.getX(i);
                    positions[3 * i + 1] = positionAttribute.getY(i);
                    positions[3 * i + 2] = positionAttribute.getZ(i);
                    colors[3 * i]     = 1;
                    colors[3 * i + 1] = 1;
                    colors[3 * i + 2] = 1;
                }

                var particleGeometry = new window.THREE.BufferGeometry();
                particleGeometry.setAttribute('position', new window.THREE.Float32BufferAttribute(positions, 3));
                particleGeometry.setAttribute('color', new window.THREE.Float32BufferAttribute(colors, 3));

                var svg = '<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="15" fill="white"/></svg>';
                var texture = new window.THREE.TextureLoader().load('data:image/svg+xml;base64,' + btoa(svg));

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
                newParticleSystem.position.set(MESH_CONFIG.DNA.x, MESH_CONFIG.DNA.y, MESH_CONFIG.DNA.z);

                try { console.log('[ParticleMorph] initDNA: created Points with', numParticles, 'particles'); } catch (e) {}
                resolve(newParticleSystem);
            },
            function () {},
            function (error) {
                try { console.error('[ParticleMorph] initDNA: error', error); } catch (e) {}
                reject(error);
            }
        );
    });
}

    // Main particle field setup and animation
var particleInitPromise = null;

function initParticleHeroMeshMorph() {
    if (particleInitPromise) {
        try { console.log('[ParticleMorph] initParticleHeroMeshMorph: using existing promise'); } catch (e) {}
        return particleInitPromise;
    }
    particleInitPromise = new Promise(function(resolve) {
        try { console.log('[ParticleMorph] initParticleHeroMeshMorph: begin'); } catch (e) {}
        var canvas = document.querySelector('#texture-canvas');
        if (!canvas) {
            try { console.warn('[ParticleMorph] initParticleHeroMeshMorph: #texture-canvas not found'); } catch (e) {}
            resolve(false);
            return;
        }

    var width = window.innerWidth,
        height = window.innerHeight;

    // Resolve asset URLs from config only
    var trexUrl = MESH_CONFIG.TREX.url;
    var dnaUrl = MESH_CONFIG.DNA.url;
    try { console.log('[ParticleMorph] Asset URLs', { trexUrl: trexUrl, dnaUrl: dnaUrl }); } catch (e) {}

    // Setup Three.js renderer and scene
    var renderer = new window.THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    try { console.log('[ParticleMorph] renderer initialized', { width: width, height: height, pixelRatio: window.devicePixelRatio }); } catch (e) {}

    var scene = new window.THREE.Scene();
    var camera = new window.THREE.PerspectiveCamera(50, width / height, 0.1, 2000);
    camera.position.set(0, 0, 80);
    try { console.log('[ParticleMorph] scene and camera ready'); } catch (e) {}

    // State variables
    var particleSystem = null;
    var tRexPositions = null;
    var dnaPositions = null;
    var dissolveDisplacements = null;
    var morphTimeline = null;
    var morphProgress = { value: 1 };
    var targetProgress = 1;
    var isShowingTRex = true;
    var morphTriggerCount = 0;
    var lastLogTime = 0;
    
    var mouse = new window.THREE.Vector2();
    var mouseWorldPos = new window.THREE.Vector3();
    var repulsionOffsets = null;
    
    var currentRotation = 0;
    var depthRange = 20;
    var minOpacity = 0.5;
    var maxOpacity = 0.5;

    // Generate random displacement vectors for dissolve effect
    function generateDissolveDisplacements(particleCount) {
        var displacements = new Float32Array(particleCount * 3);
        
        for (var i = 0; i < particleCount; i++) {
            var theta = Math.random() * 2 * Math.PI;
            var phi = Math.random() * Math.PI;
            var distance = Math.random() * MORPH_CONFIG.dissolveDistance;
            
            displacements[3 * i] = distance * Math.sin(phi) * Math.cos(theta);
            displacements[3 * i + 1] = distance * Math.sin(phi) * Math.sin(theta);
            displacements[3 * i + 2] = distance * Math.cos(phi);
        }
        
        return displacements;
    }

    // Update particle opacity based on depth
    function updateDepthBasedColors() {
        if (!particleSystem) return;
        
        var positionAttribute = particleSystem.geometry.getAttribute('position');
        var colorAttribute = particleSystem.geometry.getAttribute('color');
        
        var avgZ = 0;
        for (var i = 0; i < positionAttribute.count; i++) {
            avgZ += positionAttribute.getZ(i);
        }
        avgZ /= positionAttribute.count;
        
        var nearZ = avgZ + depthRange / 2;
        var farZ = avgZ - depthRange / 2;
        
        for (var i = 0; i < positionAttribute.count; i++) {
            var z = positionAttribute.getZ(i);
            var normalizedZ = Math.max(0, Math.min(1, (z - farZ) / (nearZ - farZ)));
            var opacity = minOpacity + (maxOpacity - minOpacity) * normalizedZ;
            colorAttribute.setXYZ(i, opacity, opacity, opacity);
        }
        
        colorAttribute.needsUpdate = true;
    }

    // Animation loop
    renderer.setAnimationLoop(function() {
        if (resizeRendererToDisplaySize(renderer)) {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
        }
        
        // Handle morphing between T-Rex and DNA with dissolve effect
        if (particleSystem && tRexPositions && dnaPositions && dissolveDisplacements) {
            var positionAttribute = particleSystem.geometry.getAttribute('position');
            var progress = morphProgress.value;
            var dissolveIntensity = Math.sin(progress * Math.PI);
            
            for (var i = 0; i < positionAttribute.count; i++) {
                var dnaX = dnaPositions[3 * i];
                var dnaY = dnaPositions[3 * i + 1];
                var dnaZ = dnaPositions[3 * i + 2];
                
                var tRexX = tRexPositions[3 * i];
                var tRexY = tRexPositions[3 * i + 1];
                var tRexZ = tRexPositions[3 * i + 2];
                
                var baseX = dnaX + (tRexX - dnaX) * progress;
                var baseY = dnaY + (tRexY - dnaY) * progress;
                var baseZ = dnaZ + (tRexZ - dnaZ) * progress;
                
                var displaceX = dissolveDisplacements[3 * i] * dissolveIntensity;
                var displaceY = dissolveDisplacements[3 * i + 1] * dissolveIntensity;
                var displaceZ = dissolveDisplacements[3 * i + 2] * dissolveIntensity;
                
                positionAttribute.setXYZ(i,
                    baseX + displaceX,
                    baseY + displaceY,
                    baseZ + displaceZ
                );
            }
            positionAttribute.needsUpdate = true;
            
            var dnaWorldPos = new window.THREE.Vector3(MESH_CONFIG.DNA.x, MESH_CONFIG.DNA.y, MESH_CONFIG.DNA.z);
            var tRexWorldPos = new window.THREE.Vector3(MESH_CONFIG.TREX.x, MESH_CONFIG.TREX.y, MESH_CONFIG.TREX.z);
            particleSystem.position.lerpVectors(dnaWorldPos, tRexWorldPos, progress);
            
            updateDepthBasedColors();
        }
        

        
        // Apply mouse repulsion effect
        if (particleSystem && tRexPositions && dnaPositions && dissolveDisplacements) {
            if (!repulsionOffsets) {
                repulsionOffsets = new Float32Array(tRexPositions.length);
            }
            
            var positionAttribute = particleSystem.geometry.getAttribute('position');
            var progress = morphProgress.value;
            var dissolveIntensity = Math.sin(progress * Math.PI);
            
            for (var i = 0; i < positionAttribute.count; i++) {
                var dnaX = dnaPositions[3 * i];
                var dnaY = dnaPositions[3 * i + 1];
                var dnaZ = dnaPositions[3 * i + 2];
                
                var tRexX = tRexPositions[3 * i];
                var tRexY = tRexPositions[3 * i + 1];
                var tRexZ = tRexPositions[3 * i + 2];
                
                var baseX = dnaX + (tRexX - dnaX) * progress + dissolveDisplacements[3 * i] * dissolveIntensity;
                var baseY = dnaY + (tRexY - dnaY) * progress + dissolveDisplacements[3 * i + 1] * dissolveIntensity;
                var baseZ = dnaZ + (tRexZ - dnaZ) * progress + dissolveDisplacements[3 * i + 2] * dissolveIntensity;
                
                var particleWorldPos = new window.THREE.Vector3(baseX, baseY, baseZ);
                particleWorldPos.applyMatrix4(particleSystem.matrixWorld);
                var particleScreenPos = particleWorldPos.project(camera);
                
                var screenDx = particleScreenPos.x - mouse.x;
                var screenDy = particleScreenPos.y - mouse.y;
                var screenDistance = Math.sqrt(screenDx * screenDx + screenDy * screenDy);
                
                var targetOffsetX = 0;
                var targetOffsetY = 0;
                
                if (screenDistance < REPULSION_CONFIG.screenRadius) {
                    var influence = Math.pow(1 - screenDistance / REPULSION_CONFIG.screenRadius, 2);
                    var repulsionForce = influence * REPULSION_CONFIG.strength;
                    
                    var normalizedDx, normalizedDy;
                    
                    if (screenDistance < 0.001) {
                        var angle = Math.atan2(particleScreenPos.y, particleScreenPos.x) + (Math.random() - 0.5) * 0.5;
                        normalizedDx = Math.cos(angle);
                        normalizedDy = Math.sin(angle);
                        repulsionForce = REPULSION_CONFIG.strength * 2;
                    } else {
                        normalizedDx = screenDx / screenDistance;
                        normalizedDy = screenDy / screenDistance;
                    }
                    
                    targetOffsetX = normalizedDx * repulsionForce * 5;
                    targetOffsetY = normalizedDy * repulsionForce * 5;
                }
                
                repulsionOffsets[3 * i] += (targetOffsetX - repulsionOffsets[3 * i]) * REPULSION_CONFIG.easeSpeed;
                repulsionOffsets[3 * i + 1] += (targetOffsetY - repulsionOffsets[3 * i + 1]) * REPULSION_CONFIG.easeSpeed;
                
                var finalX = baseX + repulsionOffsets[3 * i];
                var finalY = baseY + repulsionOffsets[3 * i + 1];
                
                positionAttribute.setXYZ(i, finalX, finalY, baseZ);
            }
            positionAttribute.needsUpdate = true;
            updateDepthBasedColors();
        }
        
        // Smooth rotation based on mouse position
        if (particleSystem) {
            var targetRotation;
            
            if (mouse.x < 0) {
                var t = (mouse.x + 1) / 1;
                targetRotation = ROTATION_CONFIG.leftRotation + (ROTATION_CONFIG.centerRotation - ROTATION_CONFIG.leftRotation) * t;
            } else {
                var t = mouse.x / 1;
                targetRotation = ROTATION_CONFIG.centerRotation + (ROTATION_CONFIG.rightRotation - ROTATION_CONFIG.centerRotation) * t;
            }
            
            currentRotation += (targetRotation - currentRotation) * ROTATION_CONFIG.easeSpeed;
            particleSystem.rotation.y = currentRotation;
        }
        
        renderer.render(scene, camera);
    });

    // Setup lighting
    var ambientLight = new window.THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    var directionalLight = new window.THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);

    // Initialize the morph timeline
    function initMorphTimeline() {
        if (morphTimeline) return;
        
        morphTimeline = window.gsap.timeline({ paused: true });
        morphTimeline.addLabel("DNA", 0);
        morphTimeline.addLabel("TREX", MORPH_CONFIG.duration);
    }
    
    // Smoothly tween to target progress
    function morphToProgress(targetValue) {
        if (!tRexPositions || !dnaPositions || !dissolveDisplacements) return;
        
        var existingTweens = window.gsap.getTweensOf(morphProgress);
        var isInterruption = existingTweens.length > 0;
        var interruptionProgress = 0;
        var scaleFactor = 1.0;
        
        var currentProgress = morphProgress.value;
        var distance = Math.abs(targetValue - currentProgress);
        var baseDuration = distance * MORPH_CONFIG.duration;
        
        if (isInterruption && existingTweens.length > 0) {
            var currentTween = existingTweens[0];
            interruptionProgress = currentTween.progress();
            
            if (distance >= 0.6) {
                scaleFactor = 1.0;
            } else if (distance > 0.01) {
                var normalizedDistance = distance / 0.6;
                scaleFactor = 1 + (MORPH_CONFIG.maxInterruptionScale - 1) / (10 * normalizedDistance + 0.1);
                scaleFactor = Math.min(scaleFactor, MORPH_CONFIG.maxInterruptionScale);
            } else {
                scaleFactor = MORPH_CONFIG.maxInterruptionScale;
            }
        }
        
        if (isInterruption) {
            window.gsap.killTweensOf(morphProgress);
        }
        
        var duration = baseDuration * scaleFactor;
        var easeType = isInterruption ? MORPH_CONFIG.interruptionEase : "power3.inOut";
        
        window.gsap.to(morphProgress, {
            value: targetValue,
            duration: duration,
            ease: easeType
        });
    }

    // Mouse position tracking and morph triggering
    function updateMousePosition(event) {
        var rect = canvas.getBoundingClientRect();
        
        var prevMouseX = mouse.x;
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        var vector = new window.THREE.Vector3(mouse.x, mouse.y, 0);
        vector.unproject(camera);
        
        var dir = vector.sub(camera.position).normalize();
        var distance = -camera.position.z / dir.z;
        mouseWorldPos.copy(camera.position).add(dir.multiplyScalar(distance));
        
        var actuallyShowingTRex = morphProgress.value > 0.5;
        var desiredTarget = mouse.x < 0 ? 0 : 1;
        
        if (desiredTarget !== targetProgress && tRexPositions && dnaPositions && dissolveDisplacements) {
            var oldTarget = targetProgress;
            var currentProgress = morphProgress.value;
            targetProgress = desiredTarget;
            morphTriggerCount++;
            
            var existingTweens = window.gsap.getTweensOf(morphProgress);
            var isInterruption = existingTweens.length > 0;
            var scaleFactor = 1.0;
            var distance = Math.abs(targetProgress - currentProgress);
            
            if (isInterruption) {
                scaleFactor = 1 + (MORPH_CONFIG.maxInterruptionScale - 1) / (17.5 * distance + 1);
            }
            
            var currentTargetProgress, newTargetRemaining;
            
            if (oldTarget === 0) {
                currentTargetProgress = 1 - currentProgress;
            } else {
                currentTargetProgress = currentProgress;
            }
            
            if (targetProgress === 0) {
                newTargetRemaining = currentProgress;
            } else {
                newTargetRemaining = 1 - currentProgress;
            }
            
            morphToProgress(targetProgress);
        }
        
        isShowingTRex = actuallyShowingTRex;
    }
    
    function resizeRendererToDisplaySize(renderer) {
        var canvas = renderer.domElement;
        var width = window.innerWidth;
        var height = window.innerHeight;
        var needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
            renderer.setSize(width, height);
        }
        return needResize;
    }
    
    function handleWindowResize() {
        if (resizeRendererToDisplaySize(renderer)) {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
        }
    }
    
    window.addEventListener('mousemove', updateMousePosition);
    window.addEventListener('resize', handleWindowResize);

        initTRex(scene, trexUrl)
            .then(function(ps) {
                if (!ps) {
                    try { console.warn('[ParticleMorph] TRex init returned null'); } catch (e) {}
                    resolve(false);
                    return null;
                }
                var positionAttribute = ps.geometry.getAttribute('position');
                tRexPositions = new Float32Array(positionAttribute.array);
                repulsionOffsets = new Float32Array(positionAttribute.array.length);
                particleSystem = ps;
                updateDepthBasedColors();
                try { console.log('[ParticleMorph] TRex ready, particle count', positionAttribute.count); } catch (e) {}
                return initDNAHelix(scene, dnaUrl);
            })
            .then(function(dnaPs) {
                if (!dnaPs) {
                    try { console.warn('[ParticleMorph] DNA init returned null'); } catch (e) {}
                    resolve(false);
                    return;
                }
                var dnaPositionAttribute = dnaPs.geometry.getAttribute('position');
                var tRexParticleCount = tRexPositions.length / 3;
                var dnaParticleCount = dnaPositionAttribute.count;
                dnaPositions = new Float32Array(tRexPositions.length);
                for (var i = 0; i < tRexParticleCount; i++) {
                    var dnaIndex = i % dnaParticleCount;
                    dnaPositions[3 * i] = dnaPositionAttribute.getX(dnaIndex);
                    dnaPositions[3 * i + 1] = dnaPositionAttribute.getY(dnaIndex);
                    dnaPositions[3 * i + 2] = dnaPositionAttribute.getZ(dnaIndex);
                }
                dissolveDisplacements = generateDissolveDisplacements(tRexParticleCount);
                initMorphTimeline();
                try { console.log('[ParticleMorph] DNA mapped to TRex particle count', tRexParticleCount); } catch (e) {}
                try { console.log('[ParticleMorph] resolve ready'); } catch (e) {}
                resolve(true);
            })
            .catch(function(err) {
                try { console.error('[ParticleMorph] init error', err); } catch (e) {}
                resolve(false);
            });
    });
    return particleInitPromise;
}

export { initParticleHeroMeshMorph };