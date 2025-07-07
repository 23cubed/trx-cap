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
    
    // Get commit hash for CDN URL generation (not embedded in bundle)
    let commitHash = '';
    let cdnUrl = '';
    try {
        commitHash = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
        const shortHash = commitHash.substring(0, 7);
        cdnUrl = `https://cdn.jsdelivr.net/gh/23cubed/trx-cap@${shortHash}/dist/main.js`;
        console.log(`📌 Commit: ${shortHash}`);
        console.log(`🔗 CDN URL: ${cdnUrl}`);
    } catch (error) {
        console.warn('⚠️  Could not get commit hash, using @main');
        cdnUrl = 'https://cdn.jsdelivr.net/gh/23cubed/trx-cap@main/dist/main.js';
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