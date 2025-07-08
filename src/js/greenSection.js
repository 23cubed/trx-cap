function animSectionsOnScroll() {
    const tl = gsap.timeline({
        scrollTrigger: {
          trigger: "#scroll",
          start: "top 90%",
          toggleActions: "play none none none",
        }
      });


    tl.fromTo(
        ".block_grid-scroll",
        {
            borderTopLeftRadius: "0",
            borderTopRightRadius: "0",
        },
        {
            borderTopLeftRadius: cornerRadiusValue,
            borderTopRightRadius: cornerRadiusValue,
            duration: 1,
            ease: "power2.inOut",
        },
    );
}

export { animSectionsOnScroll };
