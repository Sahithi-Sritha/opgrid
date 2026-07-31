# 10-Minute AWS Bedrock Setup

Make OpGrid eligible for the Weekend Challenge by adding Amazon Bedrock.

## What Changed?

Just one file: `agent/src/classifier/tagger.ts` now calls Amazon Bedrock instead of only Gemini.

**Architecture**: 
- ✅ Amazon Bedrock (Claude 3 Haiku) - Primary AI classifier
- ✅ Google Gemini - Fallback if Bedrock unavailable
- ✅ Everything else stays the same (Railway, Supabase, Vercel)

---

## Step 1: Get AWS Credentials (3 min)

### 1.1 Create AWS Account
Go to [aws.amazon.com/free](https://aws.amazon.com/free) and sign up.
- You get **$200 in Bedrock credits** for 2 months
- No credit card charged during free tier

### 1.2 Create IAM User

1. Go to [IAM Console](https://console.aws.amazon.com/iam/)
2. Click **Users** → **Create user**
3. Username: `opgrid-agent`
4. Click **Next**
5. Select **Attach policies directly**
6. Search and select: `AmazonBedrockFullAccess`
7. Click **Next** → **Create user**

### 1.3 Create Access Key

1. Click on the user you just created (`opgrid-agent`)
2. Go to **Security credentials** tab
3. Scroll to **Access keys** → Click **Create access key**
4. Select: **Application running outside AWS**
5. Click **Next** → **Create access key**
6. **Copy the Access Key ID and Secret Access Key** (you'll need these!)

---

## Step 2: Enable Bedrock Model (2 min)

1. Go to [Bedrock Console](https://console.aws.amazon.com/bedrock/)
2. Click **Model access** in left sidebar
3. Click **Manage model access**
4. Find **Anthropic** section
5. Check the box for **Claude 3 Haiku**
6. Click **Request model access**
7. Wait 30 seconds for approval (usually instant)

---

## Step 3: Add AWS Credentials to Agent (1 min)

Edit `agent/.env` and add:

```bash
# AWS Bedrock (primary classifier)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

Replace with your actual credentials from Step 1.3.

---

## Step 4: Test It (2 min)

### 4.1 Restart Agent

```bash
cd agent
npm run dev
```

### 4.2 Watch Logs

You should see:
```
✓ Using Amazon Bedrock (Claude 3 Haiku)
✓ Classified opportunity: Software Engineer Intern at Google
  Tags: ["internship", "remote", "stipend"]
```

If you see errors, it falls back to Gemini automatically.

### 4.3 Verify in AWS Console

Go to [CloudWatch Logs](https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups) and check for Bedrock API calls.

Or check [Bedrock Invocation Logs](https://console.aws.amazon.com/bedrock/home?region=us-east-1#/overview).

---

## Step 5: Deploy to Railway/Render (2 min)

Add environment variables to your Railway/Render project:

**Railway:**
```bash
railway variables set AWS_REGION=us-east-1
railway variables set AWS_ACCESS_KEY_ID=AKIA...
railway variables set AWS_SECRET_ACCESS_KEY=wJal...
```

**Render:**
Go to your service → Environment → Add:
- `AWS_REGION` = `us-east-1`
- `AWS_ACCESS_KEY_ID` = `AKIA...`
- `AWS_SECRET_ACCESS_KEY` = `wJal...`

Redeploy your agent.

---

## Verification Checklist

✅ AWS account created  
✅ IAM user with Bedrock access created  
✅ Claude 3 Haiku model access granted  
✅ AWS credentials added to `.env`  
✅ Agent restarted and shows "Using Amazon Bedrock"  
✅ Opportunities getting tagged successfully  
✅ Deployed to Railway/Render with AWS env vars  

---

## Cost Estimate

**Per opportunity classified:**
- Claude 3 Haiku: ~500 tokens input + 100 tokens output = 600 tokens
- Cost: $0.00025 per 1K input tokens + $0.00125 per 1K output tokens
- **Total: ~$0.0003 per opportunity** (less than a penny per 30 opportunities)

**Monthly estimate (2000 opportunities):**
- 2000 × $0.0003 = **$0.60/month**
- Free for first 2 months with $200 credits ✅

---

## Troubleshooting

### Error: "Access denied to model"
→ Go back to Step 2 and enable Claude 3 Haiku model access

### Error: "The security token is invalid"
→ Check your AWS credentials are correct in `.env`

### Still using Gemini
→ Check `AWS_REGION` is set (code detects this to switch to Bedrock)

### "ResourceNotFoundException"
→ Make sure you're in `us-east-1` region (or change AWS_REGION to match)

---

## Fallback Behavior

If Bedrock fails for any reason (quota exceeded, API error, credentials missing), the code automatically falls back to Gemini. You'll see:

```
⚠️ Bedrock failed, using Gemini fallback
```

This ensures zero downtime even if AWS has issues.

---

## What Makes You Eligible Now?

✅ **Uses at least one AWS service**: Amazon Bedrock  
✅ **Actually functional**: Classifies every opportunity  
✅ **Clearly described**: AI-powered tagging is core feature  
✅ **In your architecture diagram**: Show Bedrock API calls  

You're good to submit! 🎉

---

## Next: Write Your Article

Use `WEEKEND_CHALLENGE_ARTICLE.md` as your template. Just update:
- Your GitHub repo URL
- Your live app URL (Vercel)
- Real numbers (how many opportunities scraped so far)
- Add screenshots of:
  - Your feed showing tagged opportunities
  - AWS Bedrock console showing invocations
  - CloudWatch logs (optional)

**Publish before August 3, 1 PM PT!**
