import { setScrolled, initNavbar } from './navbar.js';
import { initFormErrors } from './formErrors.js';
import { animateHeroCTA } from './hero.js';
import { initScrollingGutters } from '../exclude/scrolling-gutters.js';
import { initParticleHeroMeshMorph, disposeParticleHeroMeshMorph, pauseParticleHeroMeshMorph } from './particle-hero-mesh-morph.js';
import { InitParticleTexture } from './particle-texture.js';
import { initParticleIcon, disposeParticleIcons } from './particle-icons.js';
import { resetLoaderProgress, waitForByteCompletion } from './loader-progress.js';
import { disposeParticleTexture } from './particle-texture.js';

barba.init({
    transitions: [{
      leave(data) {
        ScrollTrigger.killAll();
        gsap.killTweensOf("*");
        // Clean up morph renderer/listeners before DOM is swapped
        try { pauseParticleHeroMeshMorph(); } catch (e) {}
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
        window.scrollTo(0, 0);
        
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
                  }, 200);
                });
              });
            });
          })();

          return waitForTexture.then(() => {
            const timeline = gsap.timeline({
              onComplete: () => {
                if (heroCTA) {
                  animateHeroCTA();
                }
              }
            })
              .call(() => { try { if (isHome) requestAnimationFrame(() => requestAnimationFrame(() => initParticleHeroMeshMorph(data.next.container))); } catch (e) {} })
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
  