# TRX Capital - Bundle for Webflow

This repository contains bundled JavaScript and CSS files for the TRX Capital portfolio website, optimized for use with Webflow via jsDeliver CDN.

## 📦 Bundle Contents

The bundle includes:
- **Hero animations** - Page loading and hero section animations
- **Navigation bar** - Interactive navigation with scroll triggers
- **Portfolio grid** - Hover effects and grid interactions
- **Base styles** - Minimal CSS framework

## 🚀 CDN Usage

### Using jsDeliver CDN

Add these script tags to your Webflow project's custom code section:

```html
<!-- CSS Bundle -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/[YOUR_GITHUB_USERNAME]/trx-cap@main/dist/bundle.css">

<!-- JavaScript Bundle -->
<script src="https://cdn.jsdelivr.net/gh/[YOUR_GITHUB_USERNAME]/trx-cap@main/dist/bundle.js"></script>
```

### Alternative - Using GitHub Release Tags

For more control, you can use specific release tags:

```html
<!-- Replace v1.0.0 with your actual release tag -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/[YOUR_GITHUB_USERNAME]/trx-cap@v1.0.0/dist/bundle.css">
<script src="https://cdn.jsdelivr.net/gh/[YOUR_GITHUB_USERNAME]/trx-cap@v1.0.0/dist/bundle.js"></script>
```

## 🔧 Development

### Building the Bundle

```bash
# Install dependencies
npm install

# Build production bundle (automatically finds all JS/CSS files)
npm run build

# Development build with watch mode
npm run dev

# Clean dist directory
npm run clean
```

### Project Structure

```
trx-cap/
├── src/
│   ├── css/
│   │   └── main.css          # Main styles
│   ├── js/
│   │   ├── hero.js           # Hero animations
│   │   ├── navbar.js         # Navigation interactions
│   │   └── portfolio-grid.js # Portfolio grid effects
│   └── index.js              # Entry point
├── dist/
│   ├── bundle.js             # Bundled JavaScript
│   └── bundle.css            # Bundled CSS
└── build.js                  # Simple build script using esbuild
```

## 📋 Requirements

The bundle expects the following dependencies to be available globally:
- **GSAP** (GreenSock Animation Platform)
- **ScrollTrigger** (GSAP plugin)
- **CustomEase** (GSAP plugin)

Make sure to include these in your Webflow project before loading the bundle:

```html
<!-- Add these BEFORE your bundle script -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/CustomEase.min.js"></script>
```

## 🎯 HTML Structure Requirements

Your Webflow project should include these elements for the animations to work:

### Required Elements:
- `#heroBG` - Hero background element
- `#hero` - Hero section container
- `#heroContent` - Hero content container
- `#heroHeading` - Hero heading for text animation
- `.navbar` - Navigation bar
- `.portfolio_grid` - Portfolio grid container
- `.gsap_grid-wrapper` - Grid wrapper for hover effects
- `.gsap_grid-shuttle` - Grid shuttle element

## 🔄 Updating the Bundle

1. **Add/edit files** in the `src/js/` or `src/css/` directories
2. **No manual imports needed** - the build script automatically discovers all files
3. Run `npm run build` to generate new bundle (or just push - GitHub Actions does this automatically)
4. jsDeliver CDN will automatically serve the updated files

### ✨ Zero Configuration
Just add any `.js` file to `src/js/` or any `.css` file to `src/css/` and it will be automatically included in the bundle!

## 📝 Notes

- **Built with esbuild** - Super fast and zero configuration
- **Automatic file discovery** - No need to manually import files
- **Production optimized** - Minified and optimized for CDN delivery
- **Watch mode available** - Use `npm run dev` for development
- The bundle exposes itself as an IIFE named `TRXCap` 