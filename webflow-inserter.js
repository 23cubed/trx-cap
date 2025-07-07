// TRX Cap Auto-Inserter - Always loads latest commit
// Repo: 23cubed/trx-cap

function insertTRXCapScript() {
    if (document.querySelector('script[src*="cdn.jsdelivr.net/gh/23cubed/trx-cap"]')) {
        console.log('🚀 TRX Cap script already loaded');
        return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/gh/23cubed/trx-cap/dist/main.js';
    script.async = true;
    script.onload = () => console.log('🚀 TRX Cap loaded (latest version)');
    script.onerror = () => console.error('❌ Failed to load TRX Cap script');
    document.head.appendChild(script);
}

// Auto-insert when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', insertTRXCapScript);
} else {
    insertTRXCapScript();
}