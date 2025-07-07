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