// api/chat.js
export default async function handler(req, res) {
  const apiKey = process.env.GEMINI_API_KEY; // Asegúrate de poner tu clave en las variables de entorno de Vercel
  
  const { system, messages } = req.body;

  // Transformamos el historial al formato que entiende Gemini
  // Nota: Gemini prefiere que los mensajes alternen Usuario -> Modelo
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  const payload = {
    contents: contents,
    system_instruction: { 
      parts: [{ text: system || "Eres un tutor de alemán." }] 
    },
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1000,
    }
  };

  try {
    // Usamos el modelo 1.5 Flash que es gratuito y muy rápido
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (data.error) {
       return res.status(data.error.code || 500).json({ error: data.error.message });
    }

    const text = data.candidates[0].content.parts[0].text;

    // Devolvemos el formato que tu HTML ya espera para no romper el frontend
    return res.status(200).json({
      content: [{ text: text }]
    });

  } catch (err) {
    return res.status(500).json({ error: "Error de conexión con la IA" });
  }
}