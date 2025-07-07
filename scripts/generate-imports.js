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
    
    // Get current commit hash for CDN URL
    let commitHash = '';
    let shortHash = '';
    try {
        commitHash = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
        shortHash = commitHash.substring(0, 7);
    } catch (error) {
        console.warn('⚠️  Could not get git commit hash, using fallback');
        shortHash = 'main';
    }
    
    // Generate the main.js content
    const mainContent = `// Auto-generated imports - DO NOT EDIT MANUALLY
// Run 'npm run generate-imports' to update

${imports}

// Expose CDN URL function
window.TRXCap = window.TRXCap || {};
window.TRXCap.getCDNUrl = function() {
    return 'https://cdn.jsdelivr.net/gh/23cubed/trx-cap@${shortHash}/dist/main.js';
};
window.TRXCap.getCommitHash = function() {
    return '${shortHash}';
};
window.TRXCap.loadDynamically = function() {
    const script = document.createElement('script');
    script.src = window.TRXCap.getCDNUrl();
    script.onload = () => console.log('🚀 TRX Cap bundle loaded dynamically!');
    document.head.appendChild(script);
    return script;
};
`;
    
    // Write the updated main.js
    fs.writeFileSync(mainFile, mainContent);
    console.log(`✅ Generated imports for ${jsFiles.length} modules:`, jsFiles);
}

generateImports(); 