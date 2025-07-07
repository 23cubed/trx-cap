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
    
    // Get the last commit timestamp for deterministic output
    let timestamp;
    try {
        const gitDate = execSync('git log -1 --format=%cd --date=local', { encoding: 'utf8' }).trim();
        timestamp = new Date(gitDate).toLocaleString('en-US', { timeZone: 'America/New_York' });
    } catch (error) {
        // Fallback to current time if not in git repo
        timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
    }
    
    // Generate the main.js content - SIMPLE AND CLEAN
    const mainContent = `// Auto-generated imports - DO NOT EDIT MANUALLY
// Run 'npm run generate-imports' to update

${imports}

// Simple confirmation that modules loaded
console.log('🚀 TRX Cap modules loaded:', [${jsFiles.map(f => `'${f}'`).join(', ')}]);
console.log('📅 Updated at ${timestamp} EST');
`;
    
    // Write the updated main.js
    fs.writeFileSync(mainFile, mainContent);
    
    console.log(`✅ Generated imports for ${jsFiles.length} modules:`, jsFiles);
}

generateImports(); 