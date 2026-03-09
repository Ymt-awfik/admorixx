# 🏗️ ARCHITECTURAL DESIGN DOCUMENT

## System Overview

The AI Media Buying Intelligence Platform is designed as a **production-grade SaaS** with the following architectural principles:

1. **Safety First**: Deterministic rules before AI
2. **Explainability**: Every decision must be traceable
3. **Auditability**: Complete audit trail
4. **Multi-tenancy**: Strict user isolation
5. **Security**: Encrypted OAuth tokens, JWT auth
6. **Scalability**: Modular, stateless API design
7. **Extensibility**: Provider-agnostic AI, pluggable rules

---

## Core Architectural Decisions

### 1. **Deterministic Rules Over AI Autonomy**

**Decision**: Use rule-based logic for all decisions, AI only for explanations.

**Rationale**:
- Advertising involves real money and real business impact
- Rules are explainable, testable, and legally compliant
- AI can hallucinate or be inconsistent
- Users need to trust the system before accepting autonomy
- Gradual trust-building path: Rules → Explanations → Suggestions → Autonomy

**Implementation**:
```typescript
// Rules evaluate → Return decision
// AI receives decision → Generates explanation
// Agent proposes action → Requires approval
```

**Trade-offs**:
- ✅ Predictable, safe, explainable
- ❌ Requires manual rule updates for new scenarios
- ✅ Can evolve to AI-powered rules later

---

### 2. **Provider-Agnostic AI Layer**

**Decision**: Abstract AI behind a provider interface.

**Rationale**:
- OpenAI, Anthropic, Azure, etc. all have different APIs
- Avoid vendor lock-in
- Switch providers without changing business logic
- Support multiple providers simultaneously
- Cost optimization by provider selection

**Implementation**:
```typescript
abstract class BaseAIProvider {
  abstract completion(messages, options)
  abstract structuredCompletion(prompt, schema, options)
}

class OpenAIProvider extends BaseAIProvider { ... }
class AnthropicProvider extends BaseAIProvider { ... }
```

**Trade-offs**:
- ✅ Flexibility, no lock-in
- ✅ Easy to add new providers
- ❌ Slightly more code than direct API calls

---

### 3. **Append-Only Metrics Architecture**

**Decision**: Historical metrics are never overwritten, only appended.

**Rationale**:
- Trend analysis requires historical data
- Debugging requires knowing past states
- Compliance may require data retention
- Rolling averages need historical points
- Decision confidence requires consistency checks

**Implementation**:
```typescript
// Each day gets a new MetricDaily record
// Unique constraint: (adAccountId, level, date, campaignId, adId)
// Never UPDATE metrics, always INSERT
```

**Trade-offs**:
- ✅ Complete historical accuracy
- ✅ Trend analysis possible
- ❌ Larger database size
- ✅ Can implement retention policy for old data

---

### 4. **Encrypted OAuth Token Storage**

**Decision**: All OAuth tokens encrypted at rest with AES-256.

**Rationale**:
- OAuth tokens grant API access to real ad accounts
- Database breach should not expose tokens
- Compliance (SOC 2, GDPR) requires encryption
- Defense-in-depth security

**Implementation**:
```typescript
// Before save
const encryptedToken = encryptionService.encrypt(token);
await prisma.adAccount.create({ accessToken: encryptedToken });

// Before use
const token = encryptionService.decrypt(adAccount.accessToken);
const client = createGoogleAdsClient(token);
```

**Trade-offs**:
- ✅ Secure even if database compromised
- ✅ Compliance-ready
- ❌ Slight performance overhead (negligible)

---

### 5. **Agent Approval Workflow**

**Decision**: v1 requires human approval for all actions.

**Rationale**:
- Building trust takes time
- Early mistakes are costly
- Users need to understand system behavior
- Approval workflow provides learning data for ML later
- Gradual autonomy: Approval → Auto-approve low-risk → Full autonomy

**Implementation**:
```typescript
Decision → Proposal → Safety Checks → Risk Assessment
    ↓
User Approves/Rejects
    ↓
If Approved → Execute → Log Result → Rollback Available
```

**Trade-offs**:
- ✅ Safe, builds trust
- ✅ User maintains control
- ❌ Requires user involvement
- ✅ Can evolve to auto-approve over time

---

### 6. **Multi-Tenancy from Day 1**

**Decision**: Row-level security via userId foreign keys.

**Rationale**:
- SaaS must isolate user data
- Retrofitting multi-tenancy is painful
- Built-in from start prevents future security issues
- Enables team/organization features later

**Implementation**:
```typescript
// Every query includes userId filter
await prisma.campaign.findMany({
  where: { adAccount: { userId } }
});

// Prisma middleware can enforce this globally
```

**Trade-offs**:
- ✅ Secure by default
- ✅ Scalable to enterprise
- ❌ Slight query complexity

---

### 7. **Structured AI Outputs (JSON Only)**

**Decision**: AI always outputs structured JSON, never free text.

**Rationale**:
- UI needs structured data, not prose
- Parsing free text is error-prone
- Validation requires schemas
- APIs need consistent responses
- Type safety in TypeScript

**Implementation**:
```typescript
const response = await ai.structuredCompletion(
  prompt,
  {
    title: 'string',
    summary: 'string',
    suggestions: 'array of strings',
  }
);
// response.data is typed and validated
```

**Trade-offs**:
- ✅ Type-safe, predictable
- ✅ Easy to consume in UI
- ❌ Requires careful prompt engineering

---

### 8. **Creative Pattern Library (Not AI-Generated Patterns)**

**Decision**: Use proven viral patterns as templates, AI fills in details.

**Rationale**:
- Proven patterns have track record
- AI alone might hallucinate ineffective patterns
- Pattern library is curated and testable
- Combines domain expertise with AI creativity
- Users can trust results

**Implementation**:
```typescript
// 10 proven patterns stored as templates
const patterns = {
  PROBLEM_AGITATION_SOLUTION: { ... },
  BEFORE_AFTER: { ... },
  ...
};

// AI generates execution details using pattern as framework
const creative = await ai.generate(product, pattern);
```

**Trade-offs**:
- ✅ High-quality, proven patterns
- ✅ Consistent output structure
- ❌ Requires manual pattern curation
- ✅ Can add new patterns over time

---

### 9. **Modular NestJS Architecture**

**Decision**: Feature-based modules with clear boundaries.

**Rationale**:
- Single Responsibility Principle
- Easy to test in isolation
- Team can work on separate modules
- Can extract to microservices later
- Dependency injection for flexibility

**Module Structure**:
```
auth/          → Authentication & authorization
users/         → User management
ad-accounts/   → Ad account connections
campaigns/     → Campaign data
ads/           → Ad data
metrics/       → Performance metrics
decisions/     → Decision engine (CORE)
ai/            → AI abstraction layer
creatives/     → Creative generator
agent/         → Semi-autonomous agent
integrations/  → External APIs (Google Ads, etc.)
jobs/          → Background tasks
```

**Trade-offs**:
- ✅ Clean, maintainable
- ✅ Easy onboarding
- ✅ Testable
- ❌ More files/folders than monolithic

---

### 10. **Next.js App Router for Frontend**

**Decision**: Use Next.js 14 App Router, not Pages Router.

**Rationale**:
- Server Components reduce client JS
- Streaming for better UX
- Built-in data fetching patterns
- File-based routing
- Future-proof (React 18+)

**Implementation**:
```
src/app/
  layout.tsx         → Root layout
  page.tsx           → Home page
  login/page.tsx     → Login page
  dashboard/page.tsx → Dashboard
  ...
```

**Trade-offs**:
- ✅ Modern, performant
- ✅ Great DX
- ❌ Slightly steeper learning curve than Pages Router

---

## Data Flow Architecture

### 1. **Metrics Ingestion Flow**

```
Google Ads API → OAuth Token (decrypted) → API Client
    ↓
Raw Campaign/Ad Data
    ↓
Normalizer (converts to standard schema)
    ↓
PostgreSQL (append-only metrics_daily)
    ↓
Aggregation Service (rolling averages)
```

**Key Points**:
- Read-only access in v1
- Scheduled via cron (every 6 hours)
- Token auto-refresh on expiry
- Rate limit handling
- Error logging

---

### 2. **Decision Engine Flow**

```
User triggers evaluation
    ↓
Fetch all active campaigns for user
    ↓
For each campaign:
    ├→ Gather historical metrics (3/7/14/30 days)
    ├→ Build rule context
    ├→ Evaluate all registered rules
    ├→ If rule triggers:
    │   ├→ Log decision to database
    │   ├→ Generate AI explanation
    │   └→ Return decision
    └→ Continue to next campaign
    ↓
Return all decisions sorted by priority
```

**Key Points**:
- All rules run in parallel (Promise.all)
- Rule failures don't stop other rules
- Each rule is stateless
- Decisions logged immediately
- AI explanation is async (non-blocking)

---

### 3. **Agent Proposal Flow**

```
Decision created
    ↓
User/System triggers proposal creation
    ↓
Build proposal from decision
    ↓
Run safety checks:
    ├→ Budget limits
    ├→ Recent changes check
    ├→ Performance thresholds
    └→ Rollback capability
    ↓
Assess risk level (low/medium/high)
    ↓
Create AgentAction record (status=PROPOSED)
    ↓
User reviews in Agent Inbox
    ↓
User approves/rejects
    ├→ If approved:
    │   ├→ Execute action via API
    │   ├→ Log result
    │   └→ Update status=COMPLETED
    └→ If rejected:
        └→ Update status=REJECTED
```

**Key Points**:
- All actions require approval in v1
- Safety checks are mandatory
- Every action has rollback data
- Execution failures are logged
- Audit trail for compliance

---

### 4. **Creative Generation Flow**

```
User inputs product details
    ↓
Select best pattern (or user chooses)
    ↓
Build AI prompt with:
    ├→ Product info
    ├→ Target audience
    ├→ Platform (TikTok/Reels/Shorts)
    └→ Pattern template
    ↓
AI generates structured output:
    ├→ 5-10 hook variants
    ├→ Shot-by-shot storyboard
    ├→ CTA
    ├→ Viral confidence score
    └→ Production notes
    ↓
Save to database
    ↓
Return to user
```

**Key Points**:
- Patterns are fixed, not AI-generated
- AI fills in execution details
- Output is execution-ready for video editors
- Stored for reuse
- Can mark as used/favorite

---

## Security Architecture

### Authentication Flow

```
User signup/login
    ↓
Backend validates credentials
    ↓
Generate JWT:
    ├→ Access token (15min)
    └→ Refresh token (7 days, stored in DB)
    ↓
Frontend stores tokens (localStorage)
    ↓
Every API request includes access token
    ↓
Backend validates JWT on every request
    ↓
On 401:
    ├→ Frontend uses refresh token
    ├→ Get new access token
    └→ Retry original request
```

### Multi-Tenancy Security

```
API Request → JWT validation → Extract userId
    ↓
Database query → WHERE userId = extractedUserId
    ↓
Prisma ensures row-level filtering
    ↓
Return only user's data
```

### OAuth Token Security

```
User connects Google Ads
    ↓
OAuth flow → Get tokens
    ↓
Backend encrypts tokens (AES-256)
    ↓
Store encrypted in database
    ↓
When needed:
    ├→ Decrypt in memory
    ├→ Use for API call
    └→ Discard (never log/expose)
```

---

## Scaling Strategy

### Phase 1: Single-Server (Current)
- Backend: Node.js server
- Database: Single PostgreSQL instance
- Redis: Single instance
- Handles: ~1,000 users

### Phase 2: Horizontal Scaling
- Backend: Multiple Node.js instances behind load balancer
- Database: Read replicas for queries
- Redis: Redis Cluster
- Handles: ~10,000 users

### Phase 3: Microservices (If needed)
- Extract modules to separate services:
  - Auth Service
  - Decision Engine Service
  - AI Service
  - Creative Service
  - Agent Service
- Event-driven with message queue (RabbitMQ/Kafka)
- Handles: 100,000+ users

**Current architecture supports Phases 1-2 without changes.**

---

## Technology Choices: Why?

### NestJS (Backend)
- **Why**: Enterprise-grade structure, DI, TypeScript-native, modular
- **Alternatives**: Express (too minimal), Fastify (less ecosystem)

### Next.js (Frontend)
- **Why**: React framework, SSR/SSG, great DX, Vercel deployment
- **Alternatives**: Create React App (outdated), Remix (smaller ecosystem)

### PostgreSQL (Database)
- **Why**: ACID compliant, JSON support, mature, great for SaaS
- **Alternatives**: MySQL (less features), MongoDB (no ACID)

### Prisma (ORM)
- **Why**: Type-safe, migrations, great DX, modern
- **Alternatives**: TypeORM (more complex), Sequelize (older)

### Tailwind CSS (Styling)
- **Why**: Utility-first, fast, consistent, no CSS files to manage
- **Alternatives**: CSS-in-JS (runtime cost), SASS (more setup)

### JWT (Authentication)
- **Why**: Stateless, scalable, standard
- **Alternatives**: Sessions (requires server state), OAuth only (not for API)

---

## Testing Strategy

### Backend Testing

**Unit Tests**: Individual functions/methods
```typescript
describe('LosingCampaignRule', () => {
  it('should trigger for campaigns with ROAS < 1.5', () => {
    // Test deterministic logic
  });
});
```

**Integration Tests**: Module interactions
```typescript
describe('DecisionEngine', () => {
  it('should evaluate all campaigns and log decisions', () => {
    // Test full flow
  });
});
```

**E2E Tests**: Full API workflows
```typescript
describe('Agent Approval Workflow', () => {
  it('should create, approve, and execute proposal', () => {
    // Test end-to-end
  });
});
```

### Frontend Testing

**Component Tests**: UI components
```typescript
describe('DecisionCard', () => {
  it('should render decision details', () => {
    // Test rendering
  });
});
```

**Integration Tests**: User flows
```typescript
describe('Login Flow', () => {
  it('should login and redirect to dashboard', () => {
    // Test full flow
  });
});
```

---

## Monitoring & Observability

### Logging
- Structured logs (JSON)
- Log levels: debug, info, warn, error
- Log all API requests
- Log all decisions
- Log all agent actions

### Metrics (Future)
- API response times
- Decision engine execution time
- AI API latency
- Database query times
- Active users
- API error rates

### Alerting (Future)
- OAuth token refresh failures
- AI API failures
- Database connection issues
- High error rates

---

## Future Enhancements

### Near-Term (3-6 months)
- [ ] More ad platforms (Facebook Ads, TikTok Ads)
- [ ] More decision rules
- [ ] Advanced dashboard visualizations
- [ ] Team/organization support
- [ ] Notification system (email, Slack)

### Mid-Term (6-12 months)
- [ ] Auto-approve low-risk actions
- [ ] ML-based anomaly detection
- [ ] A/B test orchestration
- [ ] Budget optimization algorithms
- [ ] White-label support

### Long-Term (12+ months)
- [ ] Fully autonomous agent mode
- [ ] Multi-platform campaign orchestration
- [ ] Predictive analytics
- [ ] Creative performance prediction
- [ ] Mobile app (React Native)

---

## Conclusion

This architecture prioritizes:
1. **Safety over speed** (rules before AI)
2. **Explainability over black boxes**
3. **Security over convenience**
4. **Modularity over monoliths**
5. **Scalability over quick hacks**

It's built for **production from day 1**, not a prototype.

Ready to evolve with your business.
