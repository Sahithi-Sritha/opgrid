import { Router } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '../config/supabase';

import { getGeminiKey } from '../utils/gemini-keys';

const router = Router();

router.post('/parse', async (req, res) => {
  const { text } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Valid text is required' });
  }

  try {
    const genAI = new GoogleGenerativeAI(getGeminiKey());
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Analyze the following unstructured text and extract any opportunities, deadlines, and timelines mentioned.
For each opportunity found, extract:
1. company (string)
2. title (string, default to "Unknown Position" if not specified)
3. deadline (string in YYYY-MM-DD format, or null if not specified. Use year 2026 if year is not specified.)
4. status (string: choose from 'to_apply', 'applied', 'oa_received', 'oa_done', 'interview', 'rejected', 'offer'. Infer based on context. If someone says "applied" or "already applied", use 'applied'. If it's just a deadline/timeline, use 'to_apply')
5. notes (string, any extra context or timeline details, or null)
6. url (string, any link/URL mentioned for this opportunity, or null)

Extract EVERY single opportunity mentioned. Do NOT skip any. Even single mentions like "Adobe Student Insider apply 19th June" should be extracted.

Respond ONLY with a valid JSON array of objects. No markdown formatting or code blocks.
Example: [{"company":"Google","title":"SWE Intern","deadline":"2026-10-31","status":"to_apply","notes":"Application opens Oct 1","url":null}]

Text to analyze:
"""
${text}
"""`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const cleanedText = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    
    let parsedData;
    try {
      parsedData = JSON.parse(cleanedText);
    } catch (e) {
      console.error("Failed to parse Gemini output:", cleanedText);
      return res.status(500).json({ error: 'AI returned invalid data format' });
    }

    if (!Array.isArray(parsedData)) {
      parsedData = [parsedData];
    }

    const createdApps = [];

    for (const item of parsedData) {
      if (!item.company) continue;

      // 1. Insert opportunity
      const oppData: any = {
        title: item.title || 'Unknown Position',
        company: item.company,
        deadline: item.deadline || null,
        url: item.url || 'pasted-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        source: 'career_page'
      };

      const { data: newOpp, error: oppError } = await supabase
        .from('opportunities')
        .insert(oppData)
        .select('id')
        .single();

      if (oppError || !newOpp) {
        console.error("Failed to insert opportunity:", oppError);
        continue;
      }

      // 2. Insert application
      const appData = {
        opportunity_id: newOpp.id,
        status: item.status || 'to_apply',
        notes: item.notes || null,
        applied_date: new Date().toISOString()
      };

      const { data: newApp, error: appError } = await supabase
        .from('applications')
        .insert(appData)
        .select()
        .single();

      if (appError) {
        console.error("Failed to insert application:", appError);
      } else {
        createdApps.push({ ...newApp, opportunities: { ...oppData, id: newOpp.id } });
      }
    }

    res.status(200).json({ message: 'Successfully parsed and tracked', parsed: createdApps });
  } catch (error: any) {
    console.error('Error parsing timelines:', error);
    if (error.status === 429) {
      return res.status(429).json({ error: 'Gemini API Rate Limit Exceeded. Please wait a minute and try again.' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update application status, notes, etc.
router.patch('/application/:id', async (req, res) => {
  const { id } = req.params;
  const { status, notes, referral_name } = req.body;

  const updates: any = {};
  if (status !== undefined) updates.status = status;
  if (notes !== undefined) updates.notes = notes;
  if (referral_name !== undefined) updates.referral_name = referral_name;

  const { data, error } = await supabase
    .from('applications')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.json(data);
});

// Update opportunity details (company, title, deadline, url)
router.patch('/opportunity/:id', async (req, res) => {
  const { id } = req.params;
  const { company, title, deadline, url } = req.body;

  const updates: any = {};
  if (company !== undefined) updates.company = company;
  if (title !== undefined) updates.title = title;
  if (deadline !== undefined) updates.deadline = deadline || null;
  if (url !== undefined) updates.url = url;

  const { data, error } = await supabase
    .from('opportunities')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.json(data);
});

export default router;
