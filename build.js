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
  }
};

async function build() {
  try {
    if (isWatch) {
      console.log('👀 Watching for changes...');
      const context = await esbuild.context(buildOptions);
      await context.watch();
    } else {
      console.log('🚀 Building bundle...');
      await esbuild.build(buildOptions);
      console.log('✅ Build complete!');
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