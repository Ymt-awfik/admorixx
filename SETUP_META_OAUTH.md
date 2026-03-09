# Meta OAuth Setup Guide

This guide will help you activate the OAuth flow so users can connect with ONE CLICK instead of manually copying tokens.

## Prerequisites
- Meta Developer Account
- Your app running on a public URL (use ngrok for testing)

## Step 1: Create Meta App

1. Go to https://developers.facebook.com/apps/
2. Click "Create App"
3. Choose "Business" as the app type
4. Fill in:
   - **App Name**: admorix AI Media Buyer
   - **App Contact Email**: your email
   - **Business Account**: Select your business or create one

## Step 2: Configure OAuth Settings

### A. Add Facebook Login Product
1. In your app dashboard, click "Add Product"
2. Find "Facebook Login" and click "Set Up"
3. Choose "Web" as the platform

### B. Set Valid OAuth Redirect URIs
1. Go to Facebook Login → Settings
2. Add these URLs to "Valid OAuth Redirect URIs":
   ```
   http://localhost:3000/integrations/meta-ads/callback
   https://your-production-domain.com/integrations/meta-ads/callback
   ```
3. Click "Save Changes"

### C. Configure App Settings
1. Go to Settings → Basic
2. Copy your **App ID** and **App Secret**
3. Add these to your backend `.env` file:
   ```env
   META_APP_ID=your_app_id_here
   META_APP_SECRET=your_app_secret_here
   META_REDIRECT_URI=http://localhost:3000/integrations/meta-ads/callback
   ```

## Step 3: Add Marketing API Permissions

1. Go to "App Review" → "Permissions and Features"
2. Request these permissions:
   - `ads_management` - Required to manage ad accounts
   - `ads_read` - Required to read ad data
   - `business_management` - Required to access Business Manager

3. For each permission:
   - Click "Request"
   - Fill out the usage description
   - Provide screenshots of how you'll use it
   - Submit for review

## Step 4: Switch App Mode

1. Go to Settings → Basic
2. At the top, toggle from "Development" to "Live" mode
3. This makes your OAuth flow work for all users (not just test users)

**Note**: You may need to complete App Review first before switching to Live mode.

## Step 5: Test the OAuth Flow

1. Start your backend: `cd backend && npm run start:dev`
2. Start your frontend: `cd frontend && npm run dev`
3. Go to http://localhost:3001/connect-ad-accounts
4. Click **"Connect Meta"** button
5. You should be redirected to Facebook → Approve → Redirected back with account connected!

## Using ngrok for Testing (Recommended)

Since Meta requires HTTPS for OAuth, use ngrok:

```bash
# Install ngrok
npm install -g ngrok

# Start your backend on port 3000
cd backend && npm run start:dev

# In another terminal, expose it via ngrok
ngrok http 3000

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
# Update your .env:
META_REDIRECT_URI=https://abc123.ngrok.io/integrations/meta-ads/callback

# Add this URL to Meta Developer Console OAuth settings
```

## Troubleshooting

### "App not active" error
- Your app is still in Development mode
- Add test users in Roles → Test Users
- Or complete App Review and switch to Live mode

### "Redirect URI mismatch" error
- Make sure the redirect URI in your .env exactly matches Meta Developer Console
- Include the full path: `/integrations/meta-ads/callback`

### "Invalid OAuth access token" error
- Your App Secret might be wrong
- Regenerate it in Settings → Basic → App Secret

## Production Deployment

When deploying to production:

1. Update `META_REDIRECT_URI` in production .env:
   ```env
   META_REDIRECT_URI=https://yourdomain.com/integrations/meta-ads/callback
   ```

2. Add production URL to Meta OAuth settings

3. Ensure app is in "Live" mode

4. Complete App Review if needed

## Manual Connect vs OAuth

- **Manual Connect (Dev)**: Temporary workaround for development
  - Requires copying token from Graph API Explorer
  - Token expires in 1 hour (or 60 days if extended)
  - Not suitable for production

- **OAuth Flow**: Professional solution
  - One-click connection
  - Automatic token refresh
  - Better user experience
  - Required for production app

Once OAuth is set up, you can remove the "Manual Connect (Dev)" button from production.
