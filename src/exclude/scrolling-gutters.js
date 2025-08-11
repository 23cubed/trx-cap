CustomEase.create("trx-ease", "M0,0 C0.83,0 0.17,1 1,1");

function initScrollingGutters() {
    const gutterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.dataset.scrollTriggerInitialized) {
                const element = entry.target;
                const targetWidth = element.dataset.scrollingGutter;
                const duration = element.dataset.scrollingDuration;
                
                let endTrigger;
                if (duration) {
                    if (duration.includes('vh')) {
                        const vhValue = parseFloat(duration);
                        const pixelValue = (vhValue / 100) * window.innerHeight;
                        endTrigger = `+=${pixelValue}`;
                    } else if (duration.includes('%')) {
                        endTrigger = duration + ' top';
                    } else {
                        endTrigger = `+=${duration}`;
                    }
                } else {
                    endTrigger = 'bottom top';
                }
                
                gsap.to(element, {
                    width: targetWidth,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: element,
                        start: 'top bottom',
                        end: endTrigger,
                        scrub: true
                    }
                });
                
                element.dataset.scrollTriggerInitialized = 'true';
                gutterObserver.unobserve(element);
            }
        });
    });
    
    const textObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const textElement = entry.target;
            const chars = textElement.querySelectorAll(".char");
            
            if (entry.intersectionRatio === 1) {
                textElement.dataset.wasFullyVisible = 'true';
                gsap.fromTo(chars, 
                    { y: "100%" },
                    {
                        y: 0,
                        stagger: 0.02,
                        duration: 0.6,
                        ease: "trx-ease",
                        clearProps: "transform"
                    }
                );
            } else if (entry.intersectionRatio < 1 && textElement.dataset.wasFullyVisible === 'true') {
                textElement.dataset.wasFullyVisible = 'false';
                gsap.to(chars, {
                    y: "100%",
                    stagger: 0.02,
                    duration: 0.6,
                    ease: "trx-ease"
                });
            }
        });
    }, {
        threshold: [0, 1]
    });
    
    function splitTextByChars(element) {
        const split = new SplitText(element, {
            type: "chars",
            charsClass: "char"
        });
        
        gsap.set(split.chars, { y: "100%" });
        
        split.chars.forEach((char) => {
            const wrapper = document.createElement("div");
            wrapper.style.overflow = "hidden";
            wrapper.style.display = "inline-block";
            wrapper.style.paddingRight = "0.2em";
            wrapper.style.marginRight = "-0.2em";
            char.parentNode.insertBefore(wrapper, char);
            wrapper.appendChild(char);
        });
    }
    
    document.querySelectorAll('[data-scrolling-gutter]').forEach(element => {
        gutterObserver.observe(element);
        
        element.querySelectorAll('[data-text-reveal-at]').forEach(textEl => {
            splitTextByChars(textEl);
            textObserver.observe(textEl);
        });
    });
}

export { initScrollingGutters };
  

  