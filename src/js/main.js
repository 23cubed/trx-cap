// Auto-generated imports - DO NOT EDIT MANUALLY
// Run 'npm run generate-imports' to update

import './hero.js';
import './navbar.js';
import './split-text.js';

// Expose CDN URL function with static build reference
window.TRXCap = window.TRXCap || {};
window.TRXCap.getCDNUrl = function() {
    return 'https://cdn.jsdelivr.net/gh/23cubed/trx-cap@c0d7a45/dist/main.js';
};
window.TRXCap.getBuildId = function() {
    return 'c0d7a45';
};
window.TRXCap.getBuildTime = function() {
    return '2025-07-07T03:57:34.687Z';
};
window.TRXCap.loadDynamically = function() {
    const script = document.createElement('script');
    script.src = window.TRXCap.getCDNUrl();
    script.onload = () => console.log('🚀 TRX Cap bundle loaded dynamically!');
    document.head.appendChild(script);
    return script;
};
