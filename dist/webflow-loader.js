(function() {
    'use strict';
    
    // TRX Cap Webflow Loader v1.0
    // This script automatically loads the latest version of TRX Cap assets
    
    const CDN_BASE = 'https://cdn.jsdelivr.net/gh/23cubed/trx-cap@';
    const MANIFEST_URL = CDN_BASE + 'main/dist/version-manifest.json';
    const FALLBACK_URL = CDN_BASE + 'main/dist/main.js';
    
    function loadScript(url, callback) {
        const script = document.createElement('script');
        script.src = url;
        script.onload = callback;
        script.onerror = function() {
            console.warn('🔥 TRX Cap: Failed to load', url);
            if (callback) callback(new Error('Failed to load script'));
        };
        document.head.appendChild(script);
    }
    
    function loadMainScript() {
        console.log('📡 TRX Cap: Loading version manifest...');
        
        fetch(MANIFEST_URL)
            .then(response => {
                if (!response.ok) throw new Error('Manifest not found');
                return response.json();
            })
            .then(manifest => {
                console.log('✅ TRX Cap: Manifest loaded, version:', manifest.version);
                console.log('🚀 TRX Cap: Loading main script...');
                
                loadScript(manifest.mainJsUrl, function(error) {
                    if (error) {
                        console.warn('⚠️  TRX Cap: Trying fallback URL...');
                        loadScript(FALLBACK_URL, function(fallbackError) {
                            if (fallbackError) {
                                console.error('❌ TRX Cap: All loading attempts failed');
                            } else {
                                console.log('✅ TRX Cap: Fallback loaded successfully');
                            }
                        });
                    } else {
                        console.log('✅ TRX Cap: Main script loaded successfully');
                    }
                });
            })
            .catch(error => {
                console.warn('⚠️  TRX Cap: Manifest fetch failed, using fallback');
                loadScript(FALLBACK_URL, function(fallbackError) {
                    if (fallbackError) {
                        console.error('❌ TRX Cap: Fallback loading failed');
                    } else {
                        console.log('✅ TRX Cap: Fallback loaded successfully');
                    }
                });
            });
    }
    
    // Load when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadMainScript);
    } else {
        loadMainScript();
    }
})();