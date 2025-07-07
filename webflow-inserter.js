// TRX Cap Auto-Inserter - Always loads latest commit
// Repo: 23cubed/trx-cap

function insertTRXCapScript() {
    // Check for existing scripts and their status
    const existingScripts = document.querySelectorAll('script[src*="cdn.jsdelivr.net/gh/23cubed/trx-cap"]');
    
    if (existingScripts.length > 0) {
        console.log('🔍 Found existing TRX Cap scripts:', Array.from(existingScripts).map(s => s.src));
        
        // Check if our modules actually loaded by looking for the confirmation
        const checkLoaded = () => {
            const scripts = document.querySelectorAll('script');
            let foundModuleLog = false;
            
            // Give it a moment to load and execute
            setTimeout(() => {
                // If we don't see evidence of successful loading, force reload
                if (!window.TRXCapLoaded) {
                    console.warn('⚠️ TRX Cap script found but not working, reloading...');
                    loadScript();
                } else {
                    console.log('✅ TRX Cap is working correctly');
                }
            }, 1000);
        };
        
        checkLoaded();
        return;
    }
    
    loadScript();
}

function loadScript() {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/gh/23cubed/trx-cap/dist/main.js';
    script.async = true;
    script.onload = () => {
        console.log('🚀 TRX Cap loaded (latest version)');
        window.TRXCapLoaded = true;
    };
    script.onerror = () => console.error('❌ Failed to load TRX Cap script');
    document.head.appendChild(script);
}

// Auto-insert when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', insertTRXCapScript);
} else {
    insertTRXCapScript();
}