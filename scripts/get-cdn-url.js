const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function getCdnUrl() {
    console.log('🔄 Running pre-commit to ensure imports are up to date...');
    
    try {
        // Run pre-commit hook to update imports
        execSync('.git/hooks/pre-commit', { stdio: 'inherit' });
        
        // Run build to ensure dist/main.js is current
        console.log('🏗️  Building project...');
        execSync('npm run build', { stdio: 'inherit' });
        
        // Read package.json to get version and repo info
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        const version = packageJson.version;
        
        // Try to get git remote URL to determine repo
        let repoUrl = '';
        try {
            const gitRemote = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
            // Parse GitHub repo from git URL
            const match = gitRemote.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
            if (match) {
                const [, owner, repo] = match;
                repoUrl = `${owner}/${repo.replace('.git', '')}`;
            }
        } catch (e) {
            console.warn('⚠️  Could not determine GitHub repo from git remote');
        }
        
        // Generate jsdelivr CDN URLs
        const cdnUrls = {
            latest: repoUrl ? `https://cdn.jsdelivr.net/gh/${repoUrl}/dist/main.js` : null,
            versioned: repoUrl ? `https://cdn.jsdelivr.net/gh/${repoUrl}@v${version}/dist/main.js` : null,
            unpkg: `https://unpkg.com/${packageJson.name}@${version}/dist/main.js`
        };
        
        console.log('\n🎯 CDN URLs Generated:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        if (cdnUrls.versioned) {
            console.log(`📌 Versioned (recommended): ${cdnUrls.versioned}`);
        }
        if (cdnUrls.latest) {
            console.log(`🔄 Latest: ${cdnUrls.latest}`);
        }
        console.log(`📦 NPM CDN: ${cdnUrls.unpkg}`);
        
        console.log('\n💡 Copy the versioned URL to use in your Webflow site!');
        
        return cdnUrls;
        
    } catch (error) {
        console.error('❌ Error generating CDN URL:', error.message);
        process.exit(1);
    }
}

// If called directly, run the function
if (require.main === module) {
    getCdnUrl();
}

module.exports = { getCdnUrl }; 