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
            top: negativeCornerRadius,
            left: negativeCornerRadius,
            right: negativeCornerRadius,
            borderTopLeftRadius: "0",
            borderTopRightRadius: "0",
        },
        {
            top: "0rem",
            left: "0rem",
            right: "0rem",
            borderTopLeftRadius: cornerRadiusValue,
            borderTopRightRadius: cornerRadiusValue,
            duration: 1,
            ease: "power2.inOut",
        },
    );
}

export { animSectionsOnScroll };
