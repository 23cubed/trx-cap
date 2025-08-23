// Hero animation module - handles page load animations and hero section
// Test comment for pre-commit workflow
// Testing single pre-commit hook execution
// Quick test comment for workflow
// Testing new build in pre-commit
import { splitTextElement, animateSplitText } from './split-text.js';
import { initParticleHeroMeshMorph } from './particle-hero-mesh-morph.js';
import { InitParticleTexture } from './particle-texture.js';
import { initParticleIcon } from './particle-icons.js';
import { resetLoaderProgress, subscribeToLoaderProgress } from './loader-progress.js';

function animateHeroCTA() {
    const tl = gsap.timeline();

    tl.fromTo("#hero .hero-cta",
        { opacity: 0 },
        {
            opacity: 1,
            duration: 0.5,
            ease: "power2.out"
        }
    )
        .fromTo("#hero .hero-cta",
            { flexGrow: 0 },
            {
                flexGrow: 1,
                duration: 0.6,
                ease: "power2.out"
            }
        )

    return tl;
}

function pageLoadScene() {
    const tl = gsap.timeline();
    const computedStyle = getComputedStyle(document.documentElement);
    const cornerRadiusValue = computedStyle.getPropertyValue('--block-system--corner-radius').trim();
    const negativeCornerRadius = `-${cornerRadiusValue}`;
    gsap.set('.page-loader', { display: 'none' });
    tl.addLabel("heroAnimate", 0)
        .addLabel("heroContentAnimate", 0.35)

        .fromTo("#heroBG",
            {
                top: negativeCornerRadius,
                left: negativeCornerRadius,
                right: negativeCornerRadius,
                borderTopLeftRadius: "0",
                borderTopRightRadius: "0"
            },
            {
                top: "0rem",
                left: "0rem",
                right: "0rem",
                borderTopLeftRadius: cornerRadiusValue,
                borderTopRightRadius: cornerRadiusValue,
                duration: 1,
                ease: "power2.inOut"
            },
            "heroAnimate"
        )
        .fromTo("#hero .clip-corner",
            { borderRadius: "0" },
            {
                borderRadius: cornerRadiusValue,
                duration: 1,
                ease: "power2.inOut"
            },
            "heroAnimate"
        )
        .fromTo("#blockMaskLeft",
            {
                marginLeft: negativeCornerRadius,
                borderTopRightRadius: "0"
            },
            {
                marginLeft: "0rem",
                borderTopRightRadius: cornerRadiusValue,
                duration: 1,
                ease: "power2.inOut"
            },
            "heroAnimate"
        )
        .fromTo("#blockMaskRight",
            {
                marginRight: negativeCornerRadius,
                borderTopLeftRadius: "0"
            },
            {
                marginRight: "0rem",
                borderTopLeftRadius: cornerRadiusValue,
                duration: 1,
                ease: "power2.inOut"
            },
            "heroAnimate"
        )
        .fromTo("#heroContent",
            { height: "100vh" },
            {
                height: "auto",
                duration: 1,
                ease: "power2.inOut"
            },
            "heroAnimate"
        )
        .fromTo(".navbar",
            { marginLeft: "0rem", marginRight: "0rem", marginTop: "0rem" },
            {
                marginLeft: cornerRadiusValue,
                marginRight: cornerRadiusValue,
                marginTop: cornerRadiusValue,
                duration: 1,
                ease: "power4.out"
            },
            "heroAnimate-=0.2"
        )
        .fromTo(".navbar .nav-container",
            { opacity: 0, y: "2.5rem" },
            {
                opacity: 1,
                y: 0,
                duration: 1,
                ease: "power2.out"
            },
            "heroAnimate"
        )
        .call(() => {
            const heroHeading = document.querySelector("#heroHeading");
            if (heroHeading) {
                animateSplitText(heroHeading, 1);
            }
        }, null, "heroContentAnimate")
        .fromTo("#hero .hero-cta",
            { opacity: 0 },
            {
                opacity: 1,
                duration: 0.8,
                ease: "power2.out"
            },
            "heroContentAnimate+=0.5"
        )
        .fromTo("#hero .hero-cta",
            { flexGrow: 0 },
            {
                flexGrow: 1,
                duration: 0.6,
                ease: "power2.out"
            },
            "heroContentAnimate+=0.8"
        )
        .fromTo("#hero .hero-cta_text-mask",
            { width: 0 },
            {
                width: "auto",
                duration: 0.5,
                ease: "power2.out"
            },
            "heroContentAnimate+=1.0"
        );
}

function showLoader() {
    const counter = document.querySelector('.counter');
    gsap.set(".loader", { display: "flex", autoAlpha: 1 });
    if (counter) counter.textContent = `0%`;
}

function hideLoader() {
    return gsap.to('.loader', {
        autoAlpha: 0,
        duration: 0.8,
        ease: "power4.out",
        onComplete: () => {
            const loader = document.querySelector('.loader');
            if (loader) loader.remove();
        }
    });
}

function initHero() {
    const heroHeading = document.querySelector("#heroHeading");

    if (heroHeading) {
        splitTextElement(heroHeading);
    }

    resetLoaderProgress();
    showLoader();

    const counter = document.querySelector('.counter');
    let sawAnyResource = false;
    let targetPercent = 0;
    let displayedPercent = 0;
    let stepTimer = null;
    const updateCounter = (val) => { if (counter) counter.textContent = `${val}%`; };
    updateCounter(0);
    const bytesDonePromise = new Promise((resolve) => {
        const tryResolve = () => {
            if (displayedPercent >= 100 && targetPercent >= 100) {
                setTimeout(() => resolve(), 250);
            }
        };
        const startStepper = () => {
            if (stepTimer) return;
            stepTimer = setInterval(() => {
                if (displayedPercent < targetPercent) {
                    displayedPercent += 1;
                    updateCounter(displayedPercent);
                    if (displayedPercent >= 100) {
                        clearInterval(stepTimer);
                        stepTimer = null;
                        tryResolve();
                    }
                }
            }, 6);
        };
        const unsubscribe = subscribeToLoaderProgress((percent) => {
            sawAnyResource = true;
            targetPercent = Math.max(targetPercent, Math.min(100, percent));
            startStepper();
            if (targetPercent >= 100) {
                tryResolve();
            }
        });
        setTimeout(() => { if (!sawAnyResource) { unsubscribe(); resolve(); } }, 50);
    });

    const initPromises = Promise.allSettled([
        initParticleHeroMeshMorph(),
        InitParticleTexture(),
        initParticleIcon('healthcare-tech-canvas', { r: 0.451, g: 0.451, b: 0.451 }, null, false),
        initParticleIcon('biotech-canvas', { r: 0.451, g: 0.451, b: 0.451 }, null, false)
    ]);

    Promise.all([bytesDonePromise, initPromises]).then(() => {
        hideLoader().then(() => pageLoadScene());
    }).catch(() => {
        hideLoader().then(() => pageLoadScene());
    });
}

export { initHero, animateHeroCTA };
