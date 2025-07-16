function initParticleField() {
    var canvas = document.querySelector('#texture-canvas');
    
    // Check if canvas exists
    if (!canvas) {
        console.error('Canvas element with id "texture-canvas" not found. Make sure you have <canvas id="texture-canvas"></canvas> in your HTML.');
        return;
    }
    
    var width = canvas.offsetWidth,
        height = canvas.offsetHeight;

    var renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: true
    });

    renderer.setPixelRatio(window.devicePixelRatio > 1 ? 2 : 1);
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);

    var scene = new THREE.Scene();

    var camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 2000);
    camera.position.set(0, 0, 80);

    // Create SVG circle as data URL for crisp dots
    var svgString = `
        <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="15" fill="white"/>
        </svg>
    `;
    var svgDataUrl = 'data:image/svg+xml;base64,' + btoa(svgString);
    
    var loader = new THREE.TextureLoader();
    var dotTexture = loader.load(svgDataUrl);

    var radius = 50;
    var sphereGeom = new THREE.IcosahedronGeometry(radius, 5);
    var dotsGeom = new THREE.Geometry();
    var bufferDotsGeom = new THREE.BufferGeometry();
    var positions = new Float32Array(sphereGeom.vertices.length * 3);
    for (var i = 0;i<sphereGeom.vertices.length;i++) {
        var vector = sphereGeom.vertices[i];
        animateDot(i, vector);
        dotsGeom.vertices.push(vector);
        vector.toArray(positions, i * 3);
    }

    function animateDot(index, vector) {
            gsap.to(vector, {
                duration: 4,
                x: 0,
                z: 0,
                ease: "back.out",
                delay: Math.abs(vector.y/radius) * 2,
                repeat: -1,
                yoyo: true,
                yoyoEase: "back.out",
                onUpdate: function () {
                    updateDot(index, vector);
                }
            });
    }
    function updateDot(index, vector) {
            positions[index*3] = vector.x;
            positions[index*3+2] = vector.z;
    }

    var attributePositions = new THREE.BufferAttribute(positions, 3);
    bufferDotsGeom.addAttribute('position', attributePositions);
    var shaderMaterial = new THREE.ShaderMaterial({
        uniforms: {
            texture: {
                value: dotTexture
            }
        },
        vertexShader: `
            varying vec3 vPosition;
            void main() {
                vPosition = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                gl_PointSize = 1.0;
            }
        `,
        fragmentShader: `
            uniform sampler2D texture;
            varying vec3 vPosition;
            void main() {
                vec4 textureColor = texture2D(texture, gl_PointCoord);
                gl_FragColor = vec4(1.0, 1.0, 1.0, textureColor.a);
            }
        `,
        transparent: true
    });
    var dots = new THREE.Points(bufferDotsGeom, shaderMaterial);
    scene.add(dots);

    function render(a) {
        dots.geometry.verticesNeedUpdate = true;
        dots.geometry.attributes.position.needsUpdate = true;
        renderer.render(scene, camera);
    }

    function onResize() {
        canvas.style.width = '';
        canvas.style.height = '';
        width = canvas.offsetWidth;
        height = canvas.offsetHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();  
        renderer.setSize(width, height);
    }

    var mouse = new THREE.Vector2(0.8, 0.5);
    function onMouseMove(e) {
        mouse.x = (e.clientX / window.innerWidth) - 0.5;
        mouse.y = (e.clientY / window.innerHeight) - 0.5;
        gsap.to(dots.rotation, {
            duration: 4,
            x: (mouse.y * Math.PI * 0.5),
            z: (mouse.x * Math.PI * 0.2),
            ease: "power1.out"
        });
    }

    gsap.ticker.add(render);
    window.addEventListener("mousemove", onMouseMove);
    var resizeTm;
    window.addEventListener("resize", function(){
        resizeTm = clearTimeout(resizeTm);
        resizeTm = setTimeout(onResize, 200);
    });
}

// Ensure DOM is loaded before running
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initParticleField);
} else {
    initParticleField();
}