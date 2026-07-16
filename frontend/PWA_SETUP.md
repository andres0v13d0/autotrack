# PWA Setup - AutoTrack

This document describes all the PWA configuration and files set up for AutoTrack.

## Files Created

### 1. **index.html** (Updated)
- Added comprehensive meta tags for PWA
- Added Open Graph tags for social media (WhatsApp, Facebook, Twitter)
- Added Apple mobile web app meta tags
- Added theme color configuration
- Registered Service Worker

### 2. **public/manifest.json**
- PWA manifest file defining app metadata
- Icons for different sizes and purposes (any, maskable)
- App shortcuts for quick actions
- Screenshots for installation prompts
- Display mode set to `standalone` for full app experience

### 3. **public/app.webmanifest**
- Alternative manifest file format
- Includes share_target capabilities for sharing to the app
- Additional metadata for comprehensive PWA support

### 4. **public/sw.js** (Service Worker)
- Caches essential assets on install
- Implements network-first strategy with cache fallback
- Handles offline functionality
- Supports background sync for work orders
- Handles push notifications
- Cleans up old caches on activation

### 5. **public/robots.txt**
- SEO configuration for search engines
- Allows indexing of main content
- Disallows admin and API paths
- Includes sitemap reference
- Blocks undesirable bots (AhrefsBot, MJ12bot, SemrushBot)

### 6. **public/sitemap.xml**
- XML sitemap for search engines
- Includes main pages with change frequency and priority
- Mobile-optimized tags

### 7. **public/.well-known/security.txt**
- Security contact information
- Expiry date for the file
- Preferred languages

### 8. **public/.htaccess**
- URL rewriting for SPA routing
- HTTPS enforcement
- WWW redirect
- Gzip compression for assets
- Cache headers for static assets
- Security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- MIME type definitions

### 9. **public/ads.txt**
- Ad verification file for ad networks

### 10. **public/privacy-policy.html**
- Privacy policy page
- Data collection and usage disclosure
- Security information

### 11. **public/terms-of-service.html**
- Terms of service page
- License and disclaimer information
- Limitation of liability

## Social Media Integration

### WhatsApp Preview
When shared on WhatsApp, the app will display:
- Image: `/logo.jpeg`
- Title: "AutoTrack - Work Order Management"
- Description: "Manage your automotive work orders, customers, and payments efficiently."

### Facebook & Open Graph
Open Graph meta tags ensure proper sharing across:
- Facebook
- LinkedIn
- Twitter
- Discord
- Slack
- WhatsApp

## Security Headers Configured

- **X-Frame-Options**: SAMEORIGIN (prevents clickjacking)
- **X-Content-Type-Options**: nosniff (prevents MIME type sniffing)
- **X-XSS-Protection**: 1; mode=block (XSS protection)
- **Referrer-Policy**: strict-origin-when-cross-origin
- **Permissions-Policy**: Restricts access to geolocation, microphone, camera

## PWA Installation

Users can install AutoTrack on:
- **Android**: Chrome, Edge, Samsung Internet, Firefox
- **iOS**: Safari 15.1+ (limited support)
- **Windows**: Edge, Chrome
- **macOS**: Chrome, Edge
- **Linux**: Chrome, Firefox

### Installation Methods
1. **Add to Home Screen** (iOS)
2. **Install App** button (Android, Windows, macOS)
3. **Browser menu** → Install app

## Offline Support

The Service Worker provides:
- Assets caching on first visit
- Network-first strategy for fresh content
- Fallback to cached content when offline
- Offline page fallback to index.html

## Performance Optimizations

1. **Cache Strategy**:
   - Static assets: 1 year cache
   - HTML pages: 1 hour cache with revalidation

2. **Compression**:
   - Gzip compression for text-based assets
   - Efficient image loading

3. **Asset Loading**:
   - Non-blocking CSS and JS
   - Efficient icon loading

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 15.1+
- Opera 76+
- Samsung Internet 14+

## Testing the PWA

1. **Chrome DevTools**:
   - Application tab
   - Service Workers section
   - Manifest validation

2. **Lighthouse Audit**:
   ```bash
   npm run build
   npm run preview
   # Open Chrome DevTools → Lighthouse
   ```

3. **Install Testing**:
   - Use Chrome Devtools → Manifest
   - Check for installability

## Deployment Checklist

- [ ] Ensure HTTPS is enabled
- [ ] Verify manifest.json is served with correct MIME type
- [ ] Test Service Worker registration
- [ ] Test offline functionality
- [ ] Verify app icons display correctly
- [ ] Test social media sharing (WhatsApp, Facebook)
- [ ] Check robots.txt is accessible
- [ ] Verify sitemap.xml is accessible
- [ ] Test installation on multiple devices
- [ ] Check security headers with securityheaders.com

## Additional Resources

- [MDN: Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Google: PWA Checklist](https://web.dev/pwa-checklist/)
- [Web.dev: Service Workers](https://web.dev/service-workers/)
- [Open Graph Protocol](https://ogp.me/)

## Maintenance

- Update manifest.json icons if brand changes
- Monitor Service Worker cache size
- Review robots.txt annually
- Update privacy policy and terms as needed
- Test PWA functionality after major updates
