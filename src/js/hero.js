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
        pageLoadScene();
    }, 200);
});
