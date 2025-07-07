const fs = require('fs');
const path = require('path');

function testWebflowLoader() {
    console.log('🧪 Testing Webflow loader system...');
    
    // Check if all required files exist
    const requiredFiles = [
        'dist/webflow-loader.js',
        'dist/version-manifest.json',
        'dist/main.js',
        'WEBFLOW-INTEGRATION.md'
    ];
    
    let allFilesExist = true;
    requiredFiles.forEach(file => {
        if (fs.existsSync(path.join(__dirname, '..', file))) {
            console.log(`✅ ${file} exists`);
        } else {
            console.log(`❌ ${file} missing`);
            allFilesExist = false;
        }
    });
    
    if (!allFilesExist) {
        console.log('❌ Some required files are missing. Run `npm run build` first.');
        process.exit(1);
    }
    
    // Test manifest content
    try {
        const manifestPath = path.join(__dirname, '../dist/version-manifest.json');
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        
        console.log('📄 Manifest content:');
        console.log(`  - Version: ${manifest.version}`);
        console.log(`  - Timestamp: ${manifest.timestamp}`);
        console.log(`  - Main JS URL: ${manifest.mainJsUrl}`);
        console.log(`  - Fallback URL: ${manifest.fallbackUrl}`);
        
        // Validate URLs
        const urlPattern = /^https:\/\/cdn\.jsdelivr\.net\/gh\/23cubed\/trx-cap@/;
        if (!urlPattern.test(manifest.mainJsUrl)) {
            console.log('❌ Invalid main JS URL format');
            process.exit(1);
        }
        if (!urlPattern.test(manifest.fallbackUrl)) {
            console.log('❌ Invalid fallback URL format');
            process.exit(1);
        }
        
        console.log('✅ Manifest URLs are valid');
        
    } catch (error) {
        console.log('❌ Error reading manifest:', error.message);
        process.exit(1);
    }
    
    // Test loader script
    try {
        const loaderPath = path.join(__dirname, '../dist/webflow-loader.js');
        const loaderContent = fs.readFileSync(loaderPath, 'utf8');
        
        // Check for required components
        const requiredComponents = [
            'TRX Cap Webflow Loader',
            'MANIFEST_URL',
            'FALLBACK_URL',
            'loadScript',
            'fetch(',
            'DOMContentLoaded'
        ];
        
        let allComponentsPresent = true;
        requiredComponents.forEach(component => {
            if (loaderContent.includes(component)) {
                console.log(`✅ Loader contains: ${component}`);
            } else {
                console.log(`❌ Loader missing: ${component}`);
                allComponentsPresent = false;
            }
        });
        
        if (!allComponentsPresent) {
            console.log('❌ Loader script is missing required components');
            process.exit(1);
        }
        
        console.log('✅ Loader script is valid');
        
    } catch (error) {
        console.log('❌ Error reading loader script:', error.message);
        process.exit(1);
    }
    
    console.log('');
    console.log('🎉 All tests passed! Webflow loader system is ready.');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Commit and push your changes');
    console.log('2. Add this script tag to your Webflow project footer:');
    console.log('   <script src="https://cdn.jsdelivr.net/gh/23cubed/trx-cap@main/dist/webflow-loader.js"></script>');
    console.log('3. The system will automatically load the latest version on each commit');
}

testWebflowLoader(); 