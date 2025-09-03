function reinitialiseWebflow(data) {
  let parser = new DOMParser();
  let dom = parser.parseFromString(data.next.html, 'text/html');
  let webflowPageId = $(dom).find('html').attr('data-wf-page');

  $('html').attr('data-wf-page', webflowPageId);

  window.Webflow && window.Webflow.destroy();
  window.Webflow && window.Webflow.ready();
  
  window.Webflow && window.Webflow.require('ix2').init();
}

export { reinitialiseWebflow };
