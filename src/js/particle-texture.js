import { beginResource, updateResourceProgress, endResource } from './loader-progress.js';
var __particleTextureRenderers = new Set();
var __sharedPointTexture = null;

// Touch screen detection
var isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0);

function InitParticleTexture(imageUrl = 'https://rawcdn.githack.com/23cubed/trx-cap/783fcee5b72e33115c125437ad8e7ebce94c485d/src/assets/BackgroundWavesA.svg', particleSpacing = 2, transparencyThreshold = 0.05, transparencyCeiling = 1.0) {
    const canvases = document.querySelectorAll('canvas.particle-texture');
    const initPromises = [];

    // Global mouse tracking for window-based repulsion (persist across Barba navigations)
    // Skip mouse tracking setup for touch devices
    if (!isTouchDevice) {
        if (!window.__particleTextureMouse) {
            window.__particleTextureMouse = { x: 0, y: 0 };
        }
        function updateWindowMousePosition(event) {
            window.__particleTextureMouse.x = event.clientX;
            window.__particleTextureMouse.y = event.clientY;
        }
        // Add window mouse listener once
        if (!window.__particleTextureMouseListenerRegistered) {
            window.addEventListener('mousemove', updateWindowMousePosition);
            window.__particleTextureMouseListenerRegistered = true;
        }
    }



    canvases.forEach(canvas => {
        let resolveCanvasInit;
        const canvasInitPromise = new Promise((resolve) => { resolveCanvasInit = resolve; });
        initPromises.push(canvasInitPromise);

        const waitForCanvasReady = () => new Promise((resolve) => {
            const isReady = () => canvas.isConnected && canvas.clientWidth > 1 && canvas.clientHeight > 1;
            if (isReady()) { resolve(); return; }
            let rafId = null; let elapsed = 0;
            const tick = (t) => {
                if (isReady()) { resolve(); return; }
                elapsed += 16;
                if (elapsed > 2000) { resolve(); return; }
                rafId = requestAnimationFrame(tick);
            };
            rafId = requestAnimationFrame(tick);
        });

        waitForCanvasReady().then(() => {
            if (canvas.clientWidth <= 1 || canvas.clientHeight <= 1) { resolveCanvasInit(false); return; }
            const renderer = new window.THREE.WebGLRenderer({
                canvas: canvas,
                antialias: true,
                alpha: true,
                preserveDrawingBuffer: false,
                powerPreference: 'high-performance'
            });
            __particleTextureRenderers.add(renderer);
            try { canvas.setAttribute('data-texture-initialized', '1'); } catch (e) {}
            renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
            renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
            renderer.setClearColor(0x000000, 0);

            const scene = new window.THREE.Scene();
            try { renderer.__scene = scene; } catch (e) {}
            const camera = new window.THREE.OrthographicCamera(
                -canvas.clientWidth / 2, canvas.clientWidth / 2,
                canvas.clientHeight / 2, -canvas.clientHeight / 2,
                1, 1000
            );
            camera.position.z = 100;

            const computedStyle = window.getComputedStyle(canvas);
            const textColor = computedStyle.color;

            // Load the image and create particles based on pixel data
            let updateParticlePositions = null;
            let particleSystem = null;

            // Check for custom image URL on this specific canvas
            const canvasImageUrl = canvas.getAttribute('data-image-url') || imageUrl;

            const loader = new window.THREE.TextureLoader();
            beginResource(canvasImageUrl);
            loader.load(canvasImageUrl, (texture) => {
                endResource(canvasImageUrl);
                createParticlesFromImage(texture);
            }, (e) => { updateResourceProgress(canvasImageUrl, e && e.loaded, e && e.total, e && e.lengthComputable); }, () => { endResource(canvasImageUrl); resolveCanvasInit(false); });

            function createParticlesFromImage(texture) {
                const img = texture.image;

                // Create a temporary canvas to read pixel data
                const tempCanvas = document.createElement('canvas');
                const tempCtx = tempCanvas.getContext('2d');

                // Calculate scale to fill canvas (maintain aspect ratio, allow overflow)
                const imgAspect = img.width / img.height;
                const canvasAspect = canvas.clientWidth / canvas.clientHeight;

                let drawWidth, drawHeight;
                if (imgAspect > canvasAspect) {
                    // Image is wider, fit to canvas height (width will overflow)
                    drawHeight = canvas.clientHeight;
                    drawWidth = canvas.clientHeight * imgAspect;
                } else {
                    // Image is taller, fit to canvas width (height will overflow)
                    drawWidth = canvas.clientWidth;
                    drawHeight = canvas.clientWidth / imgAspect;
                }

                // Scale down for particle sampling (ensure minimum 1x1 to avoid IndexSizeError)
                let sampleWidth = Math.floor(drawWidth / particleSpacing);
                let sampleHeight = Math.floor(drawHeight / particleSpacing);
                if (!Number.isFinite(sampleWidth) || sampleWidth <= 0) sampleWidth = 1;
                if (!Number.isFinite(sampleHeight) || sampleHeight <= 0) sampleHeight = 1;

                tempCanvas.width = sampleWidth;
                tempCanvas.height = sampleHeight;

                // Draw the image to the temp canvas
                tempCtx.drawImage(img, 0, 0, sampleWidth, sampleHeight);

                // Get pixel data with safe dimensions
                const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
                const pixels = imageData.data;

                // Process all pixels and calculate opacity based on whiteness
                const particleData = [];

                // First pass: find the actual luminance range in the image
                let minLuminance = 1;
                let maxLuminance = 0;

                for (let y = 0; y < tempCanvas.height; y++) {
                    for (let x = 0; x < tempCanvas.width; x++) {
                        const index = (y * tempCanvas.width + x) * 4;
                        const r = pixels[index];
                        const g = pixels[index + 1];
                        const b = pixels[index + 2];
                        const alpha = pixels[index + 3];

                        // Only process pixels that are actually visible
                        if (alpha > 10) {
                            const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
                            minLuminance = Math.min(minLuminance, luminance);
                            maxLuminance = Math.max(maxLuminance, luminance);
                        }
                    }
                }

                const luminanceRange = maxLuminance - minLuminance;

                // Second pass: create particles using the actual luminance range
                for (let y = 0; y < tempCanvas.height; y++) {
                    for (let x = 0; x < tempCanvas.width; x++) {
                        const index = (y * tempCanvas.width + x) * 4;
                        const r = pixels[index];
                        const g = pixels[index + 1];
                        const b = pixels[index + 2];
                        const alpha = pixels[index + 3];

                        // Only process pixels that are actually visible
                        if (alpha > 10) {
                            // Calculate brightness/whiteness using luminance formula
                            const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

                            // Normalize luminance to the actual range present in the image
                            const normalizedLuminance = luminanceRange > 0 ? (luminance - minLuminance) / luminanceRange : 0;

                            // Use luminance directly so brighter areas get higher opacity
                            const mappedOpacity = normalizedLuminance;

                            // Apply threshold to tighten the range
                            // Values below threshold become transparent
                            // Values above threshold get remapped to 0-1 range
                            if (mappedOpacity > transparencyThreshold) {
                                // Remap the remaining range to 0-1 for smooth gradients
                                const thresholdRange = 1 - transparencyThreshold;
                                let finalOpacity = thresholdRange > 0 ? (mappedOpacity - transparencyThreshold) / thresholdRange : 1;

                                // Scale opacity range from 0-1 to 0-ceiling
                                finalOpacity = finalOpacity * transparencyCeiling;

                                // Store normalized coordinates (0-1) for resolution independence
                                const normalizedX = x / tempCanvas.width;
                                const normalizedY = y / tempCanvas.height;

                                particleData.push({
                                    normalizedX: normalizedX,
                                    normalizedY: normalizedY,
                                    z: 0,
                                    opacity: finalOpacity
                                });
                            }
                        }
                    }
                }

                const numParticles = particleData.length;

                if (numParticles === 0) {
                    resolveCanvasInit(false);
                    return;
                }

                const positions = new Float32Array(numParticles * 3);
                const colors = new Float32Array(numParticles * 3);
                const opacities = new Float32Array(numParticles);
                const basePositions = new Float32Array(numParticles * 3);
                const repulsionOffsets = new Float32Array(numParticles * 3);

                // Mouse repulsion variables
                const repulsionRadius = 80;
                const repulsionStrength = 10;
                const easeSpeed = 0.1;

                // Function to convert normalized coordinates to current world coordinates
                updateParticlePositions = function () {
                    // Calculate current image scaling for cover behavior
                    const imgAspect = img.width / img.height;
                    const canvasAspect = canvas.clientWidth / canvas.clientHeight;

                    let currentDrawWidth, currentDrawHeight;
                    if (imgAspect > canvasAspect) {
                        currentDrawHeight = canvas.clientHeight;
                        currentDrawWidth = canvas.clientHeight * imgAspect;
                    } else {
                        currentDrawWidth = canvas.clientWidth;
                        currentDrawHeight = canvas.clientWidth / imgAspect;
                    }

                    for (let i = 0; i < numParticles; i++) {
                        const particle = particleData[i];

                        // Convert normalized coordinates to current world coordinates
                        const worldX = (particle.normalizedX * currentDrawWidth) - currentDrawWidth / 2;
                        const worldY = -((particle.normalizedY * currentDrawHeight) - currentDrawHeight / 2);

                        positions[i * 3] = worldX;
                        positions[i * 3 + 1] = worldY;
                        positions[i * 3 + 2] = particle.z;

                        // Store base positions for repulsion effect
                        basePositions[i * 3] = worldX;
                        basePositions[i * 3 + 1] = worldY;
                        basePositions[i * 3 + 2] = particle.z;
                    }

                    // Mark position attribute for update
                    if (particleSystem) {
                        particleSystem.geometry.getAttribute('position').needsUpdate = true;
                    }
                }

                // Set up particle positions, colors, and opacities
                updateParticlePositions();

                for (let i = 0; i < numParticles; i++) {
                    const particle = particleData[i];

                    // Initialize repulsion offsets to zero
                    repulsionOffsets[i * 3] = 0;
                    repulsionOffsets[i * 3 + 1] = 0;
                    repulsionOffsets[i * 3 + 2] = 0;

                    // Store individual particle opacity
                    opacities[i] = particle.opacity;

                    const colorMatch = textColor.match(/\d+/g);
                    if (colorMatch && colorMatch.length >= 3) {
                        colors[i * 3] = parseInt(colorMatch[0]) / 255;
                        colors[i * 3 + 1] = parseInt(colorMatch[1]) / 255;
                        colors[i * 3 + 2] = parseInt(colorMatch[2]) / 255;
                    } else {
                        colors[i * 3] = 1;
                        colors[i * 3 + 1] = 1;
                        colors[i * 3 + 2] = 1;
                    }
                }

                const particleGeometry = new window.THREE.BufferGeometry();
                const posAttr = new window.THREE.Float32BufferAttribute(positions, 3);
                const colAttr = new window.THREE.Float32BufferAttribute(colors, 3);
                const opaAttr = new window.THREE.Float32BufferAttribute(opacities, 1);
                posAttr.setUsage(window.THREE.DynamicDrawUsage);
                colAttr.setUsage(window.THREE.DynamicDrawUsage);
                opaAttr.setUsage(window.THREE.DynamicDrawUsage);
                particleGeometry.setAttribute('position', posAttr);
                particleGeometry.setAttribute('color', colAttr);
                particleGeometry.setAttribute('opacity', opaAttr);

                if (!__sharedPointTexture) {
                    const svg = '<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="16" fill="white"/></svg>';
                    __sharedPointTexture = new window.THREE.TextureLoader().load('data:image/svg+xml;base64,' + btoa(svg));
                }

                // Create custom shader material to handle per-particle opacity
                const vertexShader = `
                attribute float opacity;
                varying float vOpacity;
                varying vec3 vColor;
                
                void main() {
                    vOpacity = opacity;
                    vColor = color;
                    
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_Position = projectionMatrix * mvPosition;
                    gl_PointSize = 2.0;
                }
            `;

                const fragmentShader = `
                uniform sampler2D pointTexture;
                varying float vOpacity;
                varying vec3 vColor;
                
                void main() {
                    vec4 textureColor = texture2D(pointTexture, gl_PointCoord);
                    gl_FragColor = vec4(vColor, textureColor.a * vOpacity);
                }
            `;

                const particleMaterial = new window.THREE.ShaderMaterial({
                    uniforms: {
                        pointTexture: { value: __sharedPointTexture }
                    },
                    vertexShader: vertexShader,
                    fragmentShader: fragmentShader,
                    transparent: true,
                    blending: window.THREE.NormalBlending,
                    depthWrite: false,
                    vertexColors: true
                });

                particleSystem = new window.THREE.Points(particleGeometry, particleMaterial);
                scene.add(particleSystem);

                function getCanvasMousePosition() {
                    if (isTouchDevice || !window.__particleTextureMouse) {
                        return { x: 0, y: 0 };
                    }
                    
                    const currentRect = canvas.getBoundingClientRect();

                    // Convert window mouse coordinates to canvas-relative coordinates
                    const canvasX = window.__particleTextureMouse.x - currentRect.left;
                    const canvasY = window.__particleTextureMouse.y - currentRect.top;

                    // Convert to world coordinates using clientWidth/clientHeight
                    const worldX = canvasX - canvas.clientWidth / 2;
                    const worldY = -(canvasY - canvas.clientHeight / 2);

                    return { x: worldX, y: worldY };
                }

                function resizeRendererToDisplaySize(renderer) {
                    const canvas = renderer.domElement;
                    const width = canvas.clientWidth;
                    const height = canvas.clientHeight;
                    const needResize = canvas.width !== width || canvas.height !== height;
                    if (needResize) {
                        renderer.setSize(width, height, false);
                    }
                    return needResize;
                }

                renderer.setAnimationLoop(() => {
                    if (resizeRendererToDisplaySize(renderer)) {
                        const canvas = renderer.domElement;
                        camera.left = -canvas.clientWidth / 2;
                        camera.right = canvas.clientWidth / 2;
                        camera.top = canvas.clientHeight / 2;
                        camera.bottom = -canvas.clientHeight / 2;
                        camera.updateProjectionMatrix();

                        // Update particle positions to maintain cover behavior
                        if (updateParticlePositions) {
                            updateParticlePositions();
                        }
                    }

                    // Apply mouse repulsion effect (skip for touch devices)
                    if (!isTouchDevice && particleSystem && basePositions) {
                        const positionAttribute = particleSystem.geometry.getAttribute('position');
                        const posArray = positionAttribute.array;
                        const mouseWorldPos = getCanvasMousePosition();

                        for (let i = 0; i < positionAttribute.count; i++) {
                            const baseX = basePositions[3 * i];
                            const baseY = basePositions[3 * i + 1];
                            const baseZ = basePositions[3 * i + 2];

                            let targetOffsetX = 0;
                            let targetOffsetY = 0;

                            // Calculate distance from particle to mouse
                            const dx = baseX - mouseWorldPos.x;
                            const dy = baseY - mouseWorldPos.y;
                            const distance = Math.hypot(dx, dy);

                            if (distance < repulsionRadius && distance > 0.1) {
                                const influence = Math.pow(1 - distance / repulsionRadius, 2);
                                const repulsionForce = influence * repulsionStrength;
                                const normalizedDx = dx / distance;
                                const normalizedDy = dy / distance;

                                targetOffsetX = normalizedDx * repulsionForce;
                                targetOffsetY = normalizedDy * repulsionForce;
                            }

                            // Smoothly interpolate current offset toward target
                            repulsionOffsets[3 * i] += (targetOffsetX - repulsionOffsets[3 * i]) * easeSpeed;
                            repulsionOffsets[3 * i + 1] += (targetOffsetY - repulsionOffsets[3 * i + 1]) * easeSpeed;

                            // Apply the smoothed offset to the base position
                            const finalX = baseX + repulsionOffsets[3 * i];
                            const finalY = baseY + repulsionOffsets[3 * i + 1];
                            const idx = 3 * i;
                            posArray[idx] = finalX;
                            posArray[idx + 1] = finalY;
                            posArray[idx + 2] = baseZ;
                        }
                        positionAttribute.needsUpdate = true;
                    }

                    renderer.render(scene, camera);
                });
                resolveCanvasInit(true);
            }
        });
    });
    if (initPromises.length === 0) {
        return Promise.resolve(false);
    }
    return Promise.allSettled(initPromises).then(() => true);
}

function disposeParticleTexture() {
    try {
        __particleTextureRenderers.forEach(function(r) {
            try {
                const scene = r.__scene;
                if (scene && scene.children) {
                    scene.children.slice().forEach(function(obj){
                        try {
                            if (obj.isPoints) {
                                if (obj.geometry) { try { obj.geometry.dispose(); } catch (e) {} }
                                if (obj.material) { try { obj.material.dispose(); } catch (e) {} }
                            }
                        } catch (e) {}
                        try { scene.remove(obj); } catch (e) {}
                    });
                }
            } catch (e) {}
            try { r.setAnimationLoop(null); } catch (e) {}
            try { if (r.forceContextLoss) r.forceContextLoss(); } catch (e) {}
            try { r.dispose(); } catch (e) {}
        });
    } catch (e) {}
    __particleTextureRenderers.clear();
}

export { InitParticleTexture, disposeParticleTexture };
