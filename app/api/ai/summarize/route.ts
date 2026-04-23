import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// Free tier limit
const FREE_MONTHLY_LIMIT = 5

export async function POST(request: Request) {
  try {
    // 1. Auth check
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Get user profile + plan
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, ai_summaries_used_this_month')
      .eq('id', user.id)
      .single()

    // 3. Rate limit check for free users
    if (!profile || profile.plan === 'free') {
      const used = profile?.ai_summaries_used_this_month ?? 0
      if (used >= FREE_MONTHLY_LIMIT) {
        return NextResponse.json({
          error: 'Monthly limit reached',
          message: `Free plan includes ${FREE_MONTHLY_LIMIT} AI summaries per month. Upgrade to Pro for unlimited access.`,
          upgrade: true
        }, { status: 429 })
      }
    }

    // 4. Get request body
    const { judgementText, judgementTitle, court, date } = await request.json()

    if (!judgementText) {
      return NextResponse.json({ error: 'No judgement text provided' }, { status: 400 })
    }

    // 5. Call Claude API — server side, key never exposed to client
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: `You are a senior Indian tax law analyst. Analyze this judgement and provide a structured summary.

Judgement: ${judgementTitle || 'Unknown'}
Court: ${court || 'Unknown'}
Date: ${date || 'Unknown'}

Full text:
${judgementText.substring(0, 8000)}

Respond in this exact JSON format:
{
  "issue": "The precise legal question decided (1-2 sentences)",
  "facts": "Key facts of the case (2-3 sentences)",
  "held": "The court's ruling and reasoning (2-3 sentences)",
  "ratio": "The legal principle established (1-2 sentences)",
  "sections": ["Section 74 CGST", "Section 73"],
  "outcome": "assessee_favoured" or "revenue_favoured" or "mixed",
  "impact": "landmark" or "high" or "medium" or "low",
  "practitioner_note": "What this means for your practice (1-2 sentences)",
  "verify_note": "Specific aspects to verify before citing"
}

Be precise. If uncertain about any field, say so clearly. Never hallucinate citations.`
      }]
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

    let summary
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      summary = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: responseText }
    } catch {
      summary = { raw: responseText }
    }

    // 6. Increment usage counter for free users
    if (!profile || profile.plan === 'free') {
      await supabase
        .from('profiles')
        .update({ ai_summaries_used_this_month: (profile?.ai_summaries_used_this_month ?? 0) + 1 })
        .eq('id', user.id)
    }

    // 7. Log the summary
    await supabase.from('ai_summaries').insert({
      user_id: user.id,
      judgement_title: judgementTitle,
      court,
      summary_json: summary,
      model_used: 'claude-sonnet-4-20250514',
      tokens_used: message.usage.input_tokens + message.usage.output_tokens,
    })

    return NextResponse.json({ summary })

  } catch (error) {
    console.error('AI summary error:', error)
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 })
  }
}
