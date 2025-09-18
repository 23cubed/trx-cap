// Mesh configuration - single source of truth
import { beginResource, updateResourceProgress, endResource } from './loader-progress.js';

// Mobile positioning offsets
var MOBILE_POSITION_OFFSET = {
    x: -50, // Move left
    y: -30,  // Move down
    scale: 155
};

// Touch screen detection
var isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0);

var MESH_CONFIG = {
    TREX: { 
        x: isTouchDevice ? 170 + MOBILE_POSITION_OFFSET.x : 170,
        y: isTouchDevice ? -10 + MOBILE_POSITION_OFFSET.y : -10,
        z: 0,
        scale: isTouchDevice ? MOBILE_POSITION_OFFSET.scale : 100,
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
    var renderer = new window.THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, preserveDrawingBuffer: false, powerPreference: 'high-performance' });
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
    var mouseWorldPos = new window.THREE.Vector3();
    var repulsionOffsets = null;
    var texSize = 0;
    var offsetsRT_A = null;
    var offsetsRT_B = null;
    var offsetsRead = null;
    var offsetsWrite = null;
    var computeScene = null;
    var computeCamera = null;
    var computeMaterial = null;
    var dnaTex = null;
    var deltaTex = null;
    var dissolveTex = null;
    
    var currentRotation = 0;
    var depthRange = 20;
    var minOpacity = 0.7;
    var maxOpacity = 0.7;

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
    var tmpVec2 = new window.THREE.Vector2();
    var mvMatrix = new window.THREE.Matrix4();
    var mvpMatrix = new window.THREE.Matrix4();

    // Animation loop
    function renderLoop() {
        if (resizeRendererToDisplaySize(renderer)) {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
        }
        
        // Skip all morph and mouse-related calculations for touch devices
        if (!isTouchDevice) {
            // GPGPU offsets update pass (ping-pong)
            if (computeScene && computeMaterial && offsetsWrite && offsetsRead) {
                computeMaterial.uniforms.uProgress.value = morphProgress.value;
                computeMaterial.uniforms.uDissolve.value = Math.sin(morphProgress.value * Math.PI);
                computeMaterial.uniforms.uMouse.value.set(mouse.x, mouse.y);
                computeMaterial.uniforms.tOffsets.value = offsetsRead.texture;
                // update matrices for accurate NDC computation
                if (particleSystem) {
                    particleSystem.updateMatrixWorld(true);
                    computeMaterial.uniforms.uModelMatrix.value.copy(particleSystem.matrixWorld);
                }
                computeMaterial.uniforms.uViewMatrix.value.copy(camera.matrixWorldInverse);
                computeMaterial.uniforms.uProjectionMatrix.value.copy(camera.projectionMatrix);
                renderer.setRenderTarget(offsetsWrite);
                renderer.render(computeScene, computeCamera);
                renderer.setRenderTarget(null);
                var tmp = offsetsRead; offsetsRead = offsetsWrite; offsetsWrite = tmp;
                // update draw material to sample latest offsets
                if (particleSystem && particleSystem.material && particleSystem.material.uniforms && particleSystem.material.uniforms.tOffsets) {
                    particleSystem.material.uniforms.tOffsets.value = offsetsRead.texture;
                }
            }

            // Update world position interpolation once per frame
            if (particleSystem) {
                dnaWorldPos.set(MESH_CONFIG.DNA.x, MESH_CONFIG.DNA.y, MESH_CONFIG.DNA.z);
                tRexWorldPos.set(MESH_CONFIG.TREX.x, MESH_CONFIG.TREX.y, MESH_CONFIG.TREX.z);
                particleSystem.position.lerpVectors(dnaWorldPos, tRexWorldPos, morphProgress.value);
                // Ensure draw material tracks morph timeline
                if (particleSystem.material && particleSystem.material.uniforms) {
                    var du = particleSystem.material.uniforms;
                    if (du.uProgress) du.uProgress.value = morphProgress.value;
                    if (du.uDissolveIntensity) du.uDissolveIntensity.value = Math.sin(morphProgress.value * Math.PI);
                }
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
        } else {
            // For touch devices, set a fixed rotation
            if (particleSystem && particleSystem.rotation.y !== ROTATION_CONFIG.centerRotation) {
                particleSystem.rotation.y = ROTATION_CONFIG.centerRotation;
            }
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
        if (isTouchDevice || morphTimeline) return;
        
        morphTimeline = window.gsap.timeline({ paused: true });
        morphTimeline.addLabel("DNA", 0);
        morphTimeline.addLabel("TREX", MORPH_CONFIG.duration);
    }
    
    // Smoothly tween to target progress
    function morphToProgress(targetValue) {
        if (isTouchDevice || !tRexPositions || !dnaPositions || !dissolveDisplacements) return;
        
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
        if (isTouchDevice) return;
        
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
    morphState.resizeHandler = handleWindowResize;
    window.addEventListener('resize', morphState.resizeHandler);
    
    // Only register mouse handler for non-touch devices
    if (!isTouchDevice) {
        morphState.mouseHandler = updateMousePosition;
        window.addEventListener('mousemove', morphState.mouseHandler);
    }

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
                updateDepthBasedColors();
                
                // For touch devices, skip DNA loading and morphing setup
                if (isTouchDevice) {
                    morphState.initialized = true;
                    morphState.paused = false;
                    try { canvas.setAttribute('data-morph-initialized', '1'); } catch (e) {}
                    resolve(true);
                    return null;
                }
                
                return initDNAHelix(scene, dnaUrl);
            })
            .then(function(dnaPs) {
                if (isTouchDevice || !dnaPs) {
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

                // Initialize GPGPU ping-pong and draw shader
                try {
                    var geom = particleSystem.geometry;
                    // Static attributes for base shapes
                    var dnaAttr = new window.THREE.Float32BufferAttribute(dnaPositions, 3);
                    var deltaAttr = new window.THREE.Float32BufferAttribute(deltaPositions, 3);
                    var dissolveAttr = new window.THREE.Float32BufferAttribute(dissolveDisplacements, 3);
                    dnaAttr.setUsage(window.THREE.StaticDrawUsage);
                    deltaAttr.setUsage(window.THREE.StaticDrawUsage);
                    dissolveAttr.setUsage(window.THREE.StaticDrawUsage);
                    geom.setAttribute('aDna', dnaAttr);
                    geom.setAttribute('aDelta', deltaAttr);
                    geom.setAttribute('aDissolve', dissolveAttr);

                    // UVs mapping each vertex to texel in offsets texture
                    var particleCount = tRexParticleCount;
                    texSize = Math.ceil(Math.sqrt(particleCount));
                    var uvs = new Float32Array(particleCount * 2);
                    var owners = new Float32Array(particleCount);
                    var rands = new Float32Array(particleCount);
                    for (var ui = 0; ui < particleCount; ui++) {
                        var uy = Math.floor(ui / texSize);
                        var ux = ui - uy * texSize;
                        uvs[2 * ui] = (ux + 0.5) / texSize;
                        uvs[2 * ui + 1] = (uy + 0.5) / texSize;
                        owners[ui] = ui < dnaParticleCount ? 1.0 : 0.0;
                        // simple deterministic hash -> [0,1)
                        var h = Math.sin((ui + 1) * 12.9898) * 43758.5453; h = h - Math.floor(h);
                        rands[ui] = h;
                    }
                    var uvAttr = new window.THREE.Float32BufferAttribute(uvs, 2);
                    uvAttr.setUsage(window.THREE.StaticDrawUsage);
                    geom.setAttribute('aUV', uvAttr);
                    var ownerAttr = new window.THREE.Float32BufferAttribute(owners, 1);
                    ownerAttr.setUsage(window.THREE.StaticDrawUsage);
                    geom.setAttribute('aOwner', ownerAttr);
                    var randAttr = new window.THREE.Float32BufferAttribute(rands, 1);
                    randAttr.setUsage(window.THREE.StaticDrawUsage);
                    geom.setAttribute('aRand', randAttr);

                    function makeRT() {
                        return new window.THREE.WebGLRenderTarget(texSize, texSize, {
                            minFilter: window.THREE.NearestFilter,
                            magFilter: window.THREE.NearestFilter,
                            wrapS: window.THREE.ClampToEdgeWrapping,
                            wrapT: window.THREE.ClampToEdgeWrapping,
                            type: window.THREE.FloatType,
                            depthBuffer: false,
                            stencilBuffer: false,
                            format: window.THREE.RGBAFormat
                        });
                    }
                    offsetsRT_A = makeRT();
                    offsetsRT_B = makeRT();
                    offsetsRead = offsetsRT_A;
                    offsetsWrite = offsetsRT_B;

                    // Pack base positions/delta/dissolve into textures
                    function makeDataTex(src) {
                        var arr = new Float32Array(texSize * texSize * 4);
                        for (var i3 = 0; i3 < particleCount; i3++) {
                            arr[4 * i3] = src[3 * i3];
                            arr[4 * i3 + 1] = src[3 * i3 + 1];
                            arr[4 * i3 + 2] = src[3 * i3 + 2];
                            arr[4 * i3 + 3] = 1.0;
                        }
                        var dt = new window.THREE.DataTexture(arr, texSize, texSize, window.THREE.RGBAFormat, window.THREE.FloatType);
                        dt.needsUpdate = true;
                        return dt;
                    }
                    dnaTex = makeDataTex(dnaPositions);
                    deltaTex = makeDataTex(deltaPositions);
                    dissolveTex = makeDataTex(dissolveDisplacements);

                    // Compute pass scene/material
                    computeScene = new window.THREE.Scene();
                    computeCamera = new window.THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
                    var plane = new window.THREE.PlaneGeometry(2, 2);
                    computeMaterial = new window.THREE.ShaderMaterial({
                        uniforms: {
                            tOffsets: { value: offsetsRead.texture },
                            tDNA: { value: dnaTex },
                            tDelta: { value: deltaTex },
                            tDissolve: { value: dissolveTex },
                            uProgress: { value: morphProgress.value },
                            uDissolve: { value: 0.0 },
                            uMouse: { value: new window.THREE.Vector2(0, 0) },
                            uScreenRadius: { value: REPULSION_CONFIG.screenRadius },
                            uStrength: { value: REPULSION_CONFIG.strength },
                            uEase: { value: REPULSION_CONFIG.easeSpeed },
                            uTexSize: { value: texSize },
                            uModelMatrix: { value: new window.THREE.Matrix4() },
                            uViewMatrix: { value: new window.THREE.Matrix4() },
                            uProjectionMatrix: { value: new window.THREE.Matrix4() }
                        },
                        vertexShader: 'void main(){ gl_Position = vec4(position,1.0); }',
                        fragmentShader: '\n\
                            precision highp float;\n\
                            uniform sampler2D tOffsets;\n\
                            uniform sampler2D tDNA;\n\
                            uniform sampler2D tDelta;\n\
                            uniform sampler2D tDissolve;\n\
                            uniform float uProgress;\n\
                            uniform float uDissolve;\n\
                            uniform vec2 uMouse;\n\
                            uniform float uScreenRadius;\n\
                            uniform float uStrength;\n\
                            uniform float uEase;\n\
                            uniform float uTexSize;\n\
                            uniform mat4 uModelMatrix;\n\
                            uniform mat4 uViewMatrix;\n\
                            uniform mat4 uProjectionMatrix;\n\
                            void main(){\n\
                                vec2 uv = gl_FragCoord.xy / uTexSize;\n\
                                vec4 off = texture2D(tOffsets, uv);\n\
                                vec3 dna = texture2D(tDNA, uv).xyz;\n\
                                vec3 del = texture2D(tDelta, uv).xyz;\n\
                                vec3 dis = texture2D(tDissolve, uv).xyz;\n\
                                vec3 base = dna + del * uProgress + dis * uDissolve;\n\
                                vec4 world = uModelMatrix * vec4(base, 1.0);\n\
                                vec4 view = uViewMatrix * world;\n\
                                vec4 clip = uProjectionMatrix * view;\n\
                                vec2 ndc = clip.xy / clip.w;\n\
                                float dist = length(ndc - uMouse);\n\
                                vec2 target = vec2(0.0);\n\
                                if (dist < uScreenRadius && dist > 0.0001) {\n\
                                    float influence = pow(1.0 - dist / uScreenRadius, 2.0);\n\
                                    float rep = influence * uStrength;\n\
                                    vec2 dir = normalize(ndc - uMouse);\n\
                                    target = dir * rep * 5.0;\n\
                                }\n\
                                vec2 eased = off.xy + (target - off.xy) * uEase;\n\
                                gl_FragColor = vec4(eased, 0.0, 1.0);\n\
                            }'
                    });
                    var quad = new window.THREE.Mesh(plane, computeMaterial);
                    computeScene.add(quad);

                    // Compute average Z values to stabilize brightness and avoid flashes at morph endpoints
                    var avgDNAZ = 0, avgDeltaZ = 0, avgDissolveZ = 0;
                    for (var j = 0; j < particleCount; j++) {
                        avgDNAZ += dnaPositions[3 * j + 2];
                        avgDeltaZ += deltaPositions[3 * j + 2];
                        avgDissolveZ += dissolveDisplacements[3 * j + 2];
                    }
                    avgDNAZ /= particleCount;
                    avgDeltaZ /= particleCount;
                    avgDissolveZ /= particleCount;

                    // Draw pass material sampling offsets
                    shaderUniforms = {
                        pointTexture: { value: getParticleTexture() },
                        uProgress: { value: morphProgress.value },
                        uDissolveIntensity: { value: 0 },
                        uDepthRange: { value: depthRange },
                        uMinOpacity: { value: minOpacity },
                        uMaxOpacity: { value: maxOpacity },
                        uDNAOpacity: { value: 1.0 },
                        uPointSize: { value: 1.5 },
                        tOffsets: { value: offsetsRead.texture },
                        uTexSize: { value: texSize },
                        uAvgDNAZ: { value: avgDNAZ },
                        uAvgDeltaZ: { value: avgDeltaZ },
                        uAvgDissolveZ: { value: avgDissolveZ },
                        uFadeStart: { value: 0.85 },
                        uRandRange: { value: 0.12 }
                    };

                    var vs = '\n\
                        #include <common>\n\
                        attribute vec3 aDna;\n\
                        attribute vec3 aDelta;\n\
                        attribute vec3 aDissolve;\n\
                        attribute vec2 aUV;\n\
                        attribute float aOwner;\n\
                        attribute float aRand;\n\
                        uniform float uProgress;\n\
                        uniform float uDissolveIntensity;\n\
                        uniform float uDepthRange;\n\
                        uniform float uMinOpacity;\n\
                        uniform float uMaxOpacity;\n\
                        uniform float uDNAOpacity;\n\
                        uniform float uPointSize;\n\
                        uniform sampler2D tOffsets;\n\
                        uniform float uAvgDNAZ;\n\
                        uniform float uAvgDeltaZ;\n\
                        uniform float uAvgDissolveZ;\n\
                        uniform float uFadeStart;\n\
                        uniform float uRandRange;\n\
                        varying float vBrightness;\n\
                        varying float vFade;\n\
                        void main(){\n\
                            vec3 base = aDna + aDelta * uProgress + aDissolve * uDissolveIntensity;\n\
                            vec2 off = texture2D(tOffsets, aUV).xy;\n\
                            base.xy += off;\n\
                            float avgZ = uAvgDNAZ + uProgress * uAvgDeltaZ + uDissolveIntensity * uAvgDissolveZ;\n\
                            float nearZ = avgZ + uDepthRange * 0.5;\n\
                            float farZ = avgZ - uDepthRange * 0.5;\n\
                            float normZ = clamp((base.z - farZ) / (nearZ - farZ), 0.0, 1.0);\n\
                            float trexB = mix(uMinOpacity, uMaxOpacity, normZ);\n\
                            float tDNA = 1.0 - uProgress;\n\
                            vBrightness = mix(trexB, uDNAOpacity, tDNA);\n\
                            // DNA ownership fading to avoid stacking brightness near end-state\n\
                            float fadeNonOwner = 1.0 - smoothstep(uFadeStart + (aRand - 0.5) * uRandRange, 1.0, tDNA);\n\
                            vFade = mix(fadeNonOwner, 1.0, step(0.5, aOwner));\n\
                            vec4 mv = modelViewMatrix * vec4(base, 1.0);\n\
                            gl_Position = projectionMatrix * mv;\n\
                            gl_PointSize = uPointSize;\n\
                        }';

                    var fs = '\n\
                        #include <common>\n\
                        uniform sampler2D pointTexture;\n\
                        varying float vBrightness;\n\
                        varying float vFade;\n\
                        void main(){\n\
                            vec4 tex = texture2D(pointTexture, gl_PointCoord);\n\
                            gl_FragColor = vec4(vec3(vBrightness) * vFade, tex.a * vFade);\n\
                            #include <tonemapping_fragment>\n\
                            #include <colorspace_fragment>\n\
                        }';

                    var drawMat = new window.THREE.ShaderMaterial({
                        uniforms: shaderUniforms,
                        vertexShader: vs,
                        fragmentShader: fs,
                        transparent: true,
                        blending: window.THREE.AdditiveBlending,
                        depthWrite: false
                    });
                    particleSystem.material = drawMat;
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