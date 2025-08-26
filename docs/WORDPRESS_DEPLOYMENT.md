# WordPress Deployment Guide

This guide explains how to set up automated deployment of the Minecraft Craft Widget to your WordPress site.

## Prerequisites

1. WordPress site with REST API enabled (enabled by default)
2. WordPress Application Password for authentication
3. GitHub repository secrets configured

## Step 1: Create WordPress Application Password

1. Log in to your WordPress admin panel
2. Go to **Users → Profile** (or edit your user)
3. Scroll down to **Application Passwords**
4. Enter a name like "GitHub Deploy"
5. Click **Add New Application Password**
6. **Save the generated password** - you'll only see it once!

## Step 2: Configure GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:

| Secret Name | Value | Example |
|------------|-------|---------|
| `WORDPRESS_URL` | Your WordPress site URL | `https://example.com` |
| `WORDPRESS_USERNAME` | Your WordPress username | `admin` |
| `WORDPRESS_APP_PASSWORD` | The application password from Step 1 | `xxxx xxxx xxxx xxxx` |
| `WORDPRESS_MEDIA_FOLDER` | Folder name for widget files | `minecraft-widget` |

## Step 3: Deploy

### Automatic Deployment

Push to the `main` branch triggers automatic deployment:

```bash
git push origin main
```

### Manual Deployment

1. Go to Actions tab in GitHub
2. Select "Build and Deploy to WordPress"
3. Click "Run workflow"

## Step 4: Embed in WordPress

After deployment, use this code in any post/page:

```html
<div id="mc-craft"></div>
<script src="https://your-site.com/wp-content/uploads/minecraft-widget/minecraft-craft-widget.min.js"></script>
```

### Using Shortcode (Alternative)

If you deployed as a plugin, use:

```
[minecraft_widget]
```

## Manual Deployment (Local)

If you prefer to deploy manually:

```bash
# Set environment variables
export WORDPRESS_URL="https://your-site.com"
export WORDPRESS_USERNAME="your-username"
export WORDPRESS_APP_PASSWORD="xxxx xxxx xxxx xxxx"

# Run deployment
npm run build
node scripts/deploy-to-wordpress.js
```

## WordPress Plugin Option

The deployment script also creates a plugin file. To use it:

1. Upload `dist/minecraft-craft-widget-plugin.php` and the widget files to `/wp-content/plugins/minecraft-craft-widget/`
2. Activate the plugin in WordPress admin
3. Use `[minecraft_widget]` shortcode anywhere

## Troubleshooting

### 401 Unauthorized
- Check your application password is correct
- Ensure username is correct
- Verify REST API is enabled

### 403 Forbidden
- Check user has upload_files capability
- Verify .htaccess isn't blocking REST API

### CORS Issues
- Widget loads from same domain, shouldn't have CORS issues
- If loading from different domain, configure CORS headers

### Large File Issues
- Widget is ~800KB, should be under most upload limits
- If needed, increase `upload_max_filesize` in PHP settings

## Security Notes

1. Application passwords are safer than regular passwords
2. Only grants REST API access, not admin panel access
3. Can be revoked anytime from user profile
4. Secrets are encrypted in GitHub

## Customization

### Change Container ID
```html
<div id="my-custom-mc-widget"></div>
<script>
  document.addEventListener('DOMContentLoaded', function() {
    if (window.MinecraftCraftWidget) {
      window.MinecraftCraftWidget.init('my-custom-mc-widget');
    }
  });
</script>
```

### Custom Icon Path
```javascript
window.MinecraftCraftWidget.init('mc-craft', {
  iconBaseUrl: 'https://cdn.example.com/minecraft-icons/'
});
```