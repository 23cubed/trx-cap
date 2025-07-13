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

function setScrolled() {
    const navBarBG = document.querySelectorAll("#navbar .background");     
    const navLogoCapSm = document.getElementById("navLogoCapSm");
    const navLogoCapLg = document.getElementById("navLogoCapLg");
    const TRXLogo = document.getElementById("TRxLogo");

    gsap.set(navBarBG, { opacity: 1 });
    gsap.set(navLogoCapSm, { y: "-105%" });
    gsap.set(TRXLogo, { y: "0.4rem", scale: 0.7 });
    gsap.set(navLogoCapLg, { x: "1%" });
}

export { initHeader, setScrolled };