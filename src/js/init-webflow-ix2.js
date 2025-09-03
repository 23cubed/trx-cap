function reinitialiseWebflow(data) {
  let parser = new DOMParser();
  let dom = parser.parseFromString(data.next.html, 'text/html');
  let webflowPageId = $(dom).find('html').attr('data-wf-page');

  $('html').attr('data-wf-page', webflowPageId);

  window.Webflow && window.Webflow.destroy();
  window.Webflow && window.Webflow.ready();
  
  // Wait 100ms before initializing IX2 and Finsweet attributes
  setTimeout(() => {
    window.Webflow && window.Webflow.require('ix2').init();
    
    // Reinitialize Finsweet attributes
    if (window.FinsweetAttributes && window.FinsweetAttributes.modules && window.FinsweetAttributes.modules.list) {
      window.FinsweetAttributes.modules.list.restart();
    }
  }, 100);
}

export { reinitialiseWebflow };
