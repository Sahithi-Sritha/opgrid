# AWS Migration Guide - Make OpGrid Challenge Eligible

This guide will help you migrate OpGrid to AWS services to qualify for the Weekend Challenge.

## 🎯 Goal
Replace Railway/Render backend with AWS Lambda + EventBridge + Bedrock while keeping everything else the same.

**Time estimate**: 2-3 hours

---

## Prerequisites

1. **AWS Account** - [Sign up](https://aws.amazon.com/free/) for Free Tier ($200 credits)
2. **AWS CLI** - [Install guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
3. **AWS SAM CLI** - [Install guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)

```bash
# Verify installations
aws --version
sam --version
```

---

## Step 1: Restructure Agent for Lambda

### 1.1 Create Lambda Handler Structure

Create new directory structure:

```bash
cd agent
mkdir -p src/lambda
```

### 1.2 Create Lambda Handlers

**File: `agent/src/lambda/scraper.ts`**
```typescript
import { ScheduledHandler } from 'aws-lambda';
import { scrapeLinkedIn } from '../scrapers/linkedin';
import { scrapeWellfound } from '../scrapers/wellfound';
import { scrapeYC } from '../scrapers/yc';
import { scrapeTelegram } from '../scrapers/telegram';
import { scrapeCareerPages } from '../scrapers/career-pages';
import { supabase } from '../config/supabase';

export const handler: ScheduledHandler = async (event) => {
  console.log('Starting scrape job', event);
  
  const results = await Promise.allSettled([
    scrapeLinkedIn(),
    scrapeWellfound(),
    scrapeYC(),
    scrapeTelegram(),
    scrapeCareerPages()
  ]);
  
  const allOpportunities = results
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => (r as PromiseFulfilledResult<any>).value);
  
  console.log(`Scraped ${allOpportunities.length} opportunities`);
  
  // Insert to Supabase
  for (const opp of allOpportunities) {
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .insert(opp)
        .select()
        .single();
      
      if (!error && data) {
        // Trigger classification Lambda
        await triggerClassification(data.id);
      }
    } catch (err) {
      console.error('Insert error:', err);
    }
  }
  
  return {
    statusCode: 200,
    body: JSON.stringify({ scraped: allOpportunities.length })
  };
};

async function triggerClassification(opportunityId: string) {
  // Will be handled by Supabase webhook → EventBridge → Lambda
  // Or invoke Lambda directly here
}
```

**File: `agent/src/lambda/classifier.ts`**
```typescript
import { Handler } from 'aws-lambda';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { supabase } from '../config/supabase';

const bedrock = new BedrockRuntimeClient({ region: 'us-east-1' });

export const handler: Handler = async (event) => {
  // Event can be from EventBridge or direct invocation
  const opportunityId = event.detail?.opportunityId || event.opportunityId;
  
  const { data: opp } = await supabase
    .from('opportunities')
    .select('*')
    .eq('id', opportunityId)
    .single();
  
  if (!opp) {
    return { statusCode: 404, body: 'Opportunity not found' };
  }
  
  // Call Amazon Bedrock instead of Anthropic API
  const prompt = `Analyze this job posting and extract tags:

Title: ${opp.title}
Company: ${opp.company}
Description: ${opp.description}

Return JSON with:
- tags: array of strings (possible: "internship", "remote", "stipend", "OA", "referral")
- deadline: ISO date string or null
- stipend_amount: number or null

JSON only, no explanation.`;

  const command = new InvokeModelCommand({
    modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0', // Claude via Bedrock
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 500,
      messages: [
        { role: 'user', content: prompt }
      ]
    })
  });
  
  const response = await bedrock.send(command);
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));
  const content = responseBody.content[0].text;
  
  let tags = [];
  let deadline = null;
  let stipend = null;
  
  try {
    const parsed = JSON.parse(content);
    tags = parsed.tags || [];
    deadline = parsed.deadline;
    stipend = parsed.stipend_amount;
  } catch (err) {
    console.error('Parse error:', err);
  }
  
  // Update opportunity
  await supabase
    .from('opportunities')
    .update({ tags, deadline, stipend })
    .eq('id', opportunityId);
  
  return { statusCode: 200, body: JSON.stringify({ tags, deadline, stipend }) };
};
```

**File: `agent/src/lambda/notifier.ts`**
```typescript
import { ScheduledHandler } from 'aws-lambda';
import { supabase } from '../config/supabase';
import { sendEmail } from '../notifier/email';
import { sendTelegram } from '../notifier/telegram';

export const handler: ScheduledHandler = async (event) => {
  // Get opportunities from last 24 hours
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  const { data: opportunities } = await supabase
    .from('opportunities')
    .select('*')
    .gte('created_at', yesterday)
    .order('created_at', { ascending: false });
  
  if (!opportunities || opportunities.length === 0) {
    console.log('No new opportunities');
    return { statusCode: 200, body: 'No new opportunities' };
  }
  
  // Send email digest
  await sendEmail({
    to: process.env.USER_EMAIL!,
    subject: `OpGrid Daily Digest - ${opportunities.length} New Opportunities`,
    html: generateDigestHTML(opportunities)
  });
  
  // Send Telegram summary
  await sendTelegram(`🚀 ${opportunities.length} new opportunities today!`);
  
  return {
    statusCode: 200,
    body: JSON.stringify({ sent: opportunities.length })
  };
};

function generateDigestHTML(opportunities: any[]) {
  return `
    <h2>Your Daily OpGrid Digest</h2>
    <p>${opportunities.length} new opportunities found in the last 24 hours</p>
    ${opportunities.map(opp => `
      <div style="border: 1px solid #ccc; padding: 10px; margin: 10px 0;">
        <h3>${opp.title}</h3>
        <p><strong>${opp.company}</strong></p>
        <p>Tags: ${opp.tags?.join(', ') || 'None'}</p>
        <a href="${opp.url}">View Posting</a>
      </div>
    `).join('')}
  `;
}
```

**File: `agent/src/lambda/deadlines.ts`**
```typescript
import { ScheduledHandler } from 'aws-lambda';
import { supabase } from '../config/supabase';
import { sendTelegram } from '../notifier/telegram';

export const handler: ScheduledHandler = async (event) => {
  const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
  const now = new Date().toISOString();
  
  const { data: deadlines } = await supabase
    .from('opportunities')
    .select('*')
    .gte('deadline', now)
    .lte('deadline', threeDaysFromNow)
    .is('seen_at', null); // Only unseen opportunities
  
  if (!deadlines || deadlines.length === 0) {
    return { statusCode: 200, body: 'No upcoming deadlines' };
  }
  
  for (const opp of deadlines) {
    await sendTelegram(
      `⏰ Deadline Alert!\n\n` +
      `${opp.title} at ${opp.company}\n` +
      `Closes: ${new Date(opp.deadline).toLocaleDateString()}\n` +
      `Link: ${opp.url}`
    );
  }
  
  return {
    statusCode: 200,
    body: JSON.stringify({ alerts: deadlines.length })
  };
};
```

### 1.3 Add AWS SDK Dependencies

```bash
cd agent
npm install @aws-sdk/client-bedrock-runtime @aws-sdk/client-s3
npm install -D @types/aws-lambda
```

Update `package.json`:
```json
{
  "scripts": {
    "build": "tsc",
    "package": "sam build"
  }
}
```

---

## Step 2: Create SAM Template

**File: `agent/template.yaml`**
```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: OpGrid Scraping Agent

Globals:
  Function:
    Timeout: 300
    MemorySize: 512
    Runtime: nodejs20.x
    Environment:
      Variables:
        SUPABASE_URL: !Ref SupabaseUrl
        SUPABASE_SERVICE_KEY: !Ref SupabaseServiceKey
        RESEND_API_KEY: !Ref ResendApiKey
        TELEGRAM_BOT_TOKEN: !Ref TelegramBotToken
        USER_EMAIL: !Ref UserEmail

Parameters:
  SupabaseUrl:
    Type: String
    Description: Supabase project URL
  SupabaseServiceKey:
    Type: String
    Description: Supabase service role key
    NoEcho: true
  ResendApiKey:
    Type: String
    Description: Resend API key
    NoEcho: true
  TelegramBotToken:
    Type: String
    Description: Telegram bot token
    NoEcho: true
  UserEmail:
    Type: String
    Description: Email for notifications

Resources:
  # Lambda Functions
  ScraperFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: dist/
      Handler: lambda/scraper.handler
      Events:
        ScrapeSchedule:
          Type: Schedule
          Properties:
            Schedule: rate(6 hours)
            Description: Run scraper every 6 hours
      Policies:
        - Statement:
            - Effect: Allow
              Action:
                - bedrock:InvokeModel
              Resource: '*'

  ClassifierFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: dist/
      Handler: lambda/classifier.handler
      Policies:
        - Statement:
            - Effect: Allow
              Action:
                - bedrock:InvokeModel
              Resource: '*'

  NotifierFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: dist/
      Handler: lambda/notifier.handler
      Events:
        DailyDigest:
          Type: Schedule
          Properties:
            Schedule: cron(0 9 * * ? *)
            Description: Send daily digest at 9 AM UTC

  DeadlineFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: dist/
      Handler: lambda/deadlines.handler
      Events:
        DeadlineCheck:
          Type: Schedule
          Properties:
            Schedule: cron(0 8 * * ? *)
            Description: Check deadlines at 8 AM UTC

  # S3 Bucket for raw HTML storage
  RawHtmlBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'opgrid-raw-html-${AWS::AccountId}'
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldHtml
            Status: Enabled
            ExpirationInDays: 30

Outputs:
  ScraperFunctionArn:
    Description: Scraper Lambda ARN
    Value: !GetAtt ScraperFunction.Arn
  ClassifierFunctionArn:
    Description: Classifier Lambda ARN
    Value: !GetAtt ClassifierFunction.Arn
  RawHtmlBucketName:
    Description: S3 bucket for raw HTML
    Value: !Ref RawHtmlBucket
```

---

## Step 3: Deploy to AWS

### 3.1 Build

```bash
cd agent
npm run build
```

### 3.2 Deploy with SAM

```bash
sam deploy --guided
```

Answer prompts:
- Stack Name: `opgrid-agent`
- AWS Region: `us-east-1` (or your preferred region)
- Parameter SupabaseUrl: `https://your-project.supabase.co`
- Parameter SupabaseServiceKey: `your-service-key`
- Parameter ResendApiKey: `re_xxx`
- Parameter TelegramBotToken: `123456:ABC-xxx`
- Parameter UserEmail: `your@email.com`
- Confirm changes: `y`
- Allow SAM CLI IAM role creation: `y`
- Save arguments to config: `y`

### 3.3 Verify Deployment

```bash
# Check Lambda functions
aws lambda list-functions --query 'Functions[?starts_with(FunctionName, `opgrid`)].FunctionName'

# Check EventBridge rules
aws events list-rules --name-prefix opgrid

# Test scraper function
aws lambda invoke --function-name opgrid-agent-ScraperFunction response.json
cat response.json
```

---

## Step 4: Update Documentation

### 4.1 Update README.md

Replace the "Deployment" section with:

```markdown
## 🌐 Deployment

### Frontend (Vercel)
```bash
cd frontend
vercel --prod
```

### Agent (AWS Lambda)
```bash
cd agent
npm run build
sam deploy
```

### Database (Supabase)
Already hosted! Just run `schema.sql` in SQL Editor.
```

### 4.2 Update ARCHITECTURE.md

Add AWS services section to the architecture diagram.

### 4.3 Update Cost Breakdown

```markdown
## 💰 Cost Breakdown (Monthly)

| Service | Free Tier | Paid | Monthly Cost |
|---------|-----------|------|--------------|
| AWS Lambda | 1M free requests | Pay-per-use | $0-5 |
| Amazon Bedrock | $200 credits (2 months) | Pay-per-token | $0-10 |
| Amazon EventBridge | 1M free events | Pay-per-event | $0 |
| Amazon S3 | 5GB free | Pay-per-GB | $0-2 |
| Vercel | ✅ Yes | Pro | $0-20 |
| Supabase | ✅ Yes | Pro | $0-25 |
| Resend | 100 emails/day | Pro | $0-10 |
| **Total** | **$0-15/mo** | **Full** | **$50-60/mo** |
```

---

## Step 5: Test Everything

### 5.1 Test Scraper

```bash
# Manually invoke scraper
aws lambda invoke --function-name opgrid-agent-ScraperFunction response.json

# Check CloudWatch logs
aws logs tail /aws/lambda/opgrid-agent-ScraperFunction --follow
```

### 5.2 Test Classifier

```bash
# Get an opportunity ID from Supabase
# Then test classifier
aws lambda invoke \
  --function-name opgrid-agent-ClassifierFunction \
  --payload '{"opportunityId": "uuid-here"}' \
  response.json
```

### 5.3 Test Notifier

```bash
# Manually invoke daily digest
aws lambda invoke --function-name opgrid-agent-NotifierFunction response.json
```

### 5.4 Check Supabase

Open Supabase dashboard → Table Editor → `opportunities`
- Should see new rows with tags populated

---

## Step 6: Create GitHub Repo (Public)

```bash
# Initialize git (if not already)
git init
git add .
git commit -m "Initial commit - OpGrid AWS version"

# Create repo on GitHub, then:
git remote add origin https://github.com/yourusername/opgrid.git
git push -u origin main
```

Make sure `.env` files are in `.gitignore`!

---

## Step 7: Write & Publish Article

1. Copy `WEEKEND_CHALLENGE_ARTICLE.md` content
2. Update placeholders:
   - Your GitHub repo URL
   - Your live app URL (Vercel)
   - Your actual numbers (opportunities scraped, etc.)
3. Add screenshots:
   - Feed page showing opportunities
   - AWS Lambda console showing functions
   - EventBridge rules
   - Bedrock invocation logs
4. Go to [AWS Builder Center](https://community.aws/)
5. Click "Write an Article"
6. Paste content, add tag `#productivity`
7. Publish!

---

## Troubleshooting

### Lambda timeout
- Increase timeout in `template.yaml` (`Timeout: 600`)

### Bedrock access denied
- Check IAM permissions in SAM template
- Ensure you requested Bedrock model access in AWS Console

### Cold start issues
- Add provisioned concurrency (costs money)
- Or accept 2-3 second cold start

### Environment variables not working
- Check SSM Parameter Store
- Use `sam local invoke` to test locally

---

## Free Tier Limits

- **Lambda**: 1M requests/month, 400,000 GB-seconds compute
- **Bedrock**: $200 credits for 2 months (new accounts)
- **EventBridge**: 1M events/month
- **S3**: 5GB storage, 20,000 GET requests, 2,000 PUT requests
- **CloudWatch**: 5GB logs, 10 custom metrics

**Your usage**:
- Scraping 4x/day = 120 Lambda invocations/month
- Classification ~200 opportunities/month = 200 Bedrock calls (~$0.60)
- EventBridge = 120 events/month
- S3 = ~50MB/month

**Total AWS cost: $0-5/month** ✅

---

## Next Steps

1. Monitor CloudWatch logs for errors
2. Set up CloudWatch alarms for Lambda failures
3. Add X-Ray tracing for debugging
4. Consider adding API Gateway for manual triggers
5. Add Step Functions for complex workflows (future)

---

**You're now eligible for the Weekend Challenge! 🎉**

Deploy, test, take screenshots, write article, submit before August 3 @ 1 PM PT.
