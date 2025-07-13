import { initHero } from './hero.js';
import { initHeader } from './navbar.js';
import { initScrollingGutters } from './scrolling-gutters.js';
import { initTextScroll } from './split-text-on-scroll.js';
import { initSplitText } from './split-text.js';
import { initFormErrors } from './formErrors.js';

function pageTransitionOut(data) {
    const tl = gsap.timeline();
    const header = document.querySelector("#navbar");
    
    const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    gsap.set(data.next.container, {
        position: "absolute",
        top: currentScrollTop, 
        left: 0,
        width: "100%",
        height: "0vh",
        overflow: "hidden",
        scale: 0.98,
        borderRadius: "1rem",
        zIndex: 1000,
    });
    
    const fullHeight = data.next.container.scrollHeight;
    
    tl.to(data.next.container, {
        height: fullHeight,
        scale: 1,
        borderRadius: "0rem",
        duration: 0.8,
        onUpdate: () => {
            data.next.container.style.overflow = "hidden";
        },
        onComplete: () => {
            gsap.set(data.next.container, {
                position: "static",
                top: "auto",
                left: "auto",
                width: "auto",
                height: "auto",
                overflow: "auto",
                zIndex: "auto"
            });
        }
    });
    
    tl.to(header, {
        opacity: 1,
        duration: 0.4,
    }, 0);
    
    return tl;
}

function pageTransitionOutAlternative(data) {
    const tl = gsap.timeline();
    const header = document.querySelector("#navbar");
    
    const viewport = {
        top: window.pageYOffset || document.documentElement.scrollTop,
        height: window.innerHeight
    };
    
    gsap.set(data.next.container, {
        position: "fixed", 
        top: 0,
        left: 0,
        width: "100vw",
        height: "0vh",
        overflow: "hidden",
        scale: 0.98,
        borderRadius: "1rem",
        zIndex: 1000,
    });
    
    const fullHeight = data.next.container.scrollHeight;
    
    tl.to(data.next.container, {
        height: "100vh", 
        scale: 1,
        borderRadius: "0rem",
        duration: 0.8,
        onUpdate: () => {
            data.next.container.style.overflow = "hidden";
        },
        onComplete: () => {
            gsap.set(data.next.container, {
                position: "static",
                top: "auto",
                left: "auto",
                width: "auto",
                height: "auto",
                overflow: "auto",
                zIndex: "auto"
            });
            
            window.scrollTo(0, 0);
        }
    });
    
    tl.to(header, {
        opacity: 1,
        duration: 0.4,
    }, 0);
    
    return tl;
}

function initPageTransitionsImproved() {
    async function handleLeaveTransition(data) {
        return pageTransitionIn(data);
    }

    async function handleEnter(data) {
        return pageTransitionOut(data);
    }

    barba.hooks.leave(() => {
        killAllScrollTriggers();
        document.body.style.overflow = 'hidden';
    });

    barba.hooks.after(() => {
        reinitializeAllScripts();
        document.body.style.overflow = 'auto';
    });

    barba.init({
        transitions: [{
            name: 'trx-transition',
            timeout: 7000,
            once(data) {
                document.fonts.ready.then(function () {
                    reinitializeAllScripts();
                })
            },
            leave(data) {
                return handleLeaveTransition(data);
            },
            enter(data) {
                return handleEnter(data);
            },
            afterEnter(data) {
                initResetWebflow(data);
                window.scrollTo(0, 0);
            }
        }],
        views: [{
            namespace: 'contact',
            beforeEnter(data) {
                console.log('initFormErrors');
                initFormErrors();
            }
        }]
    });
}

initPageTransitions();
