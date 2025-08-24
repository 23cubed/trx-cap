function safeInitFinsweet() {
    window.fsAttributes = window.fsAttributes || [];
    
    window.fsAttributes.push(['destroy']);
    window.fsAttributes.push(['init']);
  }
export {safeInitFinsweet};