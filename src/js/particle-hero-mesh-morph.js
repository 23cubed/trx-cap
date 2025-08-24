// Mesh configuration - single source of truth
import { beginResource, updateResourceProgress, endResource } from './loader-progress.js';
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

// Cache a reusable particle texture
var __PARTICLE_TEXTURE = null;
function getParticleTexture() {
    if (!__PARTICLE_TEXTURE) {
        var svg = '<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="15" fill="white"/></svg>';
        __PARTICLE_TEXTURE = new window.THREE.TextureLoader().load('data:image/svg+xml;base64,' + btoa(svg));
    }
    return __PARTICLE_TEXTURE;
}

// Internal state for cleanup/re-init between SPA navigations
var morphState = {
    renderer: null,
    canvas: null,
    mouseHandler: null,
    resizeHandler: null,
    renderLoop: null,
    initialized: false,
    paused: false
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
        beginResource(assetUrl);
        loader.load(
            assetUrl,
            function (gltf) {
                endResource(assetUrl);
                gltf.scene.updateMatrixWorld(true);
                var mesh = null;
                gltf.scene.traverse(function(child) {
                    if (child.isMesh) mesh = child;
                });
                if (!mesh) {
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
                var posAttr = new window.THREE.Float32BufferAttribute(positions, 3);
                var colAttr = new window.THREE.Float32BufferAttribute(colors, 3);
                posAttr.setUsage(window.THREE.DynamicDrawUsage);
                colAttr.setUsage(window.THREE.DynamicDrawUsage);
                particleGeometry.setAttribute('position', posAttr);
                particleGeometry.setAttribute('color', colAttr);

                var particleMaterial = new window.THREE.PointsMaterial({
                    size: 1.5,
                    sizeAttenuation: false,
                    vertexColors: true,
                    map: getParticleTexture(),
                    transparent: true,
                    blending: window.THREE.AdditiveBlending,
                    depthWrite: false
                });

                var newParticleSystem = new window.THREE.Points(particleGeometry, particleMaterial);
                newParticleSystem.position.set(MESH_CONFIG.TREX.x, MESH_CONFIG.TREX.y, MESH_CONFIG.TREX.z);
                newParticleSystem.frustumCulled = false;

                scene.add(newParticleSystem);
                // Dispose original GLTF resources to free memory
                try {
                    gltf.scene.traverse(function(child) {
                        if (child.geometry) child.geometry.dispose();
                        if (child.material) {
                            if (Array.isArray(child.material)) child.material.forEach(function(m){ if (m && m.dispose) m.dispose(); });
                            else if (child.material.dispose) child.material.dispose();
                        }
                    });
                } catch (e) {}
                resolve(newParticleSystem);
            },
            function (e) { updateResourceProgress(assetUrl, e && e.loaded, e && e.total, e && e.lengthComputable); },
            function (error) {
                endResource(assetUrl);
                reject(error);
            }
        );
    });
}

// Load DNA helix GLTF model and convert to particle system
function initDNAHelix(scene, assetUrl) {
    return new Promise(function(resolve, reject) {
        var loader = new window.GLTFLoader();
        beginResource(assetUrl);
        loader.load(
            assetUrl,
            function (gltf) {
                endResource(assetUrl);
                gltf.scene.updateMatrixWorld(true);
                var mesh = null;
                gltf.scene.traverse(function(child) {
                    if (child.isMesh) mesh = child;
                });
                if (!mesh) {
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
                var posAttr = new window.THREE.Float32BufferAttribute(positions, 3);
                var colAttr = new window.THREE.Float32BufferAttribute(colors, 3);
                posAttr.setUsage(window.THREE.DynamicDrawUsage);
                colAttr.setUsage(window.THREE.DynamicDrawUsage);
                particleGeometry.setAttribute('position', posAttr);
                particleGeometry.setAttribute('color', colAttr);

                var particleMaterial = new window.THREE.PointsMaterial({
                    size: 3,
                    sizeAttenuation: false,
                    vertexColors: true,
                    map: getParticleTexture(),
                    transparent: true,
                    blending: window.THREE.AdditiveBlending,
                    depthWrite: false
                });

                var newParticleSystem = new window.THREE.Points(particleGeometry, particleMaterial);
                newParticleSystem.position.set(MESH_CONFIG.DNA.x, MESH_CONFIG.DNA.y, MESH_CONFIG.DNA.z);
                newParticleSystem.frustumCulled = false;

                // Dispose original GLTF resources to free memory
                try {
                    gltf.scene.traverse(function(child) {
                        if (child.geometry) child.geometry.dispose();
                        if (child.material) {
                            if (Array.isArray(child.material)) child.material.forEach(function(m){ if (m && m.dispose) m.dispose(); });
                            else if (child.material.dispose) child.material.dispose();
                        }
                    });
                } catch (e) {}
                resolve(newParticleSystem);
            },
            function (e) { updateResourceProgress(assetUrl, e && e.loaded, e && e.total, e && e.lengthComputable); },
            function (error) {
                endResource(assetUrl);
                reject(error);
            }
        );
    });
}

    // Main particle field setup and animation
var particleInitPromise = null;

function initParticleHeroMeshMorph(rootElement) {
    if (particleInitPromise) {
        return particleInitPromise;
    }
    particleInitPromise = new Promise(function(resolve) {
        var searchRoot = (rootElement && rootElement.querySelector) ? rootElement : document;
        var canvas = searchRoot.querySelector('#texture-canvas');
        if (!canvas) {
            resolve(false);
            return;
        }
        // If already initialized on the same canvas, just resume and exit
        if (morphState.renderer && morphState.canvas === canvas && morphState.initialized) {
            try { canvas.style.display = 'block'; } catch (e) {}
            try { if (morphState.renderLoop) morphState.renderer.setAnimationLoop(morphState.renderLoop); } catch (e) {}
            morphState.paused = false;
            resolve(true);
            return;
        }

    var width = window.innerWidth,
        height = window.innerHeight;

    // Resolve asset URLs from config only
    var trexUrl = MESH_CONFIG.TREX.url;
    var dnaUrl = MESH_CONFIG.DNA.url;
    

    // If a previous renderer exists on a different canvas, clean it up
    if (morphState.renderer && morphState.canvas !== canvas) {
        try { morphState.renderer.setAnimationLoop(null); } catch (e) {}
        try { morphState.renderer.dispose(); } catch (e) {}
        if (morphState.mouseHandler) window.removeEventListener('mousemove', morphState.mouseHandler);
        if (morphState.resizeHandler) window.removeEventListener('resize', morphState.resizeHandler);
        morphState.renderer = null;
        morphState.canvas = null;
        morphState.mouseHandler = null;
        morphState.resizeHandler = null;
    }

    // Setup Three.js renderer and scene
    var renderer = new window.THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, preserveDrawingBuffer: false });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);

    var scene = new window.THREE.Scene();
    var camera = new window.THREE.PerspectiveCamera(50, width / height, 0.1, 2000);
    camera.position.set(0, 0, 80);
    

    // State variables
    var particleSystem = null;
    var shaderUniforms = null;
    var tRexPositions = null;
    var dnaPositions = null;
    var deltaPositions = null;
    var dissolveDisplacements = null;
    var morphTimeline = null;
    var morphProgress = { value: 1 };
    var targetProgress = 1;
    var isShowingTRex = true;
    var morphTriggerCount = 0;
    var lastLogTime = 0;
    
    var mouse = new window.THREE.Vector2();
    var smoothedMouse = new window.THREE.Vector2();
    var mouseWorldPos = new window.THREE.Vector3();
    var repulsionOffsets = null; // no longer used after shader switch, left for compatibility during init
    
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

    // Pre-allocate reusable vectors to avoid per-particle allocations
    var tmpWorld = new window.THREE.Vector3();
    var dnaWorldPos = new window.THREE.Vector3();
    var tRexWorldPos = new window.THREE.Vector3();

    // Animation loop
    function renderLoop() {
        if (resizeRendererToDisplaySize(renderer)) {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
        }
        
        // Update shader uniforms per frame (GPU handles per-vertex work)
        if (shaderUniforms) {
            var progress = morphProgress.value;
            shaderUniforms.uProgress.value = progress;
            shaderUniforms.uDissolveIntensity.value = Math.sin(progress * Math.PI);
            // Smooth mouse for eased repulsion feel (approximate previous per-particle easing)
            smoothedMouse.x += (mouse.x - smoothedMouse.x) * REPULSION_CONFIG.easeSpeed;
            smoothedMouse.y += (mouse.y - smoothedMouse.y) * REPULSION_CONFIG.easeSpeed;
            shaderUniforms.uMouseNDC.value.set(smoothedMouse.x, smoothedMouse.y);
        }
        
        // Update world position interpolation once per frame
        if (particleSystem) {
            dnaWorldPos.set(MESH_CONFIG.DNA.x, MESH_CONFIG.DNA.y, MESH_CONFIG.DNA.z);
            tRexWorldPos.set(MESH_CONFIG.TREX.x, MESH_CONFIG.TREX.y, MESH_CONFIG.TREX.z);
            particleSystem.position.lerpVectors(dnaWorldPos, tRexWorldPos, morphProgress.value);
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
    }
    renderer.setAnimationLoop(renderLoop);
    morphState.renderLoop = renderLoop;

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
    
    // Register and remember handlers for cleanup
    morphState.mouseHandler = updateMousePosition;
    morphState.resizeHandler = handleWindowResize;
    window.addEventListener('mousemove', morphState.mouseHandler);
    window.addEventListener('resize', morphState.resizeHandler);

    // Save state
    morphState.renderer = renderer;
    morphState.canvas = canvas;

        initTRex(scene, trexUrl)
            .then(function(ps) {
                if (!ps) {
                    resolve(false);
                    return null;
                }
                var positionAttribute = ps.geometry.getAttribute('position');
                tRexPositions = new Float32Array(positionAttribute.array);
                repulsionOffsets = new Float32Array(positionAttribute.array.length);
                particleSystem = ps;
                return initDNAHelix(scene, dnaUrl);
            })
            .then(function(dnaPs) {
                if (!dnaPs) {
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
                // Precompute deltas for faster per-frame morph
                deltaPositions = new Float32Array(tRexPositions.length);
                for (var i = 0; i < tRexParticleCount; i++) {
                    deltaPositions[3 * i] = tRexPositions[3 * i] - dnaPositions[3 * i];
                    deltaPositions[3 * i + 1] = tRexPositions[3 * i + 1] - dnaPositions[3 * i + 1];
                    deltaPositions[3 * i + 2] = tRexPositions[3 * i + 2] - dnaPositions[3 * i + 2];
                }
                dissolveDisplacements = generateDissolveDisplacements(tRexParticleCount);

                // Build GPU attributes for shader-based update
                try {
                    var geom = particleSystem.geometry;
                    var dnaAttr = new window.THREE.Float32BufferAttribute(dnaPositions, 3);
                    var deltaAttr = new window.THREE.Float32BufferAttribute(deltaPositions, 3);
                    var dissolveAttr = new window.THREE.Float32BufferAttribute(dissolveDisplacements, 3);
                    dnaAttr.setUsage(window.THREE.StaticDrawUsage);
                    deltaAttr.setUsage(window.THREE.StaticDrawUsage);
                    dissolveAttr.setUsage(window.THREE.StaticDrawUsage);
                    geom.setAttribute('aDna', dnaAttr);
                    geom.setAttribute('aDelta', deltaAttr);
                    geom.setAttribute('aDissolve', dissolveAttr);

                    // Precompute averages for depth-based opacity
                    var avgDNAZ = 0, avgDeltaZ = 0, avgDissolveZ = 0;
                    for (var j = 0; j < tRexParticleCount; j++) {
                        avgDNAZ += dnaPositions[3 * j + 2];
                        avgDeltaZ += deltaPositions[3 * j + 2];
                        avgDissolveZ += dissolveDisplacements[3 * j + 2];
                    }
                    avgDNAZ /= tRexParticleCount;
                    avgDeltaZ /= tRexParticleCount;
                    avgDissolveZ /= tRexParticleCount;

                    var vertexShader = '\n\
                        #include <common>\n\
                        attribute vec3 aDna;\n\
                        attribute vec3 aDelta;\n\
                        attribute vec3 aDissolve;\n\
                        uniform float uProgress;\n\
                        uniform float uDissolveIntensity;\n\
                        uniform vec2 uMouseNDC;\n\
                        uniform float uScreenRadius;\n\
                        uniform float uStrength;\n\
                        uniform float uRepelScale;\n\
                        uniform float uAvgDNAZ;\n\
                        uniform float uAvgDeltaZ;\n\
                        uniform float uAvgDissolveZ;\n\
                        uniform float uDepthRange;\n\
                        uniform float uMinOpacity;\n\
                        uniform float uMaxOpacity;\n\
                        uniform float uPointSize;\n\
                        varying float vBrightness;\n\
                        void main() {\n\
                            vec3 base = aDna + aDelta * uProgress + aDissolve * uDissolveIntensity;\n\
                            // Project to NDC for screen-space repulsion\n\
                            vec4 mv0 = modelViewMatrix * vec4(base, 1.0);\n\
                            vec4 clip0 = projectionMatrix * mv0;\n\
                            vec2 ndc = clip0.xy / clip0.w;\n\
                            float dist = length(ndc - uMouseNDC);\n\
                            if (dist < uScreenRadius && dist > 0.0001) {\n\
                                float influence = pow(1.0 - dist / uScreenRadius, 2.0);\n\
                                float repulsion = influence * uStrength;\n\
                                vec2 dir = normalize(ndc - uMouseNDC);\n\
                                base.xy += dir * repulsion * uRepelScale;\n\
                            }\n\
                            // Depth-based brightness using precomputed averages\n\
                            float avgZ = uAvgDNAZ + uProgress * uAvgDeltaZ + uDissolveIntensity * uAvgDissolveZ;\n\
                            float nearZ = avgZ + uDepthRange * 0.5;\n\
                            float farZ = avgZ - uDepthRange * 0.5;\n\
                            float normZ = clamp((base.z - farZ) / (nearZ - farZ), 0.0, 1.0);\n\
                            vBrightness = mix(uMinOpacity, uMaxOpacity, normZ);\n\
                            vec4 mv = modelViewMatrix * vec4(base, 1.0);\n\
                            gl_Position = projectionMatrix * mv;\n\
                            gl_PointSize = uPointSize;\n\
                        }\n\
                    ';

                    var fragmentShader = '\n\
                        #include <common>\n\
                        uniform sampler2D pointTexture;\n\
                        uniform float uBrightnessScale;\n\
                        varying float vBrightness;\n\
                        void main() {\n\
                            vec4 tex = texture2D(pointTexture, gl_PointCoord);\n\
                            gl_FragColor = vec4(vec3(vBrightness) * uBrightnessScale, tex.a);\n\
                            #include <tonemapping_fragment>\n\
                            #include <colorspace_fragment>\n\
                        }\n\
                    ';

                    shaderUniforms = {
                        pointTexture: { value: getParticleTexture() },
                        uProgress: { value: morphProgress.value },
                        uDissolveIntensity: { value: 0 },
                        uMouseNDC: { value: new window.THREE.Vector2(0, 0) },
                        uScreenRadius: { value: REPULSION_CONFIG.screenRadius },
                        uStrength: { value: REPULSION_CONFIG.strength },
                        uRepelScale: { value: 5.0 },
                        uAvgDNAZ: { value: avgDNAZ },
                        uAvgDeltaZ: { value: avgDeltaZ },
                        uAvgDissolveZ: { value: avgDissolveZ },
                        uDepthRange: { value: depthRange },
                        uMinOpacity: { value: minOpacity },
                        uMaxOpacity: { value: maxOpacity },
                        uPointSize: { value: 1.5 },
                        uBrightnessScale: { value: 1.0 }
                    };

                    var shaderMat = new window.THREE.ShaderMaterial({
                        uniforms: shaderUniforms,
                        vertexShader: vertexShader,
                        fragmentShader: fragmentShader,
                        transparent: true,
                        blending: window.THREE.AdditiveBlending,
                        depthWrite: false,
                        vertexColors: false
                    });

                    particleSystem.material = shaderMat;
                } catch (e) {}

                initMorphTimeline();
                morphState.initialized = true;
                morphState.paused = false;
                try { canvas.setAttribute('data-morph-initialized', '1'); } catch (e) {}
                resolve(true);
            })
            .catch(function(err) {
                resolve(false);
            });
    });
    return particleInitPromise;
}

function pauseParticleHeroMeshMorph() {
    if (morphState.renderer) {
        try { morphState.renderer.setAnimationLoop(null); } catch (e) {}
    }
    if (morphState.canvas) {
        try { morphState.canvas.style.display = 'none'; } catch (e) {}
    }
    morphState.paused = true;
}

function disposeParticleHeroMeshMorph() {
    if (morphState.renderer) {
        try { morphState.renderer.setAnimationLoop(null); } catch (e) {}
        try {
            if (particleSystem && particleSystem.geometry) { try { particleSystem.geometry.dispose(); } catch (e) {} }
            if (particleSystem && particleSystem.material) { try { particleSystem.material.dispose(); } catch (e) {} }
            if (particleSystem && particleSystem.parent) { try { particleSystem.parent.remove(particleSystem); } catch (e) {} }
        } catch (e) {}
        try { morphState.renderer.dispose(); } catch (e) {}
    }
    if (morphState.mouseHandler) window.removeEventListener('mousemove', morphState.mouseHandler);
    if (morphState.resizeHandler) window.removeEventListener('resize', morphState.resizeHandler);
    morphState.renderer = null;
    morphState.canvas = null;
    morphState.mouseHandler = null;
    morphState.resizeHandler = null;
    particleInitPromise = null;
}

export { initParticleHeroMeshMorph, disposeParticleHeroMeshMorph, pauseParticleHeroMeshMorph };