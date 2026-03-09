# 🔌 Multi-Platform Ad Integration Guide

Complete guide to connecting Google Ads, Meta Ads, and TikTok Ads to your admorix platform.

---

## 🎯 Google Ads Integration

### Step 1: Get Google Ads Developer Token
1. Go to https://ads.google.com/aw/apicenter
2. Sign in with your Google Ads account
3. Click "Apply for Developer Token"
4. Fill out the form (approval takes 1-2 business days)
5. Once approved, copy your Developer Token

### Step 2: Create Google Cloud Project
1. Go to https://console.cloud.google.com/
2. Create a new project: "admorix-integration"
3. Enable these APIs:
   - Google Ads API
   - Google OAuth2 API

### Step 3: Create OAuth Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client ID"
3. Application type: **Web application**
4. Name: "admorix OAuth Client"
5. Authorized redirect URIs:
   ```
   http://localhost:3000/api/v1/integrations/google-ads/callback
   ```
6. Copy your Client ID and Client Secret

### Step 4: Add to Backend .env
```env
GOOGLE_ADS_DEVELOPER_TOKEN="your-developer-token-here"
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

---

## 📘 Meta (Facebook/Instagram) Ads Integration

### Step 1: Create Meta App
1. Go to https://developers.facebook.com/
2. Click "My Apps" → "Create App"
3. Choose "Business" as app type
4. Fill in app details:
   - App Name: "admorix Integration"
   - App Contact Email: your-email@domain.com

### Step 2: Add Marketing API Product
1. In your app dashboard, scroll to "Add Products"
2. Click "Set Up" on **Marketing API**
3. This will add Marketing API to your app

### Step 3: Get App Credentials
1. Go to "Settings" → "Basic"
2. Copy your **App ID**
3. Copy your **App Secret** (click "Show")

### Step 4: Get Access Token
1. Go to https://developers.facebook.com/tools/explorer/
2. Select your app from the dropdown
3. Click "Generate Access Token"
4. Request these permissions:
   - `ads_management`
   - `ads_read`
   - `business_management`
5. Copy the generated Access Token

### Step 5: Get Long-Lived Token (Important!)
```bash
# Exchange for long-lived token (60 days)
curl -X GET "https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=YOUR_APP_ID&client_secret=YOUR_APP_SECRET&fb_exchange_token=YOUR_SHORT_LIVED_TOKEN"
```

### Step 6: Add to Backend .env
```env
META_APP_ID="your-app-id"
META_APP_SECRET="your-app-secret"
META_ACCESS_TOKEN="your-long-lived-access-token"
```

### Step 7: Configure OAuth Redirect
In your Meta App settings:
1. Go to "Settings" → "Basic"
2. Add OAuth Redirect URI:
   ```
   http://localhost:3000/api/v1/integrations/meta-ads/callback
   ```

---

## 🎵 TikTok Ads Integration

### Step 1: Create TikTok Developer Account
1. Go to https://ads.tiktok.com/marketing_api/homepage
2. Click "Get Started" → "Apply for Access"
3. Fill out the application form:
   - Company Name
   - Business Email
   - Use Case: "Ad Management Platform"
4. Wait for approval (typically 1-3 business days)

### Step 2: Create TikTok App
1. Once approved, go to https://ads.tiktok.com/marketing_api/apps
2. Click "Create App"
3. Fill in:
   - App Name: "admorix"
   - OAuth Redirect URL: `http://localhost:3000/api/v1/integrations/tiktok-ads/callback`

### Step 3: Get Credentials
1. After app creation, you'll see:
   - **App ID**
   - **App Secret**
2. Copy both values

### Step 4: Get Access Token
1. Go to your app dashboard
2. Navigate to "Authorization" tab
3. Use the "OAuth 2.0 Playground" to generate a test token
4. Or use the TikTok OAuth flow (documentation: https://ads.tiktok.com/marketing_api/docs?id=1738373164380162)

### Step 5: Add to Backend .env
```env
TIKTOK_APP_ID="your-app-id"
TIKTOK_APP_SECRET="your-app-secret"
TIKTOK_ACCESS_TOKEN="your-access-token"
```

---

## 🚀 Final Steps

### 1. Restart Backend
After adding all credentials to `.env`:

```bash
cd backend
# Kill current process (Ctrl+C if running)
npm run start:dev
```

### 2. Test Connections
1. Go to http://localhost:3001/settings
2. You'll see three connection buttons:
   - **Connect Google Ads** (Blue button)
   - **Connect Meta Ads** (Blue Facebook button)
   - **Connect TikTok Ads** (Black button)
3. Click each to test the OAuth flow

---

## 📊 Platform Comparison

| Feature | Google Ads | Meta Ads | TikTok Ads |
|---------|-----------|----------|------------|
| **Setup Difficulty** | Medium | Medium | Hard |
| **Approval Time** | 1-2 days | Instant | 1-3 days |
| **Token Expiry** | Refresh tokens | 60 days | 1 year |
| **API Limits** | 15K/day | 200/hour | 1K/hour |
| **Best For** | Search ads | Social ads | Video ads |

---

## 🔒 Security Best Practices

### 1. Token Storage
All tokens are encrypted using AES-256 before storage in the database.

### 2. Token Refresh
- Google Ads: Automatic refresh using refresh tokens
- Meta Ads: Manually refresh every 60 days
- TikTok: Manually refresh every 365 days

### 3. Environment Variables
⚠️ **NEVER commit `.env` file to git!**

Add to `.gitignore`:
```
.env
.env.local
.env.production
```

---

## 🐛 Troubleshooting

### Google Ads Issues
**Error: "Developer token invalid"**
- Solution: Make sure token is approved (check status at ads.google.com/aw/apicenter)

**Error: "Invalid redirect URI"**
- Solution: Exact match required, including http/https and trailing slashes

### Meta Ads Issues
**Error: "Invalid access token"**
- Solution: Token may have expired, generate a new long-lived token

**Error: "Insufficient permissions"**
- Solution: Regenerate token with all required permissions (ads_management, ads_read, business_management)

### TikTok Ads Issues
**Error: "App not approved"**
- Solution: Wait for TikTok to approve your developer account

**Error: "Invalid app credentials"**
- Solution: Double-check App ID and App Secret match exactly

---

## 📚 API Documentation Links

- **Google Ads API**: https://developers.google.com/google-ads/api/docs/start
- **Meta Marketing API**: https://developers.facebook.com/docs/marketing-apis
- **TikTok Ads API**: https://ads.tiktok.com/marketing_api/docs

---

## ✅ Quick Checklist

### Before Going Live:
- [ ] All three platform credentials added to `.env`
- [ ] Backend restarted with new credentials
- [ ] OAuth redirect URIs configured in each platform
- [ ] Test token refresh logic
- [ ] Set up token expiry monitoring
- [ ] Configure webhook endpoints (for real-time updates)
- [ ] Test with test accounts first
- [ ] Apply for production access (if in sandbox mode)

---

## 🎉 You're Ready!

Once all credentials are set up, your admorix platform can:
- ✅ Connect to Google Ads accounts
- ✅ Connect to Meta Business accounts
- ✅ Connect to TikTok Ads accounts
- ✅ Sync campaign data from all platforms
- ✅ Make automated decisions across all platforms
- ✅ Generate AI-powered creative ideas

**Happy advertising! 🚀**
