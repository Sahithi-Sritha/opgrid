/**
 * Test script to verify Bedrock integration
 * Run: npx tsx test-bedrock.ts
 */

import { classifyOpportunity } from './src/classifier/tagger'
import type { Opportunity } from './src/config/supabase'

// Mock opportunity for testing
const testOpportunity: Opportunity = {
  id: 'test-123',
  title: 'Software Engineering Intern - Summer 2025',
  company: 'Google',
  source: 'linkedin',
  url: 'https://example.com/job/123',
  description: 'We are looking for a software engineering intern for our Cloud team. This is a paid internship with potential for return offer (PPO). Remote work available. Deadline: March 15, 2025.',
  category: 'internship',
  location: 'Remote',
  created_at: new Date().toISOString(),
  seen_at: null,
  tags: [],
  is_remote: false,
  stipend: null,
  deadline: null,
  ppo_possible: false,
  prize_pool: null,
  team_size: null,
}

async function test() {
  console.log('🧪 Testing OpGrid Classifier with Bedrock Integration\n')
  console.log('📋 Test Opportunity:')
  console.log(`   Title: ${testOpportunity.title}`)
  console.log(`   Company: ${testOpportunity.company}`)
  console.log(`   Description: ${testOpportunity.description}\n`)

  // Check environment
  const usingBedrock = !!process.env.AWS_REGION
  console.log('🔧 Configuration:')
  console.log(`   AWS_REGION: ${process.env.AWS_REGION || 'NOT SET'}`)
  console.log(`   AWS_ACCESS_KEY_ID: ${process.env.AWS_ACCESS_KEY_ID ? '✅ SET' : '❌ NOT SET'}`)
  console.log(`   AWS_SECRET_ACCESS_KEY: ${process.env.AWS_SECRET_ACCESS_KEY ? '✅ SET' : '❌ NOT SET'}`)
  console.log(`   GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? '✅ SET' : '❌ NOT SET'}`)
  console.log(`   Using: ${usingBedrock ? '🔥 Amazon Bedrock' : '🤖 Google Gemini (fallback)'}\n`)

  if (!usingBedrock) {
    console.log('💡 TIP: Set AWS_REGION, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY to test Bedrock\n')
  }

  console.log('⏳ Classifying opportunity...\n')

  try {
    const startTime = Date.now()
    const result = await classifyOpportunity(testOpportunity)
    const duration = Date.now() - startTime

    if (!result) {
      console.log('❌ REJECTED: Opportunity was filtered out as irrelevant\n')
      return
    }

    console.log('✅ SUCCESS! Classification complete\n')
    console.log('📊 Results:')
    console.log(`   Tags: ${result.tags?.join(', ') || 'none'}`)
    console.log(`   Remote: ${result.is_remote ? 'Yes' : 'No'}`)
    console.log(`   Stipend: ${result.stipend || 'Not specified'}`)
    console.log(`   Deadline: ${result.deadline || 'Not specified'}`)
    console.log(`   PPO Possible: ${result.ppo_possible ? 'Yes' : 'No'}`)
    console.log(`   Duration: ${duration}ms\n`)

    // Verify expected tags
    const expectedTags = ['internship', 'remote', 'stipend', 'ppo_possible']
    const foundTags = result.tags || []
    const missingTags = expectedTags.filter(tag => !foundTags.includes(tag))

    if (missingTags.length === 0) {
      console.log('🎉 PERFECT! All expected tags detected:')
      expectedTags.forEach(tag => console.log(`   ✅ ${tag}`))
    } else {
      console.log('⚠️  Some tags missing (might be fine depending on AI interpretation):')
      expectedTags.forEach(tag => {
        if (foundTags.includes(tag)) {
          console.log(`   ✅ ${tag}`)
        } else {
          console.log(`   ❌ ${tag}`)
        }
      })
    }

    console.log('\n✨ Test Complete!\n')

    if (usingBedrock) {
      console.log('🔥 Amazon Bedrock Integration: WORKING ✅')
      console.log('📝 Next Steps:')
      console.log('   1. Deploy to Railway/Render with AWS env vars')
      console.log('   2. Check AWS Bedrock console for invocations')
      console.log('   3. Take screenshot for article\n')
    } else {
      console.log('🤖 Google Gemini Fallback: WORKING ✅')
      console.log('📝 Next Steps:')
      console.log('   1. Add AWS credentials to .env')
      console.log('   2. Run this test again to verify Bedrock')
      console.log('   3. Deploy to Railway/Render with AWS env vars\n')
    }

  } catch (error) {
    console.error('❌ ERROR during classification:\n')
    console.error(error)
    console.log('\n🔍 Troubleshooting:')
    
    if (usingBedrock) {
      console.log('   • Check AWS credentials are correct')
      console.log('   • Verify Bedrock model access in AWS Console')
      console.log('   • Ensure IAM user has bedrock:InvokeModel permission')
      console.log('   • Try unsetting AWS_REGION to test Gemini fallback')
    } else {
      console.log('   • Check GEMINI_API_KEY is set in .env')
      console.log('   • Verify API key is valid')
      console.log('   • Check internet connection')
    }
    console.log('')
  }
}

// Run test
test().catch(console.error)
