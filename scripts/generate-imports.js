const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function extractExports(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const exportMatches = content.match(/export\s*{\s*([^}]+)\s*}/g);
    
    if (!exportMatches) return [];
    
    const exports = [];
    exportMatches.forEach(match => {
        const exportContent = match.match(/{\s*([^}]+)\s*}/)[1];
        const exportNames = exportContent.split(',').map(name => name.trim());
        exports.push(...exportNames);
    });
    
    return exports;
}

function generateImports() {
    const jsDir = path.join(__dirname, '../src/js');
    const mainFile = path.join(jsDir, 'main.js');
    
    // Get all JS files except main.js
    const jsFiles = fs.readdirSync(jsDir)
        .filter(file => file.endsWith('.js') && file !== 'main.js')
        .map(file => `./${file}`);
    
    // Generate static imports for bundling
    const imports = jsFiles.map(file => `import '${file}';`).join('\n');
    
    // Generate function imports and collect exports
    const functionImports = [];
    const allExports = [];
    
    jsFiles.forEach(file => {
        const filePath = path.join(jsDir, file.replace('./', ''));
        const exports = extractExports(filePath);
        
        if (exports.length > 0) {
            functionImports.push(`import { ${exports.join(', ')} } from '${file}';`);
            allExports.push(...exports);
        }
    });
    
    // Always use current timestamp - shows when commit was made
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
    
    // Generate the main.js content with ES6 re-exports
    const mainContent = `// Auto-generated imports - DO NOT EDIT MANUALLY
// Run 'npm run generate-imports' to update

${imports}

// Import functions to re-export for ES6 module usage
${functionImports.join('\n')}

// Re-export all functions for ES6 imports
export { ${allExports.join(', ')} };

// Simple confirmation that modules loaded
console.log('🚀 TRX Cap modules loaded:', [${jsFiles.map(f => `'${f}'`).join(', ')}]);
console.log('📅 Updated at ${timestamp} EST');
console.log('🚀 Functions available for import:', [${allExports.map(name => `'${name}'`).join(', ')}]);
`;
    
    // Write the updated main.js
    fs.writeFileSync(mainFile, mainContent);
    
    console.log(`✅ Generated imports for ${jsFiles.length} modules:`, jsFiles);
    console.log(`✅ Functions available for ES6 import:`, allExports);
}

generateImports(); 