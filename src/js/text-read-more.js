function initTextReadMore() {
  const textPreviews = document.querySelectorAll('.text-preview');
  
  textPreviews.forEach(textPreview => {
    let expandButton = textPreview.nextElementSibling;
    
    // Look for the expand button among the next siblings
    while (expandButton && !expandButton.classList.contains('text-preview-expand')) {
      expandButton = expandButton.nextElementSibling;
    }
    
    if (!expandButton) {
      console.warn('No sibling button with class "text-preview-expand" found for:', textPreview);
      return;
    }
    
    // Calculate and store the collapsed height
    const isAlreadyCollapsed = textPreview.classList.contains('collapsed');
    if (!isAlreadyCollapsed) {
      textPreview.classList.add('collapsed');
    }
    const collapsedHeight = textPreview.offsetHeight;
    textPreview.dataset.collapsedHeight = collapsedHeight + 'px';
    if (!isAlreadyCollapsed) {
      textPreview.classList.remove('collapsed');
    }
    
    expandButton.addEventListener('click', () => {
      const isCurrentlyCollapsed = textPreview.classList.contains('collapsed');
      
      if (isCurrentlyCollapsed) {
        // Expanding: Remove collapsed class first to get natural height, then animate
        textPreview.classList.remove('collapsed');
        const fullHeight = textPreview.scrollHeight;
        textPreview.style.height = 'auto';
        textPreview.style.overflow = 'hidden';
        
        gsap.fromTo(textPreview, 
          { height: textPreview.dataset.collapsedHeight },
          { 
            height: fullHeight,
            duration: 0.6,
            ease: "power2.inOut",
            onComplete: () => {
              textPreview.style.height = 'auto';
              textPreview.style.overflow = 'visible';
            }
          }
        );
        expandButton.textContent = 'Read Less';
      } else {
        // Collapsing: Animate to collapsed height, then add class
        const currentHeight = textPreview.offsetHeight;
        textPreview.style.height = currentHeight + 'px';
        textPreview.style.overflow = 'hidden';
        
        gsap.to(textPreview, {
          height: textPreview.dataset.collapsedHeight,
          duration: 0.6,
          ease: "power2.inOut",
          onComplete: () => {
            textPreview.classList.add('collapsed');
            textPreview.style.height = '';
            textPreview.style.overflow = '';
          }
        });
        expandButton.textContent = 'Read More';
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initTextReadMore();
});


