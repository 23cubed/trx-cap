const fs = require('fs');
const path = require('path');

function generateImports() {
    const jsDir = path.join(__dirname, '../src/js');
    const mainFile = path.join(jsDir, 'main.js');
    
    // Get all JS files except main.js
    const jsFiles = fs.readdirSync(jsDir)
        .filter(file => file.endsWith('.js') && file !== 'main.js')
        .map(file => `./${file}`);
    
    // Generate static imports for bundling
    const imports = jsFiles.map(file => `import '${file}';`).join('\n');
    
    // Generate the main.js content
    const mainContent = `// Auto-generated imports - DO NOT EDIT MANUALLY
// Run 'npm run generate-imports' to update

${imports}

console.log('🚀 All modules loaded: ${jsFiles.join(', ')}');
`;
    
    // Write the updated main.js
    fs.writeFileSync(mainFile, mainContent);
    console.log(`✅ Generated imports for ${jsFiles.length} modules:`, jsFiles);
}

generateImports(); 