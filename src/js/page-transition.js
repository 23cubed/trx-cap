import { setScrolled, initNavbar } from './navbar.js';
import { initFormErrors } from './formErrors.js';
import { animateHeroCTA } from './hero.js';
import { initScrollingGutters } from '../exclude/scrolling-gutters.js';
import { initParticleHeroMeshMorph, disposeParticleHeroMeshMorph } from './particle-hero-mesh-morph.js';
import { InitParticleTexture } from './particle-texture.js';
import { initParticleIcon, disposeParticleIcons } from './particle-icons.js';
import { resetLoaderProgress, waitForByteCompletion } from './loader-progress.js';
import { disposeParticleTexture } from './particle-texture.js';

barba.init({
    transitions: [{
      leave(data) {
        console.log('[barba] leave:start', { current: data && data.current && data.current.namespace, next: data && data.next && data.next.namespace });
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
          .set(data.current.container, { display: 'none' })
          .call(() => console.log('[barba] leave:timeline_complete'));
      },
      enter(data) {
        console.log('[barba] enter:start', { next: data && data.next && data.next.namespace, url: data && data.next && data.next.url && data.next.url.path });
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
        console.log('[barba] enter:namespace', { isHome });
        if (isHome) {
          initNavbar();
          //initScrollingGutters();
        }
        if (data.next.namespace == 'contact') {
          initFormErrors();
        }

        if (isHome) {
          resetLoaderProgress();
          console.log('[barba] enter:progress_reset');
        }

        const waitForParticles = isHome
          ? Promise.allSettled([
              initParticleHeroMeshMorph(),
              initParticleIcon('healthcare-tech-canvas', { r: 0.451, g: 0.451, b: 0.451 }, null, false),
              initParticleIcon('biotech-canvas', { r: 0.451, g: 0.451, b: 0.451 }, null, false)
            ]).then((r) => { console.log('[barba] enter:particles_settled', r); return r; })
              .catch((e) => { console.error('[barba] enter:particles_error', e); throw e; })
          : Promise.resolve();

        const waitForBytes = isHome ? waitForByteCompletion(50).then(() => { console.log('[barba] enter:bytes_complete'); }) : Promise.resolve();

        const ready = isHome ? Promise.all([waitForParticles, waitForBytes]) : waitForParticles;
        if (isHome) console.log('[barba] enter:waiting_ready');

        return ready.then(() => {
          console.log('[barba] enter:ready');
          const timeline = gsap.timeline({
            onComplete: () => {
              if (heroCTA) {
                animateHeroCTA();
              }
              console.log('[barba] enter:timeline_complete');
            }
          })
            .set(data.next.container, { display: 'block' })
            .call(() => { try { if (isHome) InitParticleTexture(); } catch (e) { console.error('[barba] enter:InitParticleTexture error', e); } })
            .call(() => {
              if (window.Webflow && window.Webflow.require) {
                window.Webflow.require('ix2').init();
              }
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
        }).catch((e) => {
          console.error('[barba] enter:error', e);
          throw e;
        });
      }
    }]
  });
  