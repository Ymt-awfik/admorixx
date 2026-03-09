# AI Media Buying Intelligence Platform

A production-grade, AI-powered decision intelligence layer for paid advertising campaigns. This platform ingests advertising data, applies deterministic rule-based logic, and uses AI ONLY for explanations, prioritization, and creative ideation—never for autonomous decision-making.

---

## 🎯 PRODUCT VISION

**What This Platform Does:**
- Ingests advertising performance data (read-only in v1)
- Normalizes and stores metrics historically
- Applies **deterministic rule-based logic FIRST**
- Uses AI ONLY for: explanations, prioritization, and creative ideation
- Generates viral-ready video ad ideas (hooks + storyboards)
- Supports multiple users and multiple ad accounts
- Proposes actions but **NEVER executes without approval**
- Designed to evolve into an AI agent later, safely

**What This Platform Is NOT:**
- ❌ Not a demo or toy MVP
- ❌ Not fully autonomous (v1 requires human approval)
- ❌ Not real-time bidding
- ❌ Not ML model training
- ❌ Not frontend-only logic

---

## 🏗️ SYSTEM ARCHITECTURE

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                          │
│                     (Next.js + React + Tailwind)                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │   Auth   │  │Dashboard │  │ Creative │  │  Agent   │       │
│  │  Pages   │  │   UI     │  │  Studio  │  │  Inbox   │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS/JWT
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                       API GATEWAY LAYER                         │
│                    (NestJS REST API + Guards)                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Rate Limiting │ JWT Validation │ Tenant Isolation       │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
┌────────▼─────┐ ┌──────▼──────┐ ┌─────▼──────┐
│   Auth       │ │  Business   │ │  Integration│
│   Module     │ │   Logic     │ │   Layer     │
│              │ │   Layer     │ │             │
│ - JWT        │ │ - Decision  │ │ - Google    │
│ - OAuth 2.0  │ │   Engine    │ │   Ads API   │
│ - Sessions   │ │ - AI Layer  │ │ - Token Mgmt│
└──────┬───────┘ │ - Creative  │ └─────┬───────┘
       │         │   Generator │       │
       │         │ - Agent     │       │
       │         │   Proposals │       │
       │         └──────┬──────┘       │
       │                │              │
┌──────▼────────────────▼──────────────▼──────┐
│          BACKGROUND JOBS LAYER              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Metric  │  │  Token   │  │ Decision │  │
│  │Ingestion │  │ Refresh  │  │ Executor │  │
│  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────┬───────────────────────┘
                      │
┌─────────────────────▼───────────────────────┐
│           DATA PERSISTENCE LAYER            │
│            (PostgreSQL + Prisma)            │
│  ┌──────────────────────────────────────┐   │
│  │ Users │ AdAccounts │ Metrics │ Logs │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### Decision Pipeline (CRITICAL)

```
Metrics DB → Rule Engine → Metric Analyzer → AI Explainer → Decision Log
                ↓              ↓                  ↓
           (Deterministic) (Statistical)    (Explanatory)
```

**Rule Engine Examples:**
1. **Losing Campaign Detection**: ROAS < 1.5 + declining trend → Pause
2. **Winner Scaling**: ROAS > 3.0 + consistent 7 days → Scale +20%
3. **Creative Fatigue**: CTR declined 30% over 14 days → Alert
4. **Budget Inefficiency**: Spend < 80% of budget + poor ROAS → Reduce

---

## 🛠️ TECH STACK

### Backend
- **Framework**: NestJS (Node.js)
- **API**: REST
- **Auth**: JWT + OAuth 2.0
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Jobs**: Bull Queue + Redis
- **AI**: Provider-agnostic (OpenAI, Anthropic)

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: React Context + Hooks

### Infrastructure
- **Environment Variables**: `.env` files
- **Secrets**: Backend-only (NEVER in frontend)
- **OAuth Tokens**: Encrypted (AES-256)

---

## 📁 PROJECT STRUCTURE

```
ai-media-platform/
├── backend/
│   ├── src/
│   │   ├── auth/                 # JWT + OAuth authentication
│   │   ├── users/                # User management
│   │   ├── ad-accounts/          # Ad account connections
│   │   ├── campaigns/            # Campaign data
│   │   ├── ads/                  # Ad data
│   │   ├── metrics/              # Performance metrics
│   │   ├── decisions/            # Decision engine (CORE)
│   │   │   ├── rules/            # Deterministic rules
│   │   │   │   ├── losing-campaign.rule.ts
│   │   │   │   ├── winner-scaling.rule.ts
│   │   │   │   └── ...
│   │   │   ├── decision-engine.service.ts
│   │   │   └── decisions.controller.ts
│   │   ├── ai/                   # AI abstraction layer
│   │   │   ├── providers/        # OpenAI, Anthropic, etc.
│   │   │   ├── ai.service.ts
│   │   │   └── ai.controller.ts
│   │   ├── creatives/            # Creative generator
│   │   │   ├── creative-patterns.data.ts  # Viral patterns library
│   │   │   ├── creatives.service.ts
│   │   │   └── creatives.controller.ts
│   │   ├── agent/                # Semi-autonomous agent
│   │   │   ├── agent.service.ts  # Proposal + approval workflow
│   │   │   └── agent.controller.ts
│   │   ├── integrations/
│   │   │   └── google-ads/       # Google Ads API integration
│   │   ├── jobs/                 # Background jobs (cron)
│   │   ├── common/
│   │   │   ├── guards/           # Auth guards
│   │   │   ├── decorators/       # Custom decorators
│   │   │   └── services/
│   │   │       └── encryption.service.ts  # OAuth token encryption
│   │   ├── prisma/
│   │   │   ├── schema.prisma     # Database schema
│   │   │   └── migrations/
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx          # Landing/redirect
│   │   │   ├── login/
│   │   │   ├── signup/
│   │   │   ├── dashboard/        # Main dashboard
│   │   │   ├── creatives/        # Creative generator UI
│   │   │   ├── agent/            # Agent approval inbox
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── auth/             # Login/signup forms
│   │   │   ├── dashboard/        # Metrics cards, charts
│   │   │   ├── creatives/        # Creative studio
│   │   │   ├── agent/            # Proposal cards
│   │   │   └── common/           # Reusable components
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx   # Auth state management
│   │   ├── lib/
│   │   │   └── api-client.ts     # API client with interceptors
│   │   ├── hooks/                # Custom React hooks
│   │   └── types/                # TypeScript types
│   ├── .env.local.example
│   ├── package.json
│   ├── tailwind.config.ts
│   └── next.config.js
│
└── README.md                     # This file
```

---

## 🗃️ DATABASE SCHEMA

### Core Tables

1. **users** - User accounts
2. **user_profiles** - Extended user info
3. **refresh_tokens** - JWT refresh tokens
4. **ad_accounts** - Connected ad accounts (with encrypted OAuth tokens)
5. **campaigns** - Ad campaigns
6. **ads** - Individual ads
7. **metrics_daily** - Historical metrics (NEVER overwritten)
8. **decision_logs** - All decisions (auditable)
9. **ai_recommendations** - AI-generated insights
10. **creative_ideas** - Generated video ad concepts
11. **viral_patterns** - Creative pattern library
12. **agent_actions** - Semi-autonomous action proposals
13. **audit_logs** - System audit trail

**Key Principle**: All metrics are historical and append-only. Decisions are logged with full context.

---

## 🚀 SETUP & INSTALLATION

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 6+ (for background jobs)
- Google Ads Developer Token
- OpenAI API Key (or Anthropic)

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your credentials:
# - DATABASE_URL
# - JWT_SECRET
# - ENCRYPTION_KEY (32 characters)
# - GOOGLE_ADS_DEVELOPER_TOKEN
# - GOOGLE_CLIENT_ID
# - GOOGLE_CLIENT_SECRET
# - AI_API_KEY

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Start development server
npm run start:dev
```

Backend runs on: `http://localhost:3000`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local

# Edit .env.local:
# NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1

# Start development server
npm run dev
```

Frontend runs on: `http://localhost:3001`

---

## 🔐 SECURITY ARCHITECTURE

### Authentication Flow

1. User signs up/logs in → Receives JWT access token (15min) + refresh token (7 days)
2. Frontend stores tokens in localStorage
3. API client automatically attaches token to requests
4. Backend validates JWT on every request
5. On 401, frontend auto-refreshes token

### OAuth Token Security

- All Google Ads OAuth tokens are encrypted (AES-256) before database storage
- Encryption key stored in backend environment variables ONLY
- Tokens decrypted only when needed for API calls
- Frontend NEVER has access to OAuth tokens

### Multi-Tenancy Isolation

- Every query includes `userId` filter
- No cross-user data access
- Prisma handles row-level security
- OAuth tokens scoped per ad account

---

## 🤖 DECISION ENGINE (CORE LOGIC)

### How It Works

1. **Metric Ingestion**: Daily sync from Google Ads API (cron job)
2. **Metric Aggregation**: Calculate rolling averages (3/7/14/30 days)
3. **Rule Evaluation**: Run all registered rules against campaigns
4. **Decision Logging**: Store decision with reasoning + metrics snapshot
5. **AI Explanation**: Generate human-readable explanation
6. **Agent Proposal**: Convert decision to actionable proposal
7. **Human Approval**: User reviews and approves/rejects
8. **Execution**: If approved, execute via API (with rollback capability)

### Adding New Rules

```typescript
// backend/src/decisions/rules/my-custom.rule.ts
@Injectable()
export class MyCustomRule implements IDecisionRule {
  name = 'my_custom_rule';
  version = '1.0.0';
  description = 'My custom decision logic';

  async evaluate(context: RuleContext): Promise<RuleDecision> {
    // Your deterministic logic here
    // Return decision with confidence score
  }
}
```

Register in `decision-engine.service.ts`.

---

## 🎨 CREATIVE GENERATOR

### Viral Pattern Library

10 built-in patterns:
1. Problem-Agitate-Solution (PAS)
2. Before & After Transformation
3. Customer Testimonial Story
4. User-Generated Content (UGC) Style
5. Trend Hijacking
6. Emotional Storytelling
7. Quick Tutorial/How-To
8. Direct Response Ad
9. Listicle Format
10. Challenge/Test Format

### Creative Generation Flow

1. User inputs: Product name, description, target audience, platform
2. System selects best pattern (or user chooses)
3. AI generates:
   - 5-10 hook variants
   - Shot-by-shot storyboard (with timing)
   - Call-to-action
   - Viral confidence score (0-100)
   - Production notes
4. Saved to database for reuse

**Output is EXECUTION-READY** for video editors.

---

## 🤝 AGENT PROPOSAL SYSTEM

### Safety Principles

1. **NEVER auto-execute** without approval
2. All actions have **rollback capability**
3. All actions are **auditable**
4. Risk assessment for every action
5. User can reject/approve every proposal

### Approval Workflow

```
Decision → Proposal Creation → Safety Checks → Risk Assessment
    ↓
User Reviews → Approves/Rejects
    ↓
If Approved → Execute → Log Result
    ↓
If Failed → Rollback Available
```

### Supported Actions (v1)

- Pause Campaign
- Enable Campaign
- Increase Budget (max +50%)
- Decrease Budget
- Pause Ad
- Enable Ad

---

## 📊 API ENDPOINTS

### Authentication
- `POST /api/v1/auth/signup` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout
- `GET  /api/v1/auth/me` - Get current user

### Google Ads Integration
- `GET  /api/v1/integrations/google-ads/auth-url` - Get OAuth URL
- `POST /api/v1/integrations/google-ads/callback` - Handle OAuth callback
- `POST /api/v1/integrations/google-ads/sync-campaigns` - Sync campaigns
- `POST /api/v1/integrations/google-ads/sync-metrics` - Sync metrics

### Decisions
- `POST /api/v1/decisions/evaluate/all` - Run decision engine
- `GET  /api/v1/decisions/recent` - Get recent decisions
- `GET  /api/v1/decisions/pending` - Get pending decisions

### AI
- `GET  /api/v1/ai/provider` - Get AI provider info
- `POST /api/v1/ai/explain-decision` - Get AI explanation
- `POST /api/v1/ai/insights-summary` - Generate insights summary

### Creatives
- `POST /api/v1/creatives/generate` - Generate creative idea
- `GET  /api/v1/creatives` - Get user creatives
- `GET  /api/v1/creatives/patterns` - Get available patterns

### Agent
- `GET  /api/v1/agent/proposals` - Get pending proposals
- `POST /api/v1/agent/proposals/:id/approve` - Approve proposal
- `POST /api/v1/agent/proposals/:id/reject` - Reject proposal
- `GET  /api/v1/agent/history` - Get action history
- `POST /api/v1/agent/actions/:id/rollback` - Rollback action

Full API documentation: `http://localhost:3000/api/docs` (Swagger)

---

## 🧪 TESTING

### Backend Tests

```bash
cd backend
npm test                # Run all tests
npm run test:watch      # Watch mode
npm run test:cov        # Coverage report
```

### Frontend Tests

```bash
cd frontend
npm test                # Run tests
npm run test:watch      # Watch mode
```

---

## 📦 DEPLOYMENT

### Backend Deployment

**Environment Variables** (Production):
- Set strong `JWT_SECRET` (64+ characters)
- Set unique `ENCRYPTION_KEY` (32 characters)
- Use managed PostgreSQL (AWS RDS, DigitalOcean, etc.)
- Use managed Redis (AWS ElastiCache, Redis Cloud)
- Set `NODE_ENV=production`
- Enable HTTPS
- Configure CORS for production frontend domain

**Recommended Platforms**:
- AWS ECS / Fargate
- DigitalOcean App Platform
- Railway
- Render

### Frontend Deployment

**Environment Variables** (Production):
- `NEXT_PUBLIC_API_URL=https://your-api-domain.com/api/v1`

**Recommended Platforms**:
- Vercel (zero-config Next.js)
- Netlify
- AWS Amplify
- Cloudflare Pages

---

## 🔧 CONFIGURATION

### Adding New Ad Platforms

1. Create integration module in `backend/src/integrations/[platform]/`
2. Implement OAuth flow
3. Implement metric normalization
4. Register in `app.module.ts`

### Adding New AI Providers

1. Create provider in `backend/src/ai/providers/[provider].provider.ts`
2. Extend `BaseAIProvider` interface
3. Implement `structuredCompletion()` method
4. Update `ai.service.ts` to select provider

---

## 🎓 WHY THIS ARCHITECTURE?

### Deterministic Rules FIRST

**Why**: Advertising decisions involve real money. Deterministic rules are:
- Explainable
- Auditable
- Consistent
- Safe
- Legally compliant

AI is used ONLY to explain decisions that rules already made.

### Multi-Tenancy from Day 1

**Why**: SaaS platforms must isolate user data. Built-in from the start, not retrofitted.

### Encrypted OAuth Tokens

**Why**: Google Ads tokens grant API access to ad accounts with real budgets. Encryption is non-negotiable.

### Agent Requires Approval

**Why**: v1 prioritizes safety. Autonomous execution comes later after trust is established.

### Historical Metrics (Append-Only)

**Why**: You can't optimize what you can't measure historically. Trends require history.

---

## 🐛 TROUBLESHOOTING

### Backend won't start
- Check DATABASE_URL in `.env`
- Ensure PostgreSQL is running
- Run `npm run prisma:migrate`

### Frontend can't connect to backend
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Ensure backend is running on correct port
- Check CORS configuration in backend

### OAuth not working
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- Check redirect URI matches Google Cloud Console
- Ensure callback URL is correct

### AI not responding
- Verify `AI_API_KEY` is valid
- Check API provider status
- Review console logs for errors

---

## 📚 ADDITIONAL RESOURCES

- [NestJS Documentation](https://docs.nestjs.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Google Ads API](https://developers.google.com/google-ads/api/docs/start)
- [OpenAI API](https://platform.openai.com/docs/api-reference)

---

## 📄 LICENSE

Proprietary - All Rights Reserved

---

## 👤 AUTHOR

Built for solo founders using AI tools to build production SaaS.

**Contact**: [Your Email]

---

## 🚦 PROJECT STATUS

**Current Version**: 1.0.0 (Production-Ready v1)

**Completed**:
- ✅ Full backend architecture
- ✅ Database schema with Prisma
- ✅ Authentication (JWT + OAuth)
- ✅ Google Ads API integration
- ✅ Decision engine (rule-based)
- ✅ AI abstraction layer
- ✅ Creative generator
- ✅ Agent proposal system
- ✅ Frontend foundation

**Next Steps**:
- UI component library completion
- Dashboard data visualization
- Creative studio UI
- Agent inbox UI
- Background job scheduling
- Rate limiting implementation
- Comprehensive testing
- Documentation site

---

**Built with ❤️ and AI assistance**

This is a PRODUCTION-GRADE foundation. Not a demo. Not a toy.
Ready to evolve into a full autonomous agent when the time is right.
