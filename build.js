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
      
      // Create a simple concatenation version that avoids all bundling issues
      const simpleVersion = `
/* TRX Capital Bundle (Simple) - Built: ${new Date().toISOString()} */
(function() {
  'use strict';
  
  ${fs.readFileSync('./src/js/split-text.js', 'utf8')
    .replace('export { splitTextElement, animateSplitText };', '')
    .replace('CustomEase.create("trx-ease", "M0,0 C0.83,0 0.17,1 1,1");', '// CustomEase removed for CSP compliance')
  }
  
  ${fs.readFileSync('./src/js/navbar.js', 'utf8')
    .replace('CustomEase.create("trx-ease", "M0,0 C0.83,0 0.17,1 1,1");', '// CustomEase removed for CSP compliance')
  }
  
  ${fs.readFileSync('./src/js/portfolio-grid.js', 'utf8')}
  
  ${fs.readFileSync('./src/js/hero.js', 'utf8')
    .replace('import { splitTextElement, animateSplitText } from \'./split-text.js\';', '')
  }
  
  console.log('TRX Capital simple bundle loaded successfully');
})();
      `;
      
      // Create a CSP-safe version that uses standard easing
      const cspSafeVersion = simpleVersion.replace(
        /ease: "trx-ease"/g, 
        'ease: "power2.out"'
      );
      
      fs.writeFileSync('./dist/bundle.simple.js', simpleVersion);
      fs.writeFileSync('./dist/bundle.csp-safe.js', cspSafeVersion);
      
      console.log('✅ Build complete! (minified, debug, simple, and CSP-safe versions)');
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