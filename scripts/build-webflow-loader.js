const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function buildWebflowLoader() {
    console.log('🔧 Building Webflow loader system...');
    
    // Get version info - use different strategies for CI vs local
    let commitHash = '';
    let shortHash = '';
    const isCI = process.env.GITHUB_ACTIONS === 'true';
    
    if (isCI) {
        // In CI: Use actual commit hash for production versioning
        try {
            commitHash = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
            shortHash = commitHash.substring(0, 7);
            console.log(`📌 CI Commit: ${shortHash}`);
        } catch (error) {
            console.warn('⚠️  Could not get commit hash in CI');
            shortHash = Date.now().toString(36);
        }
    } else {
        // Local development: Use 'dev' version to avoid mismatches
        shortHash = 'dev';
        commitHash = 'development';
        console.log(`📌 Local Development Mode`);
    }
    
    // Create version manifest
    const manifest = {
        version: shortHash,
        commitHash: commitHash,
        timestamp: new Date().toISOString(),
        mainJsUrl: `https://cdn.jsdelivr.net/gh/23cubed/trx-cap@${shortHash}/dist/main.js`,
        fallbackUrl: `https://cdn.jsdelivr.net/gh/23cubed/trx-cap@main/dist/main.js`
    };
    
    // Create the static loader script
    const loaderScript = `(function() {
    'use strict';
    
    // TRX Cap Webflow Loader v1.0
    // This script automatically loads the latest version of TRX Cap assets
    
    const CDN_BASE = 'https://cdn.jsdelivr.net/gh/23cubed/trx-cap@';
    const MANIFEST_URL = CDN_BASE + 'main/dist/version-manifest.json';
    const FALLBACK_URL = CDN_BASE + 'main/dist/main.js';
    
    function loadScript(url, callback) {
        const script = document.createElement('script');
        script.src = url;
        script.onload = function() {
            if (callback) callback(null); // null = success
        };
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
})();`;
    
    // Write files
    const distDir = path.join(__dirname, '../dist');
    if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir, { recursive: true });
    }
    
    fs.writeFileSync(path.join(distDir, 'webflow-loader.js'), loaderScript);
    fs.writeFileSync(path.join(distDir, 'version-manifest.json'), JSON.stringify(manifest, null, 2));
    
    // Create Webflow instructions
    const webflowInstructions = `# 🎯 TRX Cap Webflow Integration

## 🔗 Single Script Tag for Webflow

Add this **ONE TIME** to your Webflow project's footer:

\`\`\`html
<script src="https://cdn.jsdelivr.net/gh/23cubed/trx-cap@main/dist/webflow-loader.js"></script>
\`\`\`

## ✨ How it works:

1. **Static URL**: The loader script URL never changes
2. **Auto-versioning**: Automatically loads the latest version on each commit
3. **Fallback**: If latest version fails, falls back to @main
4. **Zero maintenance**: No manual URL updates needed

## 🚀 Current Version:
- **Version**: ${shortHash}
- **Commit**: ${commitHash}
- **Generated**: ${new Date().toISOString()}

## 📊 URLs:
- **Loader**: https://cdn.jsdelivr.net/gh/23cubed/trx-cap@main/dist/webflow-loader.js
- **Manifest**: https://cdn.jsdelivr.net/gh/23cubed/trx-cap@main/dist/version-manifest.json
- **Main Script**: ${manifest.mainJsUrl}

---
*Auto-generated by TRX Cap build system*
`;
    
    fs.writeFileSync(path.join(__dirname, '../WEBFLOW-INTEGRATION.md'), webflowInstructions);
    
    console.log('✅ Webflow loader system built successfully!');
    console.log('📄 Files created:');
    console.log('  - dist/webflow-loader.js');
    console.log('  - dist/version-manifest.json');
    console.log('  - WEBFLOW-INTEGRATION.md');
    console.log('');
    console.log('🎯 Add this to Webflow footer:');
    console.log('<script src="https://cdn.jsdelivr.net/gh/23cubed/trx-cap@main/dist/webflow-loader.js"></script>');
}

buildWebflowLoader(); 