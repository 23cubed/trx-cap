const fs = require('fs');
const { execSync } = require('child_process');

function generateCommitUrl() {
    // Get current commit hash
    let commitHash;
    try {
        commitHash = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    } catch (e) {
        // If we're in a pre-commit state, try to get the hash that will be created
        try {
            commitHash = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
        } catch (e2) {
            console.error('❌ Could not get commit hash');
            process.exit(1);
        }
    }
    
    // Get git remote URL to determine repo
    let repoUrl = '';
    try {
        const gitRemote = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
        const match = gitRemote.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
        if (match) {
            const [, owner, repo] = match;
            repoUrl = `${owner}/${repo.replace('.git', '')}`;
        }
    } catch (e) {
        console.error('❌ Could not determine GitHub repo');
        process.exit(1);
    }

    // Generate the static commit-based URL
    const staticUrl = `https://cdn.jsdelivr.net/gh/${repoUrl}@${commitHash}/dist/main.js`;
    
    // Create the webflow snippet
    const webflowSnippet = `<script src="${staticUrl}"></script>`;
    
    // Create a static auto-inserter that always loads the latest
    const insertFunction = `
// TRX Cap Auto-Inserter - Always loads latest commit
// Repo: ${repoUrl}

function insertTRXCapScript() {
    // Check for existing scripts and their status
    const existingScripts = document.querySelectorAll('script[src*="cdn.jsdelivr.net/gh/${repoUrl}"]');
    
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
    script.src = 'https://cdn.jsdelivr.net/gh/${repoUrl}/dist/main.js';
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
}`.trim();
    
    // Write files
    fs.writeFileSync('WEBFLOW_URL.txt', staticUrl);
    fs.writeFileSync('WEBFLOW_SNIPPET.html', webflowSnippet);
    fs.writeFileSync('webflow-inserter.js', insertFunction);
    
    console.log('\n🎯 Commit-based URL Generated!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📋 Commit: ${commitHash.substring(0, 7)}`);
    console.log(`📋 Static CDN URL:`);
    console.log(staticUrl);
    console.log('');
    console.log('📋 Webflow Options:');
    console.log('1. Direct script tag:');
    console.log(`   ${webflowSnippet}`);
    console.log('');
    console.log('2. Auto-inserter script (always loads latest):');
    console.log(`   <script src="https://cdn.jsdelivr.net/gh/${repoUrl}/webflow-inserter.js"></script>`);
    console.log('');
    console.log('📁 Files updated:');
    console.log('   - WEBFLOW_URL.txt');
    console.log('   - WEBFLOW_SNIPPET.html'); 
    console.log('   - webflow-inserter.js');
    
    return { url: staticUrl, snippet: webflowSnippet, commit: commitHash };
}

if (require.main === module) {
    generateCommitUrl();
}

module.exports = { generateCommitUrl }; 