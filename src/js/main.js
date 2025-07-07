// Auto-generated imports - DO NOT EDIT MANUALLY
// Run 'npm run generate-imports' to update

import './hero.js';
import './navbar.js';
import './split-text.js';

// Expose CDN URL function with static build reference
window.TRXCap = window.TRXCap || {};
window.TRXCap.getCDNUrl = function() {
    return 'https://cdn.jsdelivr.net/gh/23cubed/trx-cap@main/dist/main.js';
};
window.TRXCap.getBuildId = function() {
    return 'e4f297e';
};
window.TRXCap.getBuildTime = function() {
    return '2025-07-07T04:09:26.614Z';
};
window.TRXCap.loadDynamically = function() {
    const script = document.createElement('script');
    script.src = window.TRXCap.getCDNUrl();
    script.onload = () => console.log('🚀 TRX Cap bundle loaded dynamically!');
    document.head.appendChild(script);
    return script;
};

// Console log with timestamp for debugging
console.log('✅ Bundle loaded from:', window.TRXCap.getCDNUrl());
console.log('🏷️  Version:', window.TRXCap.getBuildId());
console.log('⏰ Build time:', window.TRXCap.getBuildTime());
console.log('🕐 Load time:', new Date().toISOString());
