import { initHero } from './hero.js';
import { initHeader } from './navbar.js';
import { initScrollingGutters } from './scrolling-gutters.js';
import { initTextScroll } from './split-text-on-scroll.js';
import { initSplitText } from './split-text.js';
import { initFormErrors } from './formErrors.js';

// Animation - Page Leave
function pageTransitionIn(data) {
    const tl = gsap.timeline();
    const header = document.querySelector("#navbar");
    const rect = data.current.container.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    gsap.set(data.current.container, {
        position: "absolute",
        top: rect.top + scrollTop,
        left: rect.left,
        width: rect.width + "px",
        zIndex: 1000,
    });

    tl.to(data.current.container, {
        scale: 0.98,
        overflow: "hidden",
        height: 1,
        duration: 0.8,
        borderRadius: "1rem",
    }, 0);

    tl.to(data.current.container, {
        height: 0,
        duration: 0.8,
    });

    tl.to(header, {
        opacity: 0,
        duration: 0.4,
    }, 0);

    return tl;
}

// Animation - Page Enter
function pageTransitionOut(data) {
    const tl = gsap.timeline();
    const header = document.querySelector("#navbar");

    gsap.set(data.next.container, {
        height: "0vh",
        overflow: "hidden",
        scale: 0.98,
        borderRadius: "1rem",
    }, 0);

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
            data.next.container.style.height = "auto";
            data.next.container.style.overflow = "auto";
        }
    });

    tl.to(header, {
        opacity: 1,
        duration: 0.4,
    }, 0);

    return tl;
}

function initResetWebflow(data) {
    let parser = new DOMParser();
    let dom = parser.parseFromString(data.next.html, "text/html");
    let webflowPageId = dom.querySelector("html").getAttribute("data-wf-page");
    document.documentElement.setAttribute("data-wf-page", webflowPageId);
    window.Webflow.destroy();
    window.Webflow.ready();
    window.Webflow.require("ix2").init();
}

function reinitializeAllScripts() {
    initSplitText();
    initTextScroll();
    initHeader();
    initScrollingGutters();
    initHero();
}

function killAllScrollTriggers() {
    if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.killAll();
    }
}

function initPageTransitions() {

    async function handleLeaveTransition(data) {
        return pageTransitionIn(data);
    }

    async function handleEnter(data) {
        return pageTransitionOut(data);
    }

    barba.hooks.leave(() => {
        killAllScrollTriggers();
    });

    barba.hooks.after(() => {
        reinitializeAllScripts();
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
