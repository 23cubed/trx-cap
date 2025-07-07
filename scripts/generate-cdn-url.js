const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function generateCDNUrl() {
    try {
        // Get current commit hash
        const commitHash = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
        const shortHash = commitHash.substring(0, 7);
        
        // Generate CDN URL
        const cdnUrl = `https://cdn.jsdelivr.net/gh/23cubed/trx-cap@${commitHash}/dist/main.js`;
        const shortCdnUrl = `https://cdn.jsdelivr.net/gh/23cubed/trx-cap@${shortHash}/dist/main.js`;
        
        // Create HTML snippet
        const htmlSnippet = `<script src="${cdnUrl}"></script>`;
        const shortHtmlSnippet = `<script src="${shortCdnUrl}"></script>`;
        
        // Write to file for easy copying
        const output = `# CDN URLs for TRX Cap Bundle

## Full Commit Hash:
\`\`\`html
${htmlSnippet}
\`\`\`

## Short Commit Hash:
\`\`\`html
${shortHtmlSnippet}
\`\`\`

## Direct URLs:
- Full: ${cdnUrl}
- Short: ${shortCdnUrl}

## Commit: ${commitHash}
Generated: ${new Date().toISOString()}
`;
        
        fs.writeFileSync('CDN-URL.md', output);
        
        console.log('✅ CDN URLs generated:');
        console.log('📄 Full hash URL:', cdnUrl);
        console.log('📄 Short hash URL:', shortCdnUrl);
        console.log('📝 Written to: CDN-URL.md');
        
        return { cdnUrl, shortCdnUrl, commitHash };
    } catch (error) {
        console.error('❌ Failed to generate CDN URL:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    generateCDNUrl();
}

module.exports = generateCDNUrl; 