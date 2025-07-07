// Auto-generated imports - DO NOT EDIT MANUALLY
// Run 'npm run generate-imports' to update

import './hero.js';
import './navbar.js';
import './split-text.js';

// Expose CDN URL function with static build reference
window.TRXCap = window.TRXCap || {};
window.TRXCap.getCDNUrl = function() {
    return 'https://cdn.jsdelivr.net/gh/23cubed/trx-cap@3da44be/dist/main.js';
};
window.TRXCap.getBuildId = function() {
    return '3da44be';
};
window.TRXCap.getBuildTime = function() {
    return '2025-07-07T03:58:46.545Z';
};
window.TRXCap.loadDynamically = function() {
    const script = document.createElement('script');
    script.src = window.TRXCap.getCDNUrl();
    script.onload = () => console.log('🚀 TRX Cap bundle loaded dynamically!');
    document.head.appendChild(script);
    return script;
};
