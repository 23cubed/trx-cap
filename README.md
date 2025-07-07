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

# Build production bundle
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
└── webpack.config.js         # Webpack configuration
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

1. Make changes to files in the `src/` directory
2. Run `npm run build` to generate new bundle
3. Commit and push changes to your repository
4. jsDeliver CDN will automatically serve the updated files

## 📝 Notes

- The bundle is optimized for production with minification
- Console logs are removed in production builds
- Source maps are available for development builds
- The bundle exposes itself as a UMD module named `TRXCap` 