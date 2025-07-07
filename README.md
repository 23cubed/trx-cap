# TRX Cap - Webflow JavaScript Bundle

A modular JavaScript system for TRX Capital's Webflow site with automated builds and instant CDN delivery.

## Quick Start

Add this script tag to your Webflow project footer:

```html
<script src="https://raw.githack.com/23cubed/trx-cap/main/dist/main.js"></script>
```

## Features

- ✅ **Instant Updates** - Changes deploy immediately, no cache delays
- ✅ **Modular Architecture** - Clean separation of concerns
- ✅ **Automated Builds** - GitHub Actions handles bundling automatically
- ✅ **Production Ready** - Proper content-type and CORS headers

## Development

```bash
# Install dependencies
npm install

# Build the bundle
npm run build

# Generate import statements
npm run generate-imports
```

## Architecture

- **Source**: `src/js/` - Individual module files
- **Output**: `dist/main.js` - Bundled and minified
- **CDN**: `raw.githack.com` - Instant delivery with proper headers

## Modules

1. **hero.js** - Hero section animations
2. **navbar.js** - Navigation interactions  
3. **scrolling-gutters.js** - Scroll-based animations
4. **split-text.js** - Text animation utilities
5. **test.js** - Development logging

## How It Works

1. Edit source files in `src/js/`
2. Commit changes to GitHub
3. GitHub Actions automatically builds bundle
4. `raw.githack.com` serves updated bundle instantly
5. Webflow loads latest version immediately

No more CDN cache issues or manual deployments! 