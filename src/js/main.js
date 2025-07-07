// Auto-generated imports - DO NOT EDIT MANUALLY
// Run 'npm run generate-imports' to update

import './hero.js';
import './navbar.js';
import './split-text.js';

// Expose CDN URL function
window.TRXCap = window.TRXCap || {};
window.TRXCap.getCDNUrl = function() {
    return 'https://cdn.jsdelivr.net/gh/23cubed/trx-cap@df6f06b/dist/main.js';
};
window.TRXCap.getCommitHash = function() {
    return 'df6f06b';
};
window.TRXCap.loadDynamically = function() {
    const script = document.createElement('script');
    script.src = window.TRXCap.getCDNUrl();
    script.onload = () => console.log('🚀 TRX Cap bundle loaded dynamically!');
    document.head.appendChild(script);
    return script;
};
