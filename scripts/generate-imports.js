const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function generateImports() {
    const jsDir = path.join(__dirname, '../src/js');
    const mainFile = path.join(jsDir, 'main.js');
    
    // Get all JS files except main.js
    const jsFiles = fs.readdirSync(jsDir)
        .filter(file => file.endsWith('.js') && file !== 'main.js')
        .map(file => `./${file}`);
    
    // Generate static imports for bundling
    const imports = jsFiles.map(file => `import '${file}';`).join('\n');
    
    // Get version info - use different strategies for CI vs local
    let commitHash = '';
    let cdnUrl = '';
    const isCI = process.env.GITHUB_ACTIONS === 'true';
    
    if (isCI) {
        // In CI: Use actual commit hash for production versioning
        try {
            commitHash = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
            const shortHash = commitHash.substring(0, 7);
            cdnUrl = `https://cdn.jsdelivr.net/gh/23cubed/trx-cap@${shortHash}/dist/main.js`;
            console.log(`📌 CI Commit: ${shortHash}`);
            console.log(`🔗 CDN URL: ${cdnUrl}`);
        } catch (error) {
            console.warn('⚠️  Could not get commit hash in CI, using @main');
            cdnUrl = 'https://cdn.jsdelivr.net/gh/23cubed/trx-cap@main/dist/main.js';
        }
    } else {
        // Local development: Use @main to avoid mismatches
        console.log(`📌 Local Development Mode`);
        cdnUrl = 'https://cdn.jsdelivr.net/gh/23cubed/trx-cap@main/dist/main.js';
        commitHash = 'development';
        console.log(`🔗 CDN URL: ${cdnUrl}`);
    }
    
    // Generate the main.js content - SIMPLE AND CLEAN (no self-references)
    const mainContent = `// Auto-generated imports - DO NOT EDIT MANUALLY
// Run 'npm run generate-imports' to update

${imports}

// Simple confirmation that modules loaded
console.log('🚀 TRX Cap modules loaded:', [${jsFiles.map(f => `'${f}'`).join(', ')}]);
`;
    
    // Write the updated main.js
    fs.writeFileSync(mainFile, mainContent);
    
    // Generate CDN URL file for easy copy-paste
    const cdnContent = `# 🔗 Current CDN URL for Webflow

## Use this URL in your Webflow project:

\`\`\`html
<script src="${cdnUrl}"></script>
\`\`\`

## Direct URL:
${cdnUrl}

Generated: ${new Date().toISOString()}
Commit: ${commitHash || 'main'}
`;
    
    fs.writeFileSync(path.join(__dirname, '../WEBFLOW-URL.md'), cdnContent);
    
    console.log(`✅ Generated imports for ${jsFiles.length} modules:`, jsFiles);
    console.log(`📝 Webflow URL saved to: WEBFLOW-URL.md`);
}

generateImports(); 