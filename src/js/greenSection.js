function animSectionsOnScroll() {
    document.querySelectorAll("[data-scroll='section']").forEach((section) => {
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: section,
                start: "top 90%",
                toggleActions: "play none none none",
            },
        });

        tl.fromTo(
            section,
            {
                borderTopLeftRadius: "0",
                borderTopRightRadius: "0",
            },
            {
                borderTopLeftRadius: cornerRadiusValue,
                borderTopRightRadius: cornerRadiusValue,
                duration: 1,
                ease: "power2.inOut",
            }
        );
    });
}



export { animSectionsOnScroll };
