const esbuild = require('esbuild');
const glob = require('glob');
const fs = require('fs');
const path = require('path');

const isWatch = process.argv.includes('--watch');

// Get all JS files (esbuild will resolve dependencies automatically)
const jsFiles = glob.sync('./src/js/*.js');

// Get all CSS files and combine them
const cssFiles = glob.sync('./src/css/*.css');
const combinedCSS = cssFiles.map(file => fs.readFileSync(file, 'utf8')).join('\n');

// Create temp entry file that imports all modules
const tempEntry = `
${jsFiles.map(file => `import '${file.startsWith('./') ? file : './' + file}';`).join('\n')}
console.log('TRX Capital bundle loaded successfully');
`;

// Write temp entry
fs.writeFileSync('./temp-entry.js', tempEntry);

// Write combined CSS
fs.mkdirSync('./dist', { recursive: true });
fs.writeFileSync('./dist/bundle.css', combinedCSS);

// Build options
const buildOptions = {
  entryPoints: ['./temp-entry.js'],
  bundle: true,
  minify: true,
  outfile: './dist/bundle.js',
  format: 'iife',
  target: 'es2015',
  globalName: 'TRXCap',
  // Ensure proper module resolution
  resolveExtensions: ['.js'],
  loader: {
    '.js': 'js'
  },
  // Add better tree shaking and module resolution
  treeShaking: true,
  platform: 'browser',
  // Add timestamp banner
  banner: {
    js: `/* TRX Capital Bundle - Built: ${new Date().toISOString()} */`
  },
  // Prevent eval usage for CSP compliance
  legalComments: 'none',
  keepNames: false,
  // Use safer minification that doesn't generate eval
  minifyWhitespace: true,
  minifyIdentifiers: true,
  minifySyntax: true,
  // Additional CSP-safe settings
  define: {
    'process.env.NODE_ENV': '"production"'
  },
  // Avoid dynamic imports that might cause eval
  splitting: false,
  // Use more conservative target
  target: 'es2017'
};

async function build() {
  try {
    if (isWatch) {
      console.log('👀 Watching for changes...');
      const context = await esbuild.context(buildOptions);
      await context.watch();
    } else {
      console.log('🚀 Building bundle...');
      
      // Build minified version
      await esbuild.build(buildOptions);
      
      // Build non-minified version for debugging
      const debugOptions = {
        ...buildOptions,
        minify: false,
        minifyWhitespace: false,
        minifyIdentifiers: false,
        minifySyntax: false,
        outfile: './dist/bundle.debug.js',
        banner: {
          js: `/* TRX Capital Bundle (Debug) - Built: ${new Date().toISOString()} */`
        }
      };
      await esbuild.build(debugOptions);
      
      // Create simple concatenated version
      const concatenatedContent = jsFiles.map(file => {
        let content = fs.readFileSync(file, 'utf8');
        // Remove ES6 imports/exports
        content = content.replace(/import.*from.*['"];?\s*/g, '');
        content = content.replace(/export\s*{[^}]*};\s*/g, '');
        return content;
      }).join('\n\n');
      
      const concatenatedVersion = `
/* TRX Capital Bundle (Concatenated) - Built: ${new Date().toISOString()} */
(function() {
  'use strict';
  
${concatenatedContent}
  
  console.log('TRX Capital concatenated bundle loaded successfully');
})();
      `;
      
      fs.writeFileSync('./dist/bundle.concat.js', concatenatedVersion);
      
             console.log('✅ Build complete! (minified, debug, and concatenated versions)');
    }
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  } finally {
    // Clean up temp file
    if (fs.existsSync('./temp-entry.js')) {
      fs.unlinkSync('./temp-entry.js');
    }
  }
}

build(); 