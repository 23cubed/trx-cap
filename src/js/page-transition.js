barba.init({
    transitions: [{
      leave(data) {
        ScrollTrigger.killAll();
        gsap.killTweensOf("*");
        
        // Preserve scroll gutter during transition
        document.documentElement.style.overflowY = 'scroll';
        
        const cornerRadius = getComputedStyle(document.documentElement)
          .getPropertyValue('--block-system--corner-radius').trim();
        
        return gsap.timeline()
          .set('.transition-mask-v2', { overflow: 'hidden' })
          .set('.transition-cover', { display: 'block' })
          .to('.transition-mask-v2', {
            borderRadius: cornerRadius,
            top: cornerRadius,
            left: cornerRadius,
            right: cornerRadius,
            bottom: cornerRadius,
            duration: 0.6,
            ease: 'power2.inOut'
          })
          .to('.transition-cover', {
            opacity: 1,
            duration: 0.6,
            ease: 'linear'
          }, '-=0.6')
          .to('.transition', {
            height: '15vh',
            duration: 0.6,
            ease: 'power2.inOut'
          }, '-=0.3')
          .set(data.current.container, { display: 'none' });
      },
      enter(data) {
        return gsap.timeline()
          .set(data.next.container, { display: 'block' })
          .to('.transition', {
            height: '100vh',
            duration: 0.3,
            ease: 'power2.inOut'
          })
          .to('.transition-mask-v2', {
            borderRadius: '0rem',
            top: '0rem',
            left: '0rem',
            right: '0rem',
            bottom: '0rem',
            duration: 0.4,
            ease: 'power2.inOut'
          })
          .to('.transition-cover', {
            opacity: 0,
            duration: 0.3,
            ease: 'power2.inOut'
          }, '-=0')
          .set('.transition-mask-v2', { overflow: 'visible' })
          .set('.transition-cover', { display: 'none' })
          .call(() => {
            // Restore normal overflow after transition
            document.documentElement.style.overflowY = '';
          });
      }
    }]
  });
  