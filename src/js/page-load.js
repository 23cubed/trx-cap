function pageLoader() {
    const tl = gsap.timeline();
    
    tl.to(".page-loader", {
        opacity: 0,
        duration: 0.8,
        delay: 0.2,
        ease: "power4.out",
        onComplete: () => {
            gsap.set(".page-loader", { visibility: "hidden" });
        }
    });
    
    return tl;
}

export { pageLoader };
