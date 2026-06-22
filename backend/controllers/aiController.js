/**
 * AI Controller - Course content enhancement using Google Gemini API
 * Endpoints: enhance-title, enhance-subtitle, enhance-description, suggest-category, generate-outline
 */

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function callGemini(prompt, apiKey, retries = 2) {
  if (!apiKey?.trim()) {
    throw new Error('GEMINI_API_KEY is not configured. Set it in environment variables.');
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
      throw new Error('AI service rate limit exceeded. Please wait a minute and try again.');
    }

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API error ${res.status}: ${errText.slice(0, 200)}`);
    }

    const json = await res.json();
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) throw new Error('No response from Gemini');
    return text;
  }
}

/**
 * POST /api/ai/enhance-title
 * Body: { title: string }
 */
export const enhanceTitle = async (req, res) => {
  try {
    const { title } = req.body;
    if (!title?.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required.' });
    }
    const apiKey = process.env.GEMINI_API_KEY;
    const prompt = `You are an expert course title writer for an online learning platform. Improve this course title to be more engaging, clear, and professional. Return ONLY the improved title, nothing else. No quotes, no explanation.

Original title: ${title}`;
    const enhancedTitle = await callGemini(prompt, apiKey);
    return res.json({ success: true, data: { enhancedTitle } });
  } catch (err) {
    console.error('AI enhanceTitle error:', err.message);
    const status = err.message.includes('rate limit') ? 429 : 500;
    return res.status(status).json({
      success: false,
      message: err.message || 'Failed to enhance title.',
    });
  }
};

/**
 * POST /api/ai/enhance-subtitle
 * Body: { title: string, subtitle?: string }
 */
export const enhanceSubtitle = async (req, res) => {
  try {
    const { title, subtitle } = req.body;
    if (!title?.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required.' });
    }
    const apiKey = process.env.GEMINI_API_KEY;
    const context = subtitle ? `Current subtitle: ${subtitle}` : 'No subtitle yet.';
    const prompt = `You are an expert course copywriter. Create a compelling, concise course subtitle (one short sentence) that complements this course title. Return ONLY the subtitle, nothing else. No quotes.

Course title: ${title}
${context}`;
    const enhancedSubtitle = await callGemini(prompt, apiKey);
    return res.json({ success: true, data: { enhancedSubtitle } });
  } catch (err) {
    console.error('AI enhanceSubtitle error:', err.message);
    const status = err.message.includes('rate limit') ? 429 : 500;
    return res.status(status).json({
      success: false,
      message: err.message || 'Failed to enhance subtitle.',
    });
  }
};

/**
 * POST /api/ai/enhance-description
 * Body: { title: string, subtitle?: string, description?: string }
 */
export const enhanceDescription = async (req, res) => {
  try {
    const { title, subtitle, description } = req.body;
    if (!title?.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required.' });
    }
    const apiKey = process.env.GEMINI_API_KEY;
    const context = [subtitle && `Subtitle: ${subtitle}`, description && `Current description: ${description}`]
      .filter(Boolean)
      .join('\n');
    const prompt = `You are an expert course copywriter. Write a clear, engaging course description (2-4 paragraphs) for this course. Use bullet points if helpful. Return ONLY the description, no extra text.

Course title: ${title}
${context || ''}`;
    const enhancedDescription = await callGemini(prompt, apiKey);
    return res.json({ success: true, data: { enhancedDescription } });
  } catch (err) {
    console.error('AI enhanceDescription error:', err.message);
    const status = err.message.includes('rate limit') ? 429 : 500;
    return res.status(status).json({
      success: false,
      message: err.message || 'Failed to enhance description.',
    });
  }
};

/**
 * POST /api/ai/suggest-category
 * Body: { title: string, description?: string }
 * Returns a suggested category structure (categoryId/subcategoryId are placeholders - frontend maps to real IDs)
 */
export const suggestCategory = async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title?.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required.' });
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
    return res.json({
      success: true,
      data: {
        categoryId: parsed.categoryName || 'general',
        subcategoryId: parsed.subcategoryName || 'other',
        confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0.5)),
      },
    });
  } catch (err) {
    console.error('AI suggestCategory error:', err.message);
    const status = err.message.includes('rate limit') ? 429 : 500;
    return res.status(status).json({
      success: false,
      message: err.message || 'Failed to suggest category.',
    });
  }
};

/**
 * POST /api/ai/generate-outline
 * Body: { title: string, description?: string, level?: string }
 */
export const generateOutline = async (req, res) => {
  try {
    const { title, description, level } = req.body;
    if (!title?.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required.' });
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
    return res.json({ success: true, data: { outline: Array.isArray(outline) ? outline : [] } });
  } catch (err) {
    console.error('AI generateOutline error:', err.message);
    const status = err.message.includes('rate limit') ? 429 : 500;
    return res.status(status).json({
      success: false,
      message: err.message || 'Failed to generate outline.',
    });
  }
};
