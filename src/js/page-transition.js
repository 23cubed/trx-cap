import { setScrolled, initNavbar } from './navbar.js';
import { initFormErrors } from './formErrors.js';
import { animateHeroCTA } from './hero.js';
import { initScrollingGutters } from '../exclude/scrolling-gutters.js';
import { initParticleHeroMeshMorph, disposeParticleHeroMeshMorph, pauseParticleHeroMeshMorph } from './particle-hero-mesh-morph.js';
import { InitParticleTexture } from './particle-texture.js';
import { initParticleIcon, disposeParticleIcons } from './particle-icons.js';
import { resetLoaderProgress, waitForByteCompletion } from './loader-progress.js';
import { disposeParticleTexture } from './particle-texture.js';

// Store target hash for cross-page anchor navigation
let targetHash = '';

// Handle anchor links to other pages
document.addEventListener('click', (event) => {
  const target = event.target.closest('a[href*="#"]');
  if (target) {
    const href = target.getAttribute('href');
    const [url, hash] = href.split('#');
    console.log('[ANCHOR DEBUG] Link clicked:', { href, url, hash, currentPath: window.location.pathname });
    
    // Store hash for cross-page navigation (when URL is different from current path or starts with /)
    if (hash && url && (url !== window.location.pathname || url.startsWith('/'))) {
      targetHash = hash;
      console.log('[ANCHOR DEBUG] Stored targetHash:', targetHash);
    } else {
      console.log('[ANCHOR DEBUG] Not storing hash - same page or invalid conditions');
    }
  }
});

barba.init({
    transitions: [{
      leave(data) {
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
        console.log('[ANCHOR DEBUG] Enter function called with data:', {
          targetHash,
          dataNextUrl: data?.next?.url,
          windowLocationHash: window.location.hash,
          currentPath: window.location.pathname
        });
        
        // Prioritize stored targetHash from cross-page navigation, then fallback to URL hash
        const anchorId = targetHash 
          ? targetHash
          : (data && data.next && data.next.url && data.next.url.hash)
            ? data.next.url.hash
            : (window.location.hash ? window.location.hash.replace('#','') : '');
        
        console.log('[ANCHOR DEBUG] Final anchorId:', anchorId);
        
        // Clear the stored hash after using it
        if (targetHash) {
          console.log('[ANCHOR DEBUG] Clearing targetHash');
          targetHash = '';
        }
        
        if (!anchorId) {
          console.log('[ANCHOR DEBUG] No anchorId, scrolling to top');
          window.scrollTo(0, 0);
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
        if (isHome) {
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
                requestAnimationFrame(() => {
                  setTimeout(() => {
                    try { InitParticleTexture(); } catch (e) {}
                    resolve();
                  });
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
              .call(() => { 
                try { 
                  if (anchorId) { 
                    const sel = `#${(window.CSS && window.CSS.escape) ? CSS.escape(anchorId) : anchorId}`;
                    console.log('[ANCHOR DEBUG] Looking for element with selector:', sel);
                    
                    const el = data.next.container.querySelector(sel) || document.getElementById(anchorId);
                    console.log('[ANCHOR DEBUG] Found element:', el);
                    console.log('[ANCHOR DEBUG] data.next.container:', data.next.container);
                    
                    if (el) {
                      console.log('[ANCHOR DEBUG] Scrolling to element:', el);
                      el.scrollIntoView({ behavior: 'auto', block: 'start' });
                    } else {
                      console.log('[ANCHOR DEBUG] Element not found for anchorId:', anchorId);
                    }
                  } else {
                    console.log('[ANCHOR DEBUG] No anchorId to scroll to');
                  }
                } catch (e) {
                  console.error('[ANCHOR DEBUG] Error in scroll section:', e);
                } 
              })
              .call(() => { try { requestAnimationFrame(() => requestAnimationFrame(() => ScrollTrigger.refresh())); } catch (e) {} })
              .call(() => {
                try {
                  const wf = window.Webflow;
                  if (wf && typeof wf.destroy === 'function') wf.destroy();
                  if (wf && typeof wf.ready === 'function') wf.ready();
                  const ix2 = wf && wf.require ? wf.require('ix2') : null;
                  if (ix2 && typeof ix2.init === 'function') ix2.init();
                  document.dispatchEvent(new Event('readystatechange'));
                } catch (e) {}
              })
              .call(() => ScrollTrigger.refresh())
              .call(() => new Promise(resolve => setTimeout(resolve, 100)))
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
  