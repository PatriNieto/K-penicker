// api/chat.js
module.exports = async function handler(req, res) {
  const apiKey = process.env.ANTHROPIC_API_KEY; // Clave de Anthropic
  const { model, system, messages = [], max_tokens } = req.body;

  if (!apiKey) {
    return res.status(500).json({ error: 'Falta ANTHROPIC_API_KEY en las variables de entorno.' });
  }

  const claudeMessages = Array.isArray(messages)
    ? messages.map(m => ({ role: m.role, content: m.content }))
    : [];

  const payload = {
    model: model || 'claude-3-5-sonnet-20241022',
    max_tokens: max_tokens || 1000,
    system: system || 'Eres un tutor de alemán.',
    messages: claudeMessages
  };

  try {
    const url = 'https://api.anthropic.com/v1/messages';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (data.error) {
      return res.status(data.error.code || 500).json({ error: data.error.message });
    }

    const text = data.content?.[0]?.text || 'Sin respuesta.';

    return res.status(200).json({
      content: [{ text }]
    });
  } catch (err) {
    return res.status(500).json({ error: 'Error de conexión con la IA' });
  }
};
