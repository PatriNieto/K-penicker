module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not set' });
  }

  const { system, messages, max_tokens } = req.body;

  // Convert Anthropic format -> Gemini format
  const contents = (messages || []).map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  const body = {
    contents,
    generationConfig: {
      maxOutputTokens: max_tokens || 900,
      temperature: 0.7,
    }
  };

  // Add system instruction if present
  if (system) {
    body.system_instruction = { parts: [{ text: system }] };
  }

  try {
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-8b:generateContent?key=' + apiKey;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      const msg = (data.error && data.error.message) || ('HTTP ' + response.status);
      return res.status(response.status || 500).json({ error: msg });
    }

    const text = data.candidates &&
                 data.candidates[0] &&
                 data.candidates[0].content &&
                 data.candidates[0].content.parts &&
                 data.candidates[0].content.parts[0] &&
                 data.candidates[0].content.parts[0].text
                 || 'Sin respuesta.';

    // Return in Anthropic-compatible format so the frontend works unchanged
    return res.status(200).json({
      content: [{ type: 'text', text: text }]
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};