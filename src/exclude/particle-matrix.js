function InitParticleMatrix(spacing = 20) {
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
        
        const cols = Math.floor(rect.width / spacing);
        const rows = Math.floor(rect.height / spacing);
        const numParticles = cols * rows;
        
        const positions = new Float32Array(numParticles * 3);
        const colors = new Float32Array(numParticles * 3);
        const basePositions = new Float32Array(numParticles * 3);
        const repulsionOffsets = new Float32Array(numParticles * 3);
        
        // Mouse repulsion variables
        const repulsionRadius = 60;
        const repulsionStrength = 20;
        const easeSpeed = 0.08;
        
        let particleIndex = 0;
        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                const x = i * spacing + spacing / 2 - rect.width / 2;
                const y = -(j * spacing + spacing / 2 - rect.height / 2);
                
                positions[particleIndex * 3] = x;
                positions[particleIndex * 3 + 1] = y;
                positions[particleIndex * 3 + 2] = 0;
                
                // Store base positions for repulsion effect
                basePositions[particleIndex * 3] = x;
                basePositions[particleIndex * 3 + 1] = y;
                basePositions[particleIndex * 3 + 2] = 0;
                
                // Initialize repulsion offsets to zero
                repulsionOffsets[particleIndex * 3] = 0;
                repulsionOffsets[particleIndex * 3 + 1] = 0;
                repulsionOffsets[particleIndex * 3 + 2] = 0;
                
                const colorMatch = textColor.match(/\d+/g);
                if (colorMatch && colorMatch.length >= 3) {
                    // Use full color values for proper color appearance
                    colors[particleIndex * 3] = parseInt(colorMatch[0]) / 255;
                    colors[particleIndex * 3 + 1] = parseInt(colorMatch[1]) / 255;
                    colors[particleIndex * 3 + 2] = parseInt(colorMatch[2]) / 255;
                } else {
                    // Default white at full brightness
                    colors[particleIndex * 3] = 1;
                    colors[particleIndex * 3 + 1] = 1;
                    colors[particleIndex * 3 + 2] = 1;
                }
                
                particleIndex++;
            }
        }
        
        const particleGeometry = new window.THREE.BufferGeometry();
        particleGeometry.setAttribute('position', new window.THREE.Float32BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new window.THREE.Float32BufferAttribute(colors, 3));
        
        const svg = '<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="15" fill="white"/></svg>';
        const texture = new window.THREE.TextureLoader().load('data:image/svg+xml;base64,' + btoa(svg));
        
        const particleMaterial = new window.THREE.PointsMaterial({
            size: 1.5,
            sizeAttenuation: false,
            vertexColors: true,
            map: texture,
            transparent: true,
            opacity: 0.2,
            blending: window.THREE.AdditiveBlending,
            depthWrite: false
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
    });
}

document.addEventListener('DOMContentLoaded', () => {
    InitParticleMatrix(40);
});
