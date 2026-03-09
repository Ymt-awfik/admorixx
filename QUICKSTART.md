# 🚀 QUICKSTART GUIDE

Get the AI Media Buying Intelligence Platform running in 10 minutes.

---

## Prerequisites Checklist

- [ ] Node.js 18+ installed (`node --version`)
- [ ] PostgreSQL 14+ installed and running
- [ ] Redis 6+ installed and running (optional for v1 dev)
- [ ] Google Ads Developer Token (from Google Ads API Center)
- [ ] Google OAuth credentials (from Google Cloud Console)
- [ ] OpenAI API key (from platform.openai.com)

---

## Step 1: Clone & Install

```bash
cd ai-media-platform

# Backend
cd backend
npm install

# Frontend (in new terminal)
cd frontend
npm install
```

---

## Step 2: Configure Backend

```bash
cd backend
cp .env.example .env
```

**Edit `.env` with your credentials:**

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ai_media_platform"

# JWT (generate with: openssl rand -base64 32)
JWT_SECRET="your-secure-jwt-secret-here"
JWT_REFRESH_SECRET="your-secure-refresh-secret-here"

# Encryption (generate with: openssl rand -base64 32)
ENCRYPTION_KEY="your-32-character-encryption-key"

# Google Ads API
GOOGLE_ADS_DEVELOPER_TOKEN="your-google-ads-developer-token"
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/v1/auth/google/callback"

# AI Provider
AI_PROVIDER="openai"
AI_API_KEY="sk-your-openai-api-key"
AI_MODEL="gpt-4-turbo-preview"

# Redis (optional for v1 dev)
REDIS_HOST="localhost"
REDIS_PORT=6379
```

---

## Step 3: Setup Database

```bash
cd backend

# Create database
createdb ai_media_platform

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Seed with test data
npm run prisma:seed
```

---

## Step 4: Configure Frontend

```bash
cd frontend
cp .env.local.example .env.local
```

**Edit `.env.local`:**

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

---

## Step 5: Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run start:dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

---

## Step 6: Verify Installation

### Backend Health Check

Open browser: `http://localhost:3000/api/docs`

You should see the Swagger API documentation.

### Frontend

Open browser: `http://localhost:3001`

You should see the landing page.

---

## Step 7: Create Your First User

### Option A: Via Frontend

1. Go to `http://localhost:3001/signup`
2. Fill in email, password, name
3. Click "Sign Up"
4. You'll be redirected to dashboard

### Option B: Via API (cURL)

```bash
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecureP@ssw0rd",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

---

## Step 8: Connect Google Ads Account

1. Log in to frontend
2. Go to Settings → Integrations
3. Click "Connect Google Ads"
4. Authorize with Google (OAuth flow)
5. Enter your Google Ads Customer ID
6. Click "Connect"

---

## Step 9: Sync First Campaign Data

### Via Frontend Dashboard

1. Go to Ad Accounts
2. Click "Sync Campaigns"
3. Wait for sync to complete
4. View campaigns in dashboard

### Via API

```bash
# Get ad account ID from frontend or database
AD_ACCOUNT_ID="your-ad-account-id"

# Sync campaigns
curl -X POST http://localhost:3000/api/v1/integrations/google-ads/sync-campaigns \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"adAccountId": "'$AD_ACCOUNT_ID'"}'

# Sync metrics (last 30 days)
curl -X POST http://localhost:3000/api/v1/integrations/google-ads/sync-metrics \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "adAccountId": "'$AD_ACCOUNT_ID'",
    "startDate": "2024-01-01",
    "endDate": "2024-01-31"
  }'
```

---

## Step 10: Run Decision Engine

### Via Frontend

1. Go to Dashboard
2. Click "Run Analysis"
3. Wait for decisions to generate
4. View results in Decision Timeline

### Via API

```bash
curl -X POST http://localhost:3000/api/v1/decisions/evaluate/all \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 🎨 Generate Your First Creative

### Via Frontend

1. Go to Creative Studio
2. Fill in:
   - Product name
   - Product description
   - Target audience
   - Platform (TikTok, Reels, Shorts)
3. Select pattern (or let AI choose)
4. Click "Generate"
5. Review hooks, storyboard, and CTA

### Via API

```bash
curl -X POST http://localhost:3000/api/v1/creatives/generate \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productName": "Smart Water Bottle",
    "productDescription": "Hydration tracking bottle with LED reminders",
    "targetAudience": "Health-conscious millennials",
    "platform": "TIKTOK",
    "numberOfVariants": 7
  }'
```

---

## 🤖 Approve Your First Agent Proposal

### Via Frontend

1. Go to Agent Inbox
2. Review pending proposals
3. Check reasoning, risk level, and impact
4. Click "Approve" or "Reject"
5. If approved, action executes automatically

### Via API

```bash
# Get pending proposals
curl -X GET http://localhost:3000/api/v1/agent/proposals \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Approve a proposal
curl -X POST http://localhost:3000/api/v1/agent/proposals/{PROPOSAL_ID}/approve \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Reject a proposal
curl -X POST http://localhost:3000/api/v1/agent/proposals/{PROPOSAL_ID}/reject \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Need more data before scaling"}'
```

---

## 🔍 Explore the System

### Swagger API Docs
`http://localhost:3000/api/docs`

### Prisma Studio (Database GUI)
```bash
cd backend
npm run prisma:studio
```
Opens at `http://localhost:5555`

### View Logs
```bash
# Backend logs
cd backend
npm run start:dev  # Watch terminal output

# Frontend logs
cd frontend
npm run dev  # Watch terminal output
```

---

## 🐛 Common Issues

### "Port already in use"

Backend (3000) or Frontend (3001) port conflict:

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

### "Database connection failed"

Check PostgreSQL is running:
```bash
psql -U postgres -c "SELECT version();"
```

### "Prisma Client not found"

Regenerate Prisma client:
```bash
cd backend
npm run prisma:generate
```

### "OAuth redirect mismatch"

Ensure Google Cloud Console has exact redirect URI:
`http://localhost:3000/api/v1/auth/google/callback`

### "AI API rate limit"

You're hitting OpenAI rate limits. Options:
1. Slow down requests
2. Upgrade OpenAI plan
3. Use different AI provider (set `AI_PROVIDER=anthropic`)

---

## 📊 Sample Data

To quickly test the system without real Google Ads data, use the seed script:

```bash
cd backend
npm run prisma:seed
```

This creates:
- Sample user account
- Mock ad account
- Sample campaigns
- Historical metrics (30 days)
- Pre-generated decisions

**Login credentials:**
- Email: `demo@example.com`
- Password: `Demo123!@#`

---

## 🎯 What to Try Next

1. **Explore Decision Rules**
   - Review code in `backend/src/decisions/rules/`
   - Understand how rules evaluate campaigns
   - Try modifying thresholds

2. **Add a Custom Rule**
   - Create new rule file
   - Implement `IDecisionRule` interface
   - Register in `decision-engine.service.ts`

3. **Test Creative Patterns**
   - Generate creatives for different products
   - Try all 10 viral patterns
   - Compare confidence scores

4. **Monitor Agent Behavior**
   - Run decision engine daily
   - Review agent proposals
   - Track approval/rejection ratios

5. **Build UI Components**
   - Create dashboard widgets
   - Add data visualizations
   - Implement creative studio UI

---

## 🚀 Deploy to Production

When ready to deploy:

1. **Backend**: Deploy to AWS/Railway/Render
2. **Frontend**: Deploy to Vercel/Netlify
3. **Database**: Use managed PostgreSQL (AWS RDS, DigitalOcean)
4. **Redis**: Use managed Redis (Redis Cloud, AWS ElastiCache)
5. **Environment**: Set production environment variables
6. **Security**: Enable HTTPS, update CORS, rotate secrets

See full deployment guide in [README.md](README.md#-deployment).

---

## 📚 Learn More

- [System Architecture](README.md#-system-architecture)
- [Decision Engine Details](README.md#-decision-engine-core-logic)
- [API Reference](README.md#-api-endpoints)
- [Security Guide](README.md#-security-architecture)

---

**You're now ready to build!** 🎉

This platform is production-ready. Start customizing for your specific use case.
