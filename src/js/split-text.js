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

export { splitTextElement, animateSplitText, initSplitText };