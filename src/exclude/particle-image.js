function InitParticleMatrix(imageUrl = 'https://raw.githack.com/23cubed/trx-cap/main/src/assets/BackgroundWavesA.svg', particleSpacing = 2, transparencyThreshold = 0.05) {
    const canvases = document.querySelectorAll('canvas.particle-matrix');
    
    // Global mouse tracking for window-based repulsion
    let windowMouse = { x: 0, y: 0 };
    
    function updateWindowMousePosition(event) {
        windowMouse.x = event.clientX;
        windowMouse.y = event.clientY;
    }
    
    // Add window mouse listener once
    if (!window.particleMatrixMouseListener) {
        window.addEventListener('mousemove', updateWindowMousePosition);
        window.particleMatrixMouseListener = true;
    }

    canvases.forEach(canvas => {
        const rect = canvas.getBoundingClientRect();
        
        const renderer = new window.THREE.WebGLRenderer({ 
            canvas: canvas, 
            antialias: true, 
            alpha: true, 
            preserveDrawingBuffer: true 
        });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(rect.width, rect.height);
        renderer.setClearColor(0x000000, 0);
        
        const scene = new window.THREE.Scene();
        const camera = new window.THREE.OrthographicCamera(
            -rect.width / 2, rect.width / 2,
            rect.height / 2, -rect.height / 2,
            1, 1000
        );
        camera.position.z = 100;
        
        const computedStyle = window.getComputedStyle(canvas);
        const textColor = computedStyle.color;
        
        // Load the image and create particles based on pixel data
        const loader = new window.THREE.TextureLoader();
        loader.load(imageUrl, (texture) => {
            createParticlesFromImage(texture);
        });

        function createParticlesFromImage(texture) {
            const img = texture.image;
            
            // Create a temporary canvas to read pixel data
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            
            // Calculate scale to fill canvas (maintain aspect ratio, allow overflow)
            const imgAspect = img.width / img.height;
            const canvasAspect = rect.width / rect.height;
            
            let drawWidth, drawHeight;
            if (imgAspect > canvasAspect) {
                // Image is wider, fit to canvas height (width will overflow)
                drawHeight = rect.height;
                drawWidth = rect.height * imgAspect;
            } else {
                // Image is taller, fit to canvas width (height will overflow)
                drawWidth = rect.width;
                drawHeight = rect.width / imgAspect;
            }
            
            // Scale down for particle sampling
            const sampleWidth = Math.floor(drawWidth / particleSpacing);
            const sampleHeight = Math.floor(drawHeight / particleSpacing);
            
            tempCanvas.width = sampleWidth;
            tempCanvas.height = sampleHeight;
            
            // Draw the image to the temp canvas
            tempCtx.drawImage(img, 0, 0, sampleWidth, sampleHeight);
            
            // Get pixel data
            const imageData = tempCtx.getImageData(0, 0, sampleWidth, sampleHeight);
            const pixels = imageData.data;
            
            // Process all pixels and calculate opacity based on whiteness
            const particleData = [];
            
            // First pass: find the actual luminance range in the image
            let minLuminance = 1;
            let maxLuminance = 0;
            
            for (let y = 0; y < sampleHeight; y++) {
                for (let x = 0; x < sampleWidth; x++) {
                    const index = (y * sampleWidth + x) * 4;
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
            for (let y = 0; y < sampleHeight; y++) {
                for (let x = 0; x < sampleWidth; x++) {
                    const index = (y * sampleWidth + x) * 4;
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
                        
                        // Invert so darker areas (lower luminance) get higher opacity
                        const invertedOpacity = 1 - normalizedLuminance;
                        
                        // Apply threshold to tighten the range
                        // Values below threshold become transparent
                        // Values above threshold get remapped to 0-1 range
                        if (invertedOpacity > transparencyThreshold) {
                            // Remap the remaining range to 0-1 for smooth gradients
                            const thresholdRange = 1 - transparencyThreshold;
                            const finalOpacity = thresholdRange > 0 ? (invertedOpacity - transparencyThreshold) / thresholdRange : 1;
                            
                            // Convert pixel coordinates to world coordinates
                            const worldX = (x / sampleWidth) * drawWidth - drawWidth / 2;
                            const worldY = -((y / sampleHeight) * drawHeight - drawHeight / 2);
                            
                            particleData.push({
                                x: worldX,
                                y: worldY,
                                z: 0,
                                opacity: finalOpacity
                            });
                        }
                    }
                }
            }
            
            const numParticles = particleData.length;
            
            if (numParticles === 0) {
                console.warn('No visible pixels found in image');
                return;
            }
            
            const positions = new Float32Array(numParticles * 3);
            const colors = new Float32Array(numParticles * 3);
            const opacities = new Float32Array(numParticles);
            const basePositions = new Float32Array(numParticles * 3);
            const repulsionOffsets = new Float32Array(numParticles * 3);
            
            // Mouse repulsion variables
            const repulsionRadius = 60;
            const repulsionStrength = 20;
            const easeSpeed = 0.08;
            
            // Set up particle positions, colors, and opacities
            for (let i = 0; i < numParticles; i++) {
                const particle = particleData[i];
                
                positions[i * 3] = particle.x;
                positions[i * 3 + 1] = particle.y;
                positions[i * 3 + 2] = particle.z;
                
                // Store base positions for repulsion effect
                basePositions[i * 3] = particle.x;
                basePositions[i * 3 + 1] = particle.y;
                basePositions[i * 3 + 2] = particle.z;
                
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
            particleGeometry.setAttribute('position', new window.THREE.Float32BufferAttribute(positions, 3));
            particleGeometry.setAttribute('color', new window.THREE.Float32BufferAttribute(colors, 3));
            particleGeometry.setAttribute('opacity', new window.THREE.Float32BufferAttribute(opacities, 1));
            
            const svg = '<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="16" fill="white"/></svg>';
            const particleTexture = new window.THREE.TextureLoader().load('data:image/svg+xml;base64,' + btoa(svg));
            
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
                    pointTexture: { value: particleTexture }
                },
                vertexShader: vertexShader,
                fragmentShader: fragmentShader,
                transparent: true,
                blending: window.THREE.NormalBlending,
                depthWrite: false,
                vertexColors: true
            });
            
            const particleSystem = new window.THREE.Points(particleGeometry, particleMaterial);
            scene.add(particleSystem);
            
            function getCanvasMousePosition() {
                const currentRect = canvas.getBoundingClientRect();
                
                // Convert window mouse coordinates to canvas-relative coordinates
                const canvasX = windowMouse.x - currentRect.left;
                const canvasY = windowMouse.y - currentRect.top;
                
                // Convert to world coordinates
                const worldX = canvasX - currentRect.width / 2;
                const worldY = -(canvasY - currentRect.height / 2);
                
                return { x: worldX, y: worldY };
            }
            
            function resizeRenderer() {
                const newRect = canvas.getBoundingClientRect();
                const needResize = canvas.width !== newRect.width || canvas.height !== newRect.height;
                if (needResize) {
                    renderer.setSize(newRect.width, newRect.height, false);
                    camera.left = -newRect.width / 2;
                    camera.right = newRect.width / 2;
                    camera.top = newRect.height / 2;
                    camera.bottom = -newRect.height / 2;
                    camera.updateProjectionMatrix();
                }
            }
            
            renderer.setAnimationLoop(() => {
                resizeRenderer();
                
                // Apply mouse repulsion effect
                if (particleSystem && basePositions) {
                    const positionAttribute = particleSystem.geometry.getAttribute('position');
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
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        
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
                        
                        positionAttribute.setXYZ(i, finalX, finalY, baseZ);
                    }
                    positionAttribute.needsUpdate = true;
                }
                
                renderer.render(scene, camera);
            });
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    InitParticleMatrix(undefined, 2, 0.2);
});
