export async function generarRutinaGemini(perfil) {
  const prompt = `
Eres un entrenador personal experto. Genera una rutina semanal de entrenamiento
en formato JSON, adaptada al siguiente perfil:

Edad: ${perfil.edad || 'no especificada'}
Sexo: ${perfil.sexo}
Altura: ${perfil.altura_cm} cm
Peso: ${perfil.peso_kg} kg
Nivel: ${perfil.nivel_actividad}
Objetivo: ${perfil.objetivo}
Preferencias: ${perfil.preferencias ? JSON.stringify(perfil.preferencias) : 'ninguna'}
Alergias: ${perfil.alergias || 'ninguna'}

Devuelve un JSON con el formato:
[
  { "dia": "Lunes — Push", "ejercicios": [ { "nombre": "...", "series": "4x8", "nota": "..." } ] },
  ...
]
`
  try {
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + import.meta.env.VITE_GEMINI_API_KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    })
    const data = await res.json()
    const texto = data?.candidates?.[0]?.content?.parts?.[0]?.text
    const rutina = JSON.parse(texto)
    return rutina
  } catch (e) {
    console.error('Error generando rutina con Gemini:', e)
    return []
  }
}
