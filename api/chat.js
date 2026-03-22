export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const { system, messages, max_tokens } = req.body;

  // Convert Anthropic format -> Gemini format
  const geminiMessages = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  const body = {
    system_instruction: system ? { parts: [{ text: system }] } : undefined,
    contents: geminiMessages,
    generationConfig: {
      maxOutputTokens: max_tokens || 900,
      temperature: 0.7,
    }
  };

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      return res.status(response.status).json({ error: data.error?.message || 'Gemini error' });
    }

    // Convert Gemini response -> Anthropic-compatible format so the frontend doesnt change
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sin respuesta.';
    return res.status(200).json({
      content: [{ type: 'text', text }]
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
