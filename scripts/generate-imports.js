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
    
    // Generate static build identifier for CDN URL
    let buildId = '';
    let cdnPath = '';
    
    // Try to get commit hash, but fall back to timestamp if not available
    try {
        const commitHash = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
        buildId = commitHash.substring(0, 7);
        cdnPath = `@${buildId}`;
        console.log(`📌 Using commit hash for CDN: ${buildId}`);
    } catch (error) {
        // Fallback to timestamp-based build ID
        buildId = Date.now().toString(36);
        cdnPath = `@main`;
        console.log(`📌 Using timestamp build ID: ${buildId}, CDN path: ${cdnPath}`);
    }
    
    // Generate the main.js content
    const mainContent = `// Auto-generated imports - DO NOT EDIT MANUALLY
// Run 'npm run generate-imports' to update

${imports}

// Expose CDN URL function with static build reference
window.TRXCap = window.TRXCap || {};
window.TRXCap.getCDNUrl = function() {
    return 'https://cdn.jsdelivr.net/gh/23cubed/trx-cap${cdnPath}/dist/main.js';
};
window.TRXCap.getBuildId = function() {
    return '${buildId}';
};
window.TRXCap.getBuildTime = function() {
    return '${new Date().toISOString()}';
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