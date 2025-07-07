const fs = require('fs');
const path = require('path');

function createLoader() {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Get git remote URL to determine repo
    const { execSync } = require('child_process');
    let repoUrl = '';
    try {
        const gitRemote = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
        const match = gitRemote.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
        if (match) {
            const [, owner, repo] = match;
            repoUrl = `${owner}/${repo.replace('.git', '')}`;
        }
    } catch (e) {
        console.error('Could not determine GitHub repo');
        process.exit(1);
    }

    // Create the dynamic loader script
    const loaderScript = `
(function() {
    // TRX Cap Dynamic Loader - Auto-loads latest version
    const REPO = '${repoUrl}';
    const FALLBACK_VERSION = '${packageJson.version}';
    
    function loadScript(url) {
        const script = document.createElement('script');
        script.src = url;
        script.async = true;
        script.onload = () => console.log('🚀 TRX Cap loaded from:', url);
        script.onerror = () => {
            console.warn('Failed to load from:', url, 'trying fallback...');
            if (url.includes('@v')) return; // Already tried versioned
            loadScript(\`https://cdn.jsdelivr.net/gh/\${REPO}@v\${FALLBACK_VERSION}/dist/main.js\`);
        };
        document.head.appendChild(script);
    }
    
    // Try to load latest, fallback to versioned
    loadScript(\`https://cdn.jsdelivr.net/gh/\${REPO}/dist/main.js\`);
})();`.trim();

    // Write the loader to dist folder
    if (!fs.existsSync('dist')) {
        fs.mkdirSync('dist');
    }
    
    fs.writeFileSync('dist/loader.js', loaderScript);
    
    // Use unminified version for .min.js too (it's already small and safe)
    fs.writeFileSync('dist/loader.min.js', loaderScript);
    
    const loaderUrl = `https://cdn.jsdelivr.net/gh/${repoUrl}/dist/loader.min.js`;
    
    console.log('\n🎯 Dynamic Loader Created!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Add this ONE LINE to your Webflow footer:');
    console.log('');
    console.log(`<script src="${loaderUrl}"></script>`);
    console.log('');
    console.log('✅ This will ALWAYS load your latest code automatically!');
    console.log('📝 No more manual CDN URL updates needed.');
    
    return loaderUrl;
}

if (require.main === module) {
    createLoader();
}

module.exports = { createLoader }; 