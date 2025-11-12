# Deployment Architecture Diagram

## Current Setup vs Planned Setup

```
═══════════════════════════════════════════════════════════════════════════
                         CURRENT SETUP (RED LINE)
═══════════════════════════════════════════════════════════════════════════

    RocketHacks GitHub Repo
              │
              │ (RED)
              ▼
         main Branch ────────────────► Vedants Vercel Project
                                              │
                                              │
                                              ▼
                                       Vedants Account
                                       
    ⚠️ Problem: Using external account, not under RocketHacks control

═══════════════════════════════════════════════════════════════════════════
                         PLANNED SETUP (BLUE & GREEN LINES)
═══════════════════════════════════════════════════════════════════════════

┌──────────────────────────────────────────────────────────────────────────┐
│                          DEVELOPMENT FLOW                                │
└──────────────────────────────────────────────────────────────────────────┘

    dev-aadi ────┐
                 │
    dev-charlie ─┼───► dev Branch ──────┐
                 │          │            │
    dev-xyz ─────┘          │            │
                            │            │
                       (BLUE LINE)       │
                            │            │
                            │            │
                        CI/CD            │
                            │            │
                            ▼            │
              ┌─────────────────────────────────────┐
              │ RocketHacks Vercel Dev Project      │
              │ (Beta/Staging)                      │────────┐
              │                                     │        │
              │ URL: rockethacks-beta.vercel.app   │        │
              │ Access: Team only                   │        │
              └─────────────────────────────────────┘        │
                                                             │
                                                             │
┌──────────────────────────────────────────────────────────┼─────────────┐
│                    PRODUCTION FLOW                       │             │
└──────────────────────────────────────────────────────────┼─────────────┘
                                                             │
                            │                                │
                            │ (After testing)                │
                            │                                │
                            ▼                                │
                       main Branch ──────┐                   │
                            │            │                   │
                       (GREEN LINE)      │                   │
                            │            │                   │
                        CI/CD            │                   │
                            │            │                   │
                            ▼            │                   │
              ┌─────────────────────────────────────┐        │
              │ RocketHacks Vercel Main Project     │        │
              │ (Production)                        │────────┤
              │                                     │        │
              │ URL: www.rockethacks.org           │        │
              │ Access: Public                      │        │
              └─────────────────────────────────────┘        │
                            │                                │
                            │                                │
                            ▼                                │
                   RocketHacks Account                       │
                                                             │
                                                             │
                                                             │
                                                             │
┌──────────────────────────────────────────────────────────┼─────────────┐
│                       BACKEND (SHARED)                   │             │
└──────────────────────────────────────────────────────────┼─────────────┘
                                                             │
                            Both connect to:                 │
                                   │                         │
                                   ▼                         │
              ┌─────────────────────────────────────┐        │
              │  RocketHacks Supabase Instance      │◄───────┘
              │                                     │
              │  • PostgreSQL Database              │
              │  • Row Level Security (RLS)         │
              │  • Authentication Service           │
              │  • Connection Pooling               │
              └─────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════
```

## Detailed Flow Explanation

### Development Workflow (Blue Line)

```
Developer → Feature Branch (dev-xxx) → Create PR → Review → Merge to dev
                                                                  │
                                                                  ▼
                                                            Vercel detects push
                                                                  │
                                                                  ▼
                                                          Auto-build & deploy
                                                                  │
                                                                  ▼
                                              Beta site updated (rockethacks-beta.vercel.app)
                                                                  │
                                                                  ▼
                                                        Team tests on beta site
                                                                  │
                                                                  ▼
                                                      Feedback → Fix → Repeat
```

### Production Workflow (Green Line)

```
Beta Testing Complete (24-48 hours) → Create PR (dev → main) → Review
                                                                  │
                                                                  ▼
                                                        Approval by team lead
                                                                  │
                                                                  ▼
                                                            Merge to main
                                                                  │
                                                                  ▼
                                                          Vercel detects push
                                                                  │
                                                                  ▼
                                                       Auto-build & deploy
                                                                  │
                                                                  ▼
                                              Production site updated (www.rockethacks.org)
                                                                  │
                                                                  ▼
                                                       Monitor for issues
```

## Environment Comparison Table

```
┌─────────────────────┬────────────────────────┬──────────────────────────┐
│ Component           │ Dev/Beta (Blue)        │ Production (Green)       │
├─────────────────────┼────────────────────────┼──────────────────────────┤
│ Git Branch          │ dev                    │ main                     │
├─────────────────────┼────────────────────────┼──────────────────────────┤
│ Vercel Project      │ rockethacks-beta       │ rockethacks-production   │
├─────────────────────┼────────────────────────┼──────────────────────────┤
│ URL                 │ *.vercel.app           │ www.rockethacks.org      │
├─────────────────────┼────────────────────────┼──────────────────────────┤
│ Purpose             │ Team testing/QA        │ Public website           │
├─────────────────────┼────────────────────────┼──────────────────────────┤
│ Auto-deploy         │ ✅ On push to dev      │ ✅ On push to main       │
├─────────────────────┼────────────────────────┼──────────────────────────┤
│ Supabase Instance   │ Shared (same)          │ Shared (same)            │
├─────────────────────┼────────────────────────┼──────────────────────────┤
│ RLS Protection      │ ✅ Enabled             │ ✅ Enabled               │
├─────────────────────┼────────────────────────┼──────────────────────────┤
│ Security Level      │ Standard               │ Maximum                  │
├─────────────────────┼────────────────────────┼──────────────────────────┤
│ Monitoring          │ Basic                  │ Comprehensive            │
├─────────────────────┼────────────────────────┼──────────────────────────┤
│ Access Control      │ Team only (not shared) │ Public                   │
└─────────────────────┴────────────────────────┴──────────────────────────┘
```

## Data Flow (Both Environments)

```
User Browser
      │
      ├─── Static Assets (HTML/CSS/JS) ───► Vercel CDN (Edge)
      │                                           │
      │                                           ├─ Cache Hit → Return
      │                                           └─ Cache Miss → Origin
      │
      └─── API Requests ───► Vercel Serverless Function
                                      │
                                      ├─ Auth Request ─────► Supabase Auth
                                      │                           │
                                      │                     ┌─────▼─────┐
                                      │                     │  Validate │
                                      │                     │    JWT    │
                                      │                     └─────┬─────┘
                                      │                           │
                                      ├─ Data Request ────► Supabase API Gateway
                                                                   │
                                                            ┌──────▼──────┐
                                                            │  RLS Check  │
                                                            │  (Security) │
                                                            └──────┬──────┘
                                                                   │
                                                            PostgreSQL DB
                                                                   │
                                                            ┌──────▼──────┐
                                                            │ Return data │
                                                            │ (filtered)  │
                                                            └─────────────┘
```

## Security Layers (Both Environments)

```
Layer 1: Browser
├─ XSS Protection (React auto-escape)
├─ CSRF Tokens (Supabase session)
└─ Input Validation (Client-side)

Layer 2: Vercel Edge
├─ HTTPS/TLS Encryption
├─ DDoS Protection
├─ Security Headers (HSTS, X-Frame-Options, etc.)
└─ Rate Limiting (Edge-level)

Layer 3: Next.js Middleware
├─ Session Validation
├─ Route Protection (/admin, /dashboard, /apply)
├─ Token Refresh
└─ Redirect Unauthorized Users

Layer 4: Supabase API Gateway
├─ JWT Signature Verification
├─ Rate Limiting (per IP)
├─ Request Validation
└─ Query Parsing

Layer 5: PostgreSQL RLS
├─ Policy Evaluation (EVERY query)
├─ User Context (auth.uid())
├─ Row-level Filtering
└─ Access Control (Cannot be bypassed)
```

## Migration Path (From Red to Blue/Green)

```
Current State (Red Line):
┌─────────────────────────────────────────┐
│ main → Vedants Vercel → Vedants Account│ ← Need to migrate away
└─────────────────────────────────────────┘

Step 1: Set up new infrastructure
┌──────────────────────────────────────────────────────────┐
│ Create: RocketHacks Vercel Account                      │
│ Create: Beta Project (connects to dev branch)           │
│ Create: Prod Project (connects to main branch)          │
└──────────────────────────────────────────────────────────┘

Step 2: Test new infrastructure
┌──────────────────────────────────────────────────────────┐
│ Test: Beta deployment works                             │
│ Test: Production deployment works                       │
│ Test: Database connections work                         │
│ Test: Authentication flows work                         │
└──────────────────────────────────────────────────────────┘

Step 3: DNS cutover
┌──────────────────────────────────────────────────────────┐
│ Update: DNS points to new Vercel project                │
│ Monitor: Traffic switches successfully                  │
│ Verify: All features work on new deployment             │
└──────────────────────────────────────────────────────────┘

Step 4: Cleanup
┌──────────────────────────────────────────────────────────┐
│ Archive: Old Vedants Vercel project                     │
│ Document: Migration for team records                    │
└──────────────────────────────────────────────────────────┘

Target State (Blue + Green Lines):
┌─────────────────────────────────────────────────────────┐
│ dev → Beta Vercel → RocketHacks Account (Blue Line)    │
│ main → Prod Vercel → RocketHacks Account (Green Line)  │
└─────────────────────────────────────────────────────────┘
```

## Quick Reference

### Developer Daily Workflow
```bash
# 1. Work on your feature branch
git checkout dev-aadi
git pull origin dev-aadi

# 2. Make changes and commit
git add .
git commit -m "feat: Your feature"
git push origin dev-aadi

# 3. Create PR to dev branch
gh pr create --base dev --head dev-aadi

# 4. After merge, test on beta
open https://rockethacks-beta.vercel.app
```

### Release to Production Workflow
```bash
# 1. After beta testing (24-48 hours)
git checkout dev
git pull origin dev

# 2. Create release PR
gh pr create --base main --head dev --title "Release: YYYY-MM-DD"

# 3. After approval and merge
# Production auto-deploys to www.rockethacks.org

# 4. Monitor production
open https://vercel.com/dashboard
open https://app.supabase.com/project/mbtawwfpisxvxzicqebl
```

### Emergency Rollback
```bash
# Vercel Dashboard (fastest)
# Go to: Deployments → Find working version → Promote to Production

# Or via Git
git checkout main
git revert HEAD
git push origin main
```

---

## Summary

Your deployment architecture provides:

✅ **Separation of Concerns**: Dev (testing) vs Main (production)
✅ **Safe Testing Environment**: Beta site for team to validate changes
✅ **Automatic Deployments**: CI/CD on both branches
✅ **Shared Backend**: Single Supabase instance (RLS provides security)
✅ **Clear Promotion Path**: Feature → Dev → Main
✅ **Easy Rollbacks**: Multiple rollback options
✅ **Team Collaboration**: PR-based workflow with reviews
✅ **Account Ownership**: Migration to RocketHacks-controlled infrastructure

This is a professional, industry-standard setup used by many production web applications!
