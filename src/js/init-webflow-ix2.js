import { initCopied } from './copied-message.js';

function reinitialiseWebflow(data) {
  let parser = new DOMParser();
  let dom = parser.parseFromString(data.next.html, 'text/html');
  let webflowPageId = $(dom).find('html').attr('data-wf-page');

  $('html').attr('data-wf-page', webflowPageId);

  window.Webflow && window.Webflow.destroy();
  window.Webflow && window.Webflow.ready();
  
  // Wait 100ms before initializing IX2 and Finsweet attributes
  setTimeout(() => {
    initCopied();
    window.Webflow && window.Webflow.require('ix2').init();
    
    // Reinitialize all required Finsweet attributes
    if (window.FinsweetAttributes && window.FinsweetAttributes.modules) {
      const modules = window.FinsweetAttributes.modules;
      
      // fs-list
      if (modules.list) {
        modules.list.restart();
      }
      
      // fs-readtime
      if (modules.readtime) {
        modules.readtime.restart();
      }
      
      // fs-inject
      if (modules.inject) {
        modules.inject.restart();
      }
      
      // fs-socialshare
      if (modules.socialshare) {
        modules.socialshare.restart();
      }
      
      // fs-copyclip
      if (modules.copyclip) {
        modules.copyclip.restart();
      }
      
      // fs-toc
      if (modules.toc) {
        modules.toc.restart();
      }
      
      // fs-scrolldisable
      if (modules.scrolldisable) {
        modules.scrolldisable.restart();
      }
    }
  }, 100);
}

export { reinitialiseWebflow };
