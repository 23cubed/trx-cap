
/* TRX Capital Bundle (Concatenated) - Built: 2025-07-07T03:05:01.690Z */
(function() {
  'use strict';
  
const splitTextInstances = [];

CustomEase.create("trx-ease", "M0,0 C0.83,0 0.17,1 1,1");

gsap.defaults({
  ease: "trx-ease",
  duration: 0.6,
  stagger: 0.01
});

function initSplitText() {
  document.querySelectorAll('[data-split="lines"]').forEach((el) => {
    const split = new SplitText(el, {
      type: "lines",
      linesClass: "split-line"
    });

    gsap.set(split.lines, { y: "100%" });

    split.lines.forEach((line) => {
      const wrapper = document.createElement("div");
      wrapper.classList.add("single-line-wrap");

      const inner = document.createElement("div");
      inner.classList.add("single-line");
      while (line.firstChild) {
        inner.appendChild(line.firstChild);
      }
      wrapper.appendChild(inner);
      line.replaceWith(wrapper);
    });
  });
}

function initTextScroll() {
  document.querySelectorAll('[data-reveal="scroll"]').forEach((element) => {
    const lines = element.querySelectorAll(".single-line");

    gsap.set(lines, { y: "100%" });

    gsap.fromTo(
      lines, { y: "100%" },
      {
        y: 0,
        stagger: 0.1,
        scrollTrigger: {
          trigger: element,
          start: "top 90%",
          once: true,
        },
        clearProps: "transform",
      },
    );
  });
}

function splitTextElement(element) {
  const split = new SplitText(element, {
    type: "lines",
    linesClass: "split-line"
  });

  gsap.set(split.lines, { y: "100%" });

  split.lines.forEach((line) => {
    const wrapper = document.createElement("div");
    wrapper.classList.add("single-line-wrap");

    const inner = document.createElement("div");
    inner.classList.add("single-line");
    while (line.firstChild) {
      inner.appendChild(line.firstChild);
    }
    wrapper.appendChild(inner);
    line.replaceWith(wrapper);
  });
  
  const lines = element.querySelectorAll(".single-line");
  gsap.set(lines, { y: "100%" });
}

function animateSplitText(element, duration = 0.6, ease = "trx-ease") {
  const lines = element.querySelectorAll(".single-line");
  
  if (lines.length === 0) return;
  
  gsap.set(lines, { y: "100%" });
  
  return gsap.fromTo(
    lines, { y: "100%" },
    {
      y: 0,
      stagger: 0.1,
      duration: duration,
      ease: ease,
      clearProps: "transform",
    },
  );
}

// Export functions for use in other modules
initSplitText();
initTextScroll();

document.addEventListener("DOMContentLoaded", () => {
    const wrapper = document.querySelector('.gsap_grid-wrapper');
    const shuttle = document.querySelector('.gsap_grid-shuttle');
    const gridItems = document.querySelectorAll('.portfolio_grid .portfolio_item-gsap-green');

    if (!wrapper || !shuttle || !gridItems.length) {
        return;
    }

    let isShuttleVisible = false;
    let hoverTimeout;


    function getOffset(el) {
        const rect = el.getBoundingClientRect();
        const wrapperRect = wrapper.getBoundingClientRect();
        return {
            top: rect.top - wrapperRect.top,
            left: rect.left - wrapperRect.left
        };
    }


    function moveShuttleTo(target, duration = 0.2) {
        const position = getOffset(target);
        gsap.to(shuttle, {
            x: position.left,
            y: position.top,
            duration: duration,
            ease: "power3.out"
        });
    }

    function fadeOutShuttle() {
        gsap.to(shuttle, {
            opacity: 0,
            duration: 0.1,
            ease: "power3.out",
            onComplete: () => {
                gsap.set(shuttle, {
                    x: 0,
                    y: 0
                });
                isShuttleVisible = false;
            }
        });
    }

    gridItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            clearTimeout(hoverTimeout);
            if (!isShuttleVisible) {
                const position = getOffset(item);
                gsap.set(shuttle, {
                    x: position.left,
                    y: position.top
                });
                gsap.to(shuttle, {
                    opacity: 0.1,
                    duration: 0.35,
                    ease: "power3.out"
                });
                isShuttleVisible = true;
            } else {
                moveShuttleTo(item);
            }
        });

        item.addEventListener('mouseleave', () => {
            hoverTimeout = setTimeout(fadeOutShuttle, 20);
        });
    });

    wrapper.addEventListener('mouseleave', fadeOutShuttle);
});

CustomEase.create("trx-ease", "M0,0 C0.83,0 0.17,1 1,1");

gsap.defaults({
  ease: "trx-ease",
});

  function initHeader() {
    const tl = gsap.timeline({ paused: true });
    const navBarBG = document.querySelectorAll("#navbar .background");     
    const navLogoCapSm = document.getElementById("navLogoCapSm");
    const navLogoCapLg = document.getElementById("navLogoCapLg");
    const TRXLogo = document.getElementById("TRxLogo");

    tl.fromTo(navBarBG, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "power2.out" }, 0);
        
    tl.to(navLogoCapSm, { y: "-105%", duration: 0.2 }, 0);
    tl.to(TRXLogo, { y: "0.4rem", duration: 0.4 }, 0);
    tl.to(TRXLogo, { scale: 0.7, duration: 0.4 }, 0);
    tl.to(navLogoCapLg, { x: "1%", duration: 0.2 }, 0.1);
    


  ScrollTrigger.create({
    trigger: document.body,
    start: "top -1px",
    animation: tl,
    toggleActions: "play none none reverse"
  });
}

window.Webflow ||= [];
window.Webflow.push(() => {
  initHeader();
});

function pageLoadScene() {
    const tl = gsap.timeline();
    const computedStyle = getComputedStyle(document.documentElement);
    const cornerRadiusValue = computedStyle.getPropertyValue('--block-system--corner-radius').trim();
    const negativeCornerRadius = `-${cornerRadiusValue}`;
    
    tl.addLabel("pageLoader", 0)
    .addLabel("heroAnimate", 0.4)
    .addLabel("heroContentAnimate", 0.75)
    .to(".page-loader", {
        opacity: 0,
        duration: 0.8,
        ease: "power4.out",
        onComplete: () => {
            gsap.set(".page-loader", { visibility: "hidden" });
        }
    }, "pageLoader")

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
            ease: "power2.inOut"
        },
        "heroAnimate"
    )
    /*.fromTo(".texture-bg.hero-anim", 
        { scale: 1.25 },
        { 
            scale: 1,
            duration: 2,
            ease: "power2.inOut"
        },
        "heroAnimate+=0.75"
    )
    .fromTo(".texture-bg.hero-anim", 
        { opacity: 0.2 },
        { 
            opacity: 0.5,
            duration: 1.5,
            ease: "power2.inOut"
        },
        "heroAnimate"
    )*/
    .fromTo(".navbar .nav-container",
        { opacity: 0, y: "3.25rem" },
        { 
            opacity: 1, 
            y: 0,
            duration: 0.8,
            ease: "power2.out"
        },
        "heroContentAnimate-=0.5"
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

document.addEventListener('DOMContentLoaded', function() {
    const heroHeading = document.querySelector("#heroHeading");
    if (heroHeading) {
        splitTextElement(heroHeading);
    }
    
    setTimeout(() => {
        console.log("Executing pageLoadScene");
        pageLoadScene();
    }, 200);
});

  
  console.log('TRX Capital concatenated bundle loaded successfully');
})();
      