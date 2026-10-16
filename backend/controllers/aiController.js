/**
 * AI Controller - Course content enhancement using Google Gemini API
 * Endpoints: enhance-title, enhance-subtitle, enhance-description, suggest-category, generate-outline
 */
import AppError from '../utils/AppError.js';
import asyncHandler from '../middleware/asyncHandler.js';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function callGemini(prompt, apiKey, retries = 2) {
  if (!apiKey?.trim()) {
    throw new AppError('GEMINI_API_KEY is not configured. Set it in environment variables.', 500);
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (res.status === 429) {
      if (attempt < retries) {
        const waitMs = Math.pow(2, attempt + 1) * 1000;
        console.warn(`Gemini 429 rate limit, retrying in ${waitMs}ms (attempt ${attempt + 1}/${retries})`);
        await sleep(waitMs);
        continue;
      }
      // Carries its own statusCode so every handler below gets the right
      // response (429, not 500) without each one needing to catch this itself.
      throw new AppError('AI service rate limit exceeded. Please wait a minute and try again.', 429);
    }

    if (!res.ok) {
      const errText = await res.text();
      throw new AppError(`Gemini API error ${res.status}: ${errText.slice(0, 200)}`, 500);
    }

    const json = await res.json();
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) throw new AppError('No response from Gemini', 500);
    return text;
  }
}

/**
 * POST /api/ai/enhance-title
 * Body: { title: string }
 */
export const enhanceTitle = asyncHandler(async (req, res) => {
  const { title } = req.body;
  if (!title?.trim()) {
    throw new AppError('Title is required.', 400);
  }
  const apiKey = process.env.GEMINI_API_KEY;
  const prompt = `You are an expert course title writer for an online learning platform. Improve this course title to be more engaging, clear, and professional. Return ONLY the improved title, nothing else. No quotes, no explanation.

Original title: ${title}`;
  const enhancedTitle = await callGemini(prompt, apiKey);
  res.json({ success: true, data: { enhancedTitle } });
});

/**
 * POST /api/ai/enhance-subtitle
 * Body: { title: string, subtitle?: string }
 */
export const enhanceSubtitle = asyncHandler(async (req, res) => {
  const { title, subtitle } = req.body;
  if (!title?.trim()) {
    throw new AppError('Title is required.', 400);
  }
  const apiKey = process.env.GEMINI_API_KEY;
  const context = subtitle ? `Current subtitle: ${subtitle}` : 'No subtitle yet.';
  const prompt = `You are an expert course copywriter. Create a compelling, concise course subtitle (one short sentence) that complements this course title. Return ONLY the subtitle, nothing else. No quotes.

Course title: ${title}
${context}`;
  const enhancedSubtitle = await callGemini(prompt, apiKey);
  res.json({ success: true, data: { enhancedSubtitle } });
});

/**
 * POST /api/ai/enhance-description
 * Body: { title: string, subtitle?: string, description?: string }
 */
export const enhanceDescription = asyncHandler(async (req, res) => {
  const { title, subtitle, description } = req.body;
  if (!title?.trim()) {
    throw new AppError('Title is required.', 400);
  }
  const apiKey = process.env.GEMINI_API_KEY;
  const context = [subtitle && `Subtitle: ${subtitle}`, description && `Current description: ${description}`]
    .filter(Boolean)
    .join('\n');
  const prompt = `You are an expert course copywriter. Write a clear, engaging course description (2-4 paragraphs) for this course. Use bullet points if helpful. Return ONLY the description, no extra text.

Course title: ${title}
${context || ''}`;
  const enhancedDescription = await callGemini(prompt, apiKey);
  res.json({ success: true, data: { enhancedDescription } });
});

/**
 * POST /api/ai/suggest-category
 * Body: { title: string, description?: string }
 * Returns a suggested category structure (categoryId/subcategoryId are placeholders - frontend maps to real IDs)
 */
export const suggestCategory = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  if (!title?.trim()) {
    throw new AppError('Title is required.', 400);
  }
  const apiKey = process.env.GEMINI_API_KEY;
  const prompt = `You are a course categorization expert for an educational platform. Based on this course title and optional description, suggest the best category and subcategory.

Course title: ${title}
${description ? `Description: ${description}` : ''}

Respond in this exact JSON format only, no other text:
{"categoryName":"Category Name","subcategoryName":"Subcategory Name","confidence":0.9}`;
  const text = await callGemini(prompt, apiKey);
  let parsed;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
  } catch {
    parsed = { categoryName: 'General', subcategoryName: 'Other', confidence: 0.5 };
  }
  res.json({
    success: true,
    data: {
      categoryId: parsed.categoryName || 'general',
      subcategoryId: parsed.subcategoryName || 'other',
      confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0.5)),
    },
  });
});

/**
 * POST /api/ai/generate-outline
 * Body: { title: string, description?: string, level?: string }
 */
export const generateOutline = asyncHandler(async (req, res) => {
  const { title, description, level } = req.body;
  if (!title?.trim()) {
    throw new AppError('Title is required.', 400);
  }
  const apiKey = process.env.GEMINI_API_KEY;
  const levelHint = level ? `Target level: ${level}.` : '';
  const prompt = `You are an expert curriculum designer. Create a course outline (list of lecture/section titles) for this course. Return a JSON array of strings only, e.g. ["Introduction", "Module 1: Basics", ...]. No other text.

Course title: ${title}
${description ? `Description: ${description}` : ''}
${levelHint}`;
  const text = await callGemini(prompt, apiKey);
  let outline = [];
  try {
    const arrMatch = text.match(/\[[\s\S]*\]/);
    if (arrMatch) outline = JSON.parse(arrMatch[0]);
    else outline = text.split('\n').filter(Boolean).map(s => s.replace(/^[-*\d.]+\s*/, '').trim());
  } catch {
    outline = text.split('\n').filter(Boolean).slice(0, 10).map(s => s.replace(/^[-*\d.]+\s*/, '').trim());
  }
  res.json({ success: true, data: { outline: Array.isArray(outline) ? outline : [] } });
});
