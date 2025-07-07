gsap.defaults({
  ease: "trx-ease",
  duration: 0.6,
  stagger: 0.01
});

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

export { initTextScroll }; 