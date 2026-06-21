# 🔄 AWS Migration Plan

## Current Stack → AWS Stack

| Current (Supabase) | New (AWS) | Purpose |
|-------------------|-----------|---------|
| Supabase Auth | **AWS Cognito** | User authentication |
| Supabase PostgreSQL | **AWS RDS PostgreSQL** | Database |
| Supabase Realtime | **AWS AppSync + GraphQL** | Real-time subscriptions |
| Supabase Storage | **AWS S3** | Resume/PDF storage |
| Supabase Edge Functions | **AWS Lambda** | Serverless functions (optional) |

---

## Architecture Changes

### Frontend
- Replace `@supabase/supabase-js` with:
  - `aws-amplify` (for Cognito auth + AppSync)
  - `@aws-sdk/client-s3` (for S3 uploads)
  
### Agent Backend
- Replace `@supabase/supabase-js` with:
  - `pg` (direct PostgreSQL client for RDS)
  - `@aws-sdk/client-cognito-identity-provider` (for user management)
  - `@aws-sdk/client-s3` (for file storage)

### Database
- Export Supabase schema to RDS PostgreSQL
- Update connection strings
- Remove Supabase-specific functions (use standard PostgreSQL)

---

## Implementation Steps

1. **Setup AWS Services** (via AWS Console or CDK)
2. **Update Frontend** (Amplify + Cognito)
3. **Update Agent Backend** (pg + AWS SDK)
4. **Migrate Database Schema** (RDS PostgreSQL)
5. **Update Environment Variables**
6. **Test All Features**

---

## Estimated Time
- Setup AWS: 30 min
- Code migration: 2-3 hours
- Testing: 30 min

---

## Cost Comparison

### Supabase Free Tier
- ✅ 500MB database
- ✅ 1GB file storage
- ✅ 2 million rows
- ✅ Realtime

### AWS Free Tier (12 months)
- ✅ RDS: 750 hours/month (db.t2.micro)
- ✅ S3: 5GB storage
- ✅ Cognito: 50,000 MAUs free forever
- ✅ Lambda: 1M requests/month
- ✅ AppSync: 250k queries/month

**Both are essentially free for this use case.**

---

## Let's Start!

Proceeding with full AWS migration...
