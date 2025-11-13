# 📚 RocketHacks Documentation Index

**Last Updated**: November 12, 2025

This guide helps you navigate the documentation and find what you need quickly.

---

## 🎯 What Do You Need?

### "I want to set up the dev Vercel project NOW"
→ **Read: DEV_VERCEL_SETUP.md** (5 min quick start)

### "I need detailed step-by-step instructions with screenshots"
→ **Read: DEV_ENVIRONMENT_SETUP.md** (comprehensive guide)

### "I'm ready to deploy to production"
→ **Read: DEPLOYMENT_GUIDE.md** (includes load testing)

### "I have security questions"
→ **Read: SECURITY_FAQ.md** (all your questions answered)

---

## 📋 Documentation Files

### Core Documentation (Keep These)

| File | Purpose | When to Use |
|------|---------|-------------|
| **README.md** | Project overview | First file to read |
| **DEV_VERCEL_SETUP.md** | Quick dev setup (NEW!) | Setting up dev Vercel now |
| **DEV_ENVIRONMENT_SETUP.md** | Detailed setup guide | Need step-by-step with screenshots |
| **DEPLOYMENT_GUIDE.md** | Full deployment guide | Production deployment |
| **SECURITY_FAQ.md** | Security Q&A | Security concerns |

### Supporting Files

| File | Purpose |
|------|---------|
| `k6_load_test.js` | Load testing script |
| `artillery_config.yml` | Alternative load test config |
| `supabase/schema.sql` | Database schema |
| `supabase/fix_admin_rls.sql` | Security fix (run before deploying) |

---

## 🗑️ Cleaned Up (Deleted)

These files were **removed** because they were redundant or outdated:

- ❌ DEPLOYMENT_TEST.md (info in DEPLOYMENT_GUIDE)
- ❌ DEPLOYMENT_CHECKLIST.md (info in DEPLOYMENT_GUIDE)
- ❌ DEPLOYMENT_SUMMARY.md (redundant)
- ❌ DEPLOYMENT_README.md (redundant)
- ❌ DEPLOYMENT_ARCHITECTURE.md (redundant)
- ❌ ADMIN_SETUP.md (covered in guides)
- ❌ ADMIN_RESUME_FIXES.md (old fixes)
- ❌ APPLICATION_FIXES.md (old fixes)
- ❌ README_FIXES.md (old fixes)
- ❌ FIXES_SUMMARY.md (old fixes)
- ❌ CRITICAL_FIXES_ROUND2.md (old fixes)
- ❌ IMPLEMENTATION_CHECKLIST.md (redundant)
- ❌ BRANCHING_STRATEGY.md (now in README)
- ❌ CLAUDE.md (not needed)
- ❌ SECURITY_AUDIT.md (info in SECURITY_FAQ)

---

## 🚀 Quick Start Flow

```
1. Read README.md (5 min)
        ↓
2. Read DEV_VERCEL_SETUP.md (5 min)
        ↓
3. Set up dev Vercel project (20 min)
        ↓
4. Test on dev site (30 min)
        ↓
5. Read DEPLOYMENT_GUIDE.md when ready for production
```

---

## 🔑 Key Concepts

### Development Workflow

```
Feature Branch → dev Branch (PR) → Dev Vercel (Auto-deploy)
                                          ↓
                                    Test 24-48 hours
                                          ↓
                   dev → main (PR) → Production Vercel (Auto-deploy)
```

### Security Model

- **RLS (Row Level Security)**: Main defense at database level
- **Exposed anon key is SAFE**: RLS protects data
- **Middleware**: Protects routes at application level
- **Admin emails**: Verified via environment variable

### Architecture

```
Browser → Vercel (hosting) → Supabase (database + auth)
```

Both dev and production Vercel projects connect to the **same** Supabase database, secured by RLS.

---

## 💡 Common Questions

### Q: Which file do I read first?
**A**: Start with **DEV_VERCEL_SETUP.md** for quick setup, or **DEV_ENVIRONMENT_SETUP.md** for detailed guide.

### Q: Is it safe to have both dev and prod use the same database?
**A**: Yes! Row Level Security (RLS) ensures users only see their own data. Read **SECURITY_FAQ.md** for details.

### Q: How do I deploy to production?
**A**: Follow **DEPLOYMENT_GUIDE.md** after testing on dev site for 24-48 hours.

### Q: What if something breaks?
**A**: Rollback options in **DEPLOYMENT_GUIDE.md** under "Rollback Procedures".

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| Auth not working | Check Supabase redirect URLs |
| Admin locked out | Verify `ADMIN_EMAILS` environment variable |
| Build fails | Check Vercel build logs |
| Slow performance | Run load tests, check Supabase query logs |

**Detailed troubleshooting**: See DEPLOYMENT_GUIDE.md → "Common Issues"

---

## 📞 Resources

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs

---

## ✅ Checklist: Am I Ready to Deploy?

**Dev Environment:**
- [ ] Read DEV_VERCEL_SETUP.md
- [ ] Created dev Vercel project
- [ ] Configured environment variables
- [ ] Added Supabase redirect URL
- [ ] Tested authentication flow
- [ ] Tested application submission
- [ ] Verified admin access

**Production (After 24-48 hours of dev testing):**
- [ ] Read DEPLOYMENT_GUIDE.md
- [ ] All tests pass on dev site
- [ ] Load testing completed
- [ ] Team approval received
- [ ] Created production Vercel project
- [ ] Configured custom domain
- [ ] Monitoring set up

---

**Need help?** All documentation is now consolidated into 5 core files. Start with DEV_VERCEL_SETUP.md for your immediate need!
