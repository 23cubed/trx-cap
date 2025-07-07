import { initHero } from './hero.js';
import { initHeader } from './navbar.js';
import { initScrollingGutters } from './scrolling-gutters.js';
import { initTextScroll } from './split-text-on-scroll.js';
import { initSplitText } from './split-text.js';

// Animation - Page Leave
function pageTransitionIn(data) {
    const tl = gsap.timeline();

    tl.to(data.current.container, {
        scale: 0.98,
        overflow: "hidden",
        height: "100vh",
        duration: 0.8,
        borderRadius: "1rem",
    });

    tl.to(data.current.container, {
        height: "0vh",
        duration: 0.8,
    });

    return tl;
}

// Animation - Page Enter
function pageTransitionOut(data) {
    const tl = gsap.timeline();

    gsap.set(data.next.container, {
        height: "0vh",
        overflow: "hidden",
        scale: 0.98,
        borderRadius: "1rem",
    });

    tl.to(data.next.container,{
        height: "auto",
        overflow: "auto",
        scale: 1,
        borderRadius: "0rem",
        duration: 0.8,
    });

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
            leave(data) {
                return handleLeaveTransition(data);
            },
            enter(data) {
                return handleEnter(data);
            },
            afterEnter(data) {
                initResetWebflow(data);
            }
        }]
    });
}

initPageTransitions();
