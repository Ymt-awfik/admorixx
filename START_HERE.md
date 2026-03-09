# 🚀 START HERE - YOUR EXACT CHECKLIST

I've created ALL the code for you. Now follow these steps EXACTLY.

---

## ✅ WHAT YOU NEED TO DO (Copy & Paste These Commands)

### STEP 1: Install PostgreSQL (if not installed)

**Windows:**
1. Download from: https://www.postgresql.org/download/windows/
2. Run installer, remember your password
3. Keep default port: 5432

**Test it works:**
```bash
psql --version
```

---

### STEP 2: Install Node.js (if not installed)

**Windows:**
1. Download from: https://nodejs.org/
2. Install LTS version (20.x or higher)

**Test it works:**
```bash
node --version
npm --version
```

---

### STEP 3: Setup Backend

Open PowerShell or Command Prompt:

```bash
# Go to backend folder
cd C:\Users\admin\OneDrive\Desktop\lalal\ai-media-platform\backend

# Install dependencies (takes 2-3 minutes)
npm install

# Copy environment file
copy .env.example .env

# STOP HERE - Edit the .env file now!
```

**EDIT `backend\.env` file:**

Open `backend\.env` in Notepad and change these values:

```env
# 1. Database (change password to YOUR postgres password)
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/ai_media_platform"

# 2. Generate JWT secrets (run this in PowerShell to generate random strings):
#    [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
JWT_SECRET="paste-generated-random-string-here"
JWT_REFRESH_SECRET="paste-another-random-string-here"

# 3. Encryption key (exactly 32 characters) - generate same way
ENCRYPTION_KEY="paste-32-character-random-string"

# 4. Google Ads (leave empty for now, we'll get these later)
GOOGLE_ADS_DEVELOPER_TOKEN=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# 5. AI API Key - Get from: https://platform.openai.com/api-keys
AI_API_KEY="sk-your-openai-api-key-here"
```

**Quick way to generate secrets (PowerShell):**
```powershell
# Run this 3 times to get 3 different secrets:
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

**After editing .env, continue:**

```bash
# Create database
createdb -U postgres ai_media_platform
# (Enter your postgres password when prompted)

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Start backend server
npm run start:dev
```

**✅ Success if you see:**
```
Application is running on: http://localhost:3000
```

**Test it:** Open browser to http://localhost:3000/api/docs

---

### STEP 4: Setup Frontend

Open a NEW PowerShell/Command Prompt (keep backend running):

```bash
# Go to frontend folder
cd C:\Users\admin\OneDrive\Desktop\lalal\ai-media-platform\frontend

# Install dependencies (takes 2-3 minutes)
npm install

# Copy environment file
copy .env.local.example .env.local

# No need to edit .env.local - it's already configured!

# Start frontend server
npm run dev
```

**✅ Success if you see:**
```
- Local:        http://localhost:3001
```

**Test it:** Open browser to http://localhost:3001

---

## 🎉 YOU'RE DONE! Now Test It:

### Test 1: Create Account

1. Go to: http://localhost:3001
2. Click "Sign up"
3. Fill in:
   - Email: `test@example.com`
   - Password: `Test123!@#` (must have uppercase, lowercase, number, special char)
   - First Name: `Test`
   - Last Name: `User`
4. Click "Create Account"

**✅ Success:** You should be redirected to the dashboard

---

### Test 2: Test Creative Generator

1. Click "Creatives" in navigation
2. Fill in:
   - Product: "Smart Water Bottle"
   - Description: "Tracks hydration with LED reminders"
   - Audience: "Health-conscious millennials"
   - Platform: TikTok
3. Click "Generate Creative Ideas"

**✅ Success:** You should see 7 hook variants, storyboard, and CTA

---

## 🔧 WHAT TO DO NEXT (Optional - For Production)

### Get Google Ads Credentials (Required for real data)

1. **Google Ads Developer Token:**
   - Go to: https://ads.google.com/aw/apicenter
   - Apply for Developer Token (takes 1-2 days)

2. **Google OAuth Credentials:**
   - Go to: https://console.cloud.google.com/
   - Create new project
   - Enable "Google Ads API"
   - Create OAuth 2.0 Client ID
   - Add redirect URI: `http://localhost:3000/api/v1/integrations/google-ads/callback`
   - Copy Client ID and Secret to `backend\.env`

3. **Update backend\.env:**
   ```env
   GOOGLE_ADS_DEVELOPER_TOKEN="your-token-here"
   GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="your-secret-here"
   ```

4. **Restart backend** (Ctrl+C, then `npm run start:dev`)

---

## 🐛 TROUBLESHOOTING

### "Port 3000 already in use"
```bash
# Windows: Find and kill process
netstat -ano | findstr :3000
taskkill /PID [PID_NUMBER] /F
```

### "Can't connect to database"
```bash
# Check PostgreSQL is running
# Windows: Open Services, look for "postgresql-x64-14" (or similar)
# Make sure it's "Running"

# Or restart it:
net stop postgresql-x64-14
net start postgresql-x64-14
```

### "Prisma Client not found"
```bash
cd backend
npm run prisma:generate
```

### Frontend shows "Network Error"
- Make sure backend is running on port 3000
- Check `frontend\.env.local` has: `NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1`

---

## 📚 WHAT YOU HAVE NOW

✅ **Backend Running** (http://localhost:3000)
- Complete NestJS API
- PostgreSQL database with 13 tables
- JWT authentication
- Decision engine with 2 rules
- AI integration (OpenAI)
- Creative generator
- Agent proposal system
- Google Ads integration (ready for credentials)

✅ **Frontend Running** (http://localhost:3001)
- Next.js 14 with App Router
- Login/Signup pages
- Dashboard with stats
- Creative generator UI
- Agent approval inbox
- Settings page

✅ **Documentation**
- [README.md](README.md) - Full documentation
- [ARCHITECTURE.md](ARCHITECTURE.md) - Design decisions
- [QUICKSTART.md](QUICKSTART.md) - Detailed setup guide

---

## 🎯 YOUR NEXT STEPS

1. **TODAY**: Get both servers running locally ✓
2. **THIS WEEK**: Get OpenAI API key and test creative generator
3. **NEXT WEEK**: Apply for Google Ads credentials
4. **WEEK 3**: Add more decision rules
5. **WEEK 4**: Deploy to production (Vercel + Railway)

---

## 💡 QUICK COMMANDS REFERENCE

**Start Backend:**
```bash
cd C:\Users\admin\OneDrive\Desktop\lalal\ai-media-platform\backend
npm run start:dev
```

**Start Frontend:**
```bash
cd C:\Users\admin\OneDrive\Desktop\lalal\ai-media-platform\frontend
npm run dev
```

**View Database:**
```bash
cd C:\Users\admin\OneDrive\Desktop\lalal\ai-media-platform\backend
npm run prisma:studio
```
Opens at: http://localhost:5555

**Backend API Docs:**
http://localhost:3000/api/docs

---

## 🆘 NEED HELP?

If you're stuck, check:
1. Both servers are running
2. PostgreSQL is running
3. `.env` files are configured
4. OpenAI API key is valid

---

**YOU'VE GOT THIS!** 🚀

Start with Step 1 and work your way down. Everything is ready for you.
