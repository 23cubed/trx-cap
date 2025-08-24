import { setScrolled, initNavbar } from './navbar.js';
import { initFormErrors } from './formErrors.js';
import { animateHeroCTA } from './hero.js';
import { initScrollingGutters } from '../exclude/scrolling-gutters.js';
import { initParticleHeroMeshMorph, disposeParticleHeroMeshMorph, pauseParticleHeroMeshMorph } from './particle-hero-mesh-morph.js';
import { InitParticleTexture } from './particle-texture.js';
import { initParticleIcon, disposeParticleIcons } from './particle-icons.js';
import { resetLoaderProgress, waitForByteCompletion } from './loader-progress.js';
import { disposeParticleTexture } from './particle-texture.js';

// Disable browser's automatic scroll restoration to prevent jumps on back button
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

// Store target hash for cross-page anchor navigation
let targetHash = '';

// Store scroll positions for back navigation
let scrollPositions = new Map();

// Handle anchor links to other pages
document.addEventListener('click', (event) => {
  const target = event.target.closest('a[href*="#"]');
  if (target) {
    const href = target.getAttribute('href');
    const [url, hash] = href.split('#');
    // Store hash for cross-page navigation (when URL is different from current path or starts with /)
    if (hash && url && (url !== window.location.pathname || url.startsWith('/'))) {
      targetHash = hash;
    }
  }
});

barba.init({
    transitions: [{
      leave(data) {
        // Store current scroll position for potential back navigation
        if (data && data.current && data.current.url) {
          scrollPositions.set(data.current.url.href, window.scrollY);
        }
        
        ScrollTrigger.killAll();
        gsap.killTweensOf("*");
        // Clean up morph renderer/listeners before DOM is swapped
        try { disposeParticleHeroMeshMorph(); } catch (e) {}
        try { disposeParticleTexture(); } catch (e) {}
        try { disposeParticleIcons(); } catch (e) {}
        
        return gsap.timeline()
          .set('.transition-cover', { display: 'block' })
          .to('.transition-v2', {
            top: '0rem',
            left: '0rem',
            right: '0rem',
            bottom: '0rem',
            duration: 0.6,
            ease: 'power2.inOut'
          })
          .to('.transition-sheet-bottom', {
            height: '80vh',
            duration: 0.6,
            ease: 'power2.inOut'
          }, '-=0.6')
          .to('.transition-cover', {
            opacity: 1,
            duration: 0.3,
            ease: 'linear'
          }, '-=0.3')
          .set(data.current.container, { display: 'none' });
      },
      enter(data) {
        // Check if this is back/forward navigation
        const isBackForward = data && data.trigger && (data.trigger === 'back' || data.trigger === 'popstate');
        const currentUrl = data && data.next && data.next.url ? data.next.url.href : window.location.href;
        const storedScrollPosition = scrollPositions.get(currentUrl);
        
        // For non-back navigation, scroll to top immediately to prevent browser restoration jump
        if (!isBackForward) {
          window.scrollTo(0, 0);
        }
        
        // Prioritize stored targetHash from cross-page navigation, then fallback to URL hash
        const anchorId = targetHash 
          ? targetHash
          : (data && data.next && data.next.url && data.next.url.hash)
            ? data.next.url.hash
            : (window.location.hash ? window.location.hash.replace('#','') : '');
        
        // Clear the stored hash after using it
        if (targetHash) {
          targetHash = '';
        }
        
        const heroCTA = document.querySelector("#hero .hero-cta");
        if (heroCTA) {
          gsap.set(heroCTA, { opacity: 0 });
        }

        const cornerRadius = getComputedStyle(document.documentElement)
          .getPropertyValue('--block-system--corner-radius').trim();
        const cornerRadiusValue = parseFloat(cornerRadius);
        
        if (data.next.namespace !== 'home') {
          setScrolled();
        }
        const isHome = data.next.namespace == 'home';
        const isPosts = data.next.namespace == 'posts';
        if (isHome || isPosts) {
          initNavbar();
          //initScrollingGutters();
        }
        if (data.next.namespace == 'contact') {
          initFormErrors();
        }

        if (isHome) {
          resetLoaderProgress();
        }

        const waitForParticles = isHome
          ? Promise.allSettled([
              initParticleIcon('healthcare-tech-canvas', { r: 0.451, g: 0.451, b: 0.451 }, null, false),
              initParticleIcon('biotech-canvas', { r: 0.451, g: 0.451, b: 0.451 }, null, false)
            ])
          : Promise.resolve();

        const waitForBytes = isHome ? waitForByteCompletion(50) : Promise.resolve();

        const ready = isHome ? Promise.all([waitForParticles, waitForBytes]) : waitForParticles;

        return ready.then(() => {
          gsap.set(data.next.container, { display: 'block' });

          const waitForTexture = (() => {
            const hasTextureCanvas = !!document.querySelector('canvas.particle-texture');
            if (!hasTextureCanvas) return Promise.resolve();
            return new Promise((resolve) => {
              requestAnimationFrame(() => {
                setTimeout(() => {
                  try { InitParticleTexture(); } catch (e) {}
                  resolve();
                });
              });
            });
          })();

          const waitForMorph = isHome ? initParticleHeroMeshMorph(data.next.container) : Promise.resolve();

          return Promise.all([waitForTexture, waitForMorph])
            .then(() => new Promise(function(resolve){ setTimeout(resolve, 100); }))
            .then(() => {
            const timeline = gsap.timeline({
              onComplete: () => {
                if (heroCTA) {
                  animateHeroCTA();
                }
              }
            })
              .call(() => { try { ScrollTrigger.refresh(); } catch (e) {} })
              .call(() => {
                try {
                  const wf = window.Webflow;
                  if (wf && typeof wf.destroy === 'function') wf.destroy();
                  if (wf && typeof wf.ready === 'function') wf.ready();
                  const ix2 = wf && wf.require ? wf.require('ix2') : null;
                  if (ix2 && typeof ix2.init === 'function') ix2.init();
                  document.dispatchEvent(new Event('readystatechange'));
                  
                  // Additional reset for home page interactions
                  if (isHome) {
                    requestAnimationFrame(() => {
                      // Force re-trigger webflow interactions for home page
                      if (wf && typeof wf.destroy === 'function') wf.destroy();
                      if (wf && typeof wf.ready === 'function') wf.ready();
                      if (ix2 && typeof ix2.init === 'function') ix2.init();
                      // Trigger resize event to reinitialize responsive interactions
                      window.dispatchEvent(new Event('resize'));
                    });
                  }
                } catch (e) {}
              })
              .call(() => ScrollTrigger.refresh())
              .call(() => { 
                try { 
                  // Handle scroll after all ScrollTrigger operations are complete
                  if (anchorId) { 
                    const sel = `#${(window.CSS && window.CSS.escape) ? CSS.escape(anchorId) : anchorId}`; 
                    const el = data.next.container.querySelector(sel) || document.getElementById(anchorId); 
                    if (el) el.scrollIntoView({ behavior: 'auto', block: 'start' }); 
                  } else if (isBackForward && typeof storedScrollPosition === 'number') {
                    // Restore previous scroll position for back navigation
                    window.scrollTo(0, storedScrollPosition);
                  } else {
                    // Default to top for new navigation
                    window.scrollTo(0, 0);
                  }
                } catch (e) {} 
              })
              .call(() => new Promise(resolve => setTimeout(resolve, 10)))
              .to('.transition-v2', {
                top: `-${cornerRadiusValue * 1.5}rem`,
                left: `-${cornerRadiusValue * 1.5}rem`,
                right: `-${cornerRadiusValue * 1.5}rem`,
                bottom: `-${cornerRadiusValue * 1.5}rem`,
                duration: 0.4,
                ease: 'power2.inOut'
              })
              .to('.transition-sheet-bottom', {
                height: `${cornerRadiusValue}rem`,
                duration: 0.4,
                ease: 'power2.inOut'
              }, '-=0.4')
              .to('.transition-cover', {
                opacity: 0,
                duration: 0.3,
                ease: 'power2.inOut'
              }, '-=0')
              .set('.transition-cover', { display: 'none' });
            return timeline;
          });
        });
      }
    }]
  });
  