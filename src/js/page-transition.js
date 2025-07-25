import { setScrolled, initHeader } from './navbar.js';
import { initFormErrors } from './formErrors.js';
import { animateHeroCTA } from './hero.js';
import { initScrollingGutters } from './scrolling-gutters.js';

barba.init({
    transitions: [{
      leave(data) {
        ScrollTrigger.killAll();
        gsap.killTweensOf("*");
        
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
        if (data.next.namespace == 'home') {
          initHeader();
          initScrollingGutters();
        }
        if (data.next.namespace == 'contact') {
          initFormErrors();
        }
        
        const timeline = gsap.timeline({
          onComplete: () => {
            if (heroCTA) {
              animateHeroCTA();
            }
          }
        })
          .set(data.next.container, { display: 'block' })
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
      }
    }]
  });
  