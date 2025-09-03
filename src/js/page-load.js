import { InitParticleTexture } from './particle-texture.js';

async function pageLoader() {
    // Initialize texture if canvas exists
    const hasTextureCanvas = !!document.querySelector('canvas.particle-texture');
    if (hasTextureCanvas) {
        await new Promise((resolve) => {
            requestAnimationFrame(() => {
                setTimeout(() => {
                    try { InitParticleTexture(); } catch (e) {}
                    resolve();
                });
            });
        });
    }
    
    // Create and return the loader timeline
    const tl = gsap.timeline();
    
    tl.to(".page-loader", {
        opacity: 0,
        duration: 0.8,
        delay: 0.2,
        ease: "power4.out",
        onComplete: () => {
            gsap.set(".page-loader", { visibility: "hidden" });
        }
    });
    
    return tl;
}

export { pageLoader };
