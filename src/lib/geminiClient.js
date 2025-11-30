import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim()

if (!apiKey) {
  console.error('Falta VITE_GEMINI_API_KEY en las variables de entorno.')
}

const genAI = new GoogleGenerativeAI(apiKey)

// Usamos un modelo vigente
const modelo = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash',
})

// Saca el JSON aunque venga envuelto en ```json ... ```
function extraerJsonDeRespuesta(texto) {
  if (!texto || typeof texto !== 'string') {
    throw new Error('La respuesta de Gemini está vacía o no es texto.')
  }

  // Buscar bloque ```json ... ```
  const matchJson = texto.match(/```json([\s\S]*?)```/i)
  const matchCode = texto.match(/```([\s\S]*?)```/)

  let contenido = texto

  if (matchJson && matchJson[1]) {
    contenido = matchJson[1]
  } else if (matchCode && matchCode[1]) {
    contenido = matchCode[1]
  }

  const limpio = contenido.trim()

  try {
    const parsed = JSON.parse(limpio)
    return parsed
  } catch (e) {
    console.error('[Gemini] Error parseando JSON:', e, '\nContenido recibido:', limpio)
    throw new Error('No se pudo parsear la respuesta de la IA como JSON.')
  }
}

// Función principal que uso en Entrenamiento + AuthContext
export async function generarRutinaGemini(perfil) {
  if (!perfil) {
    throw new Error('No hay perfil disponible para generar la rutina.')
  }

  const prompt = `
Eres un entrenador personal. Genera una rutina de entrenamiento semanal en formato JSON.
Responde ÚNICAMENTE con un array JSON, sin texto adicional, siguiendo esta estructura:

[
  {
    "dia": "Lunes — Nombre del enfoque",
    "ejercicios": [
      { "nombre": "Ejercicio", "series": "4x8-12", "nota": "Indicaciones breves" }
    ]
  }
]

Ten en cuenta estos datos del perfil:
- Edad: ${perfil.edad ?? 'desconocida'}
- Sexo: ${perfil.sexo ?? 'desconocido'}
- Altura: ${perfil.altura_cm ?? 'desconocida'} cm
- Peso: ${perfil.peso_kg ?? 'desconocido'} kg
- Nivel de actividad: ${perfil.nivel_actividad ?? 'desconocido'}
- Objetivo: ${perfil.objetivo ?? 'no especificado'}
- Preferencias: ${perfil.preferencias ?? 'no especificadas'}
- Alergias/lesiones: ${perfil.alergias ?? 'ninguna indicada'}

Adapta volumen e intensidad al perfil y reparte los días de forma equilibrada (entrenos + descanso).
No añadas explicaciones fuera del JSON.
  `.trim()

  const result = await modelo.generateContent(prompt)
  const rawText = result.response.text()

  console.log('[Gemini] Respuesta cruda:', rawText)

  const rutina = extraerJsonDeRespuesta(rawText)

  if (!Array.isArray(rutina) || rutina.length === 0) {
    throw new Error('La IA no ha devuelto una rutina válida.')
  }

  return rutina
}

export async function generarDietaGemini(perfil) {
  if (!perfil) {
    throw new Error('No hay perfil disponible para generar la dieta.')
  }

  const prompt = `
Eres un nutricionista. Genera un plan de dieta semanal en formato JSON.
Responde ÚNICAMENTE con un array JSON, sin texto adicional, con esta estructura:

[
  {
    "dia": "Lunes",
    "kcal": 2100,
    "comidas": [
      "Desayuno: ...",
      "Comida: ...",
      "Cena: ..."
    ]
  }
]

Ten en cuenta estos datos del perfil:
- Edad: ${perfil.edad ?? 'desconocida'}
- Sexo: ${perfil.sexo ?? 'desconocido'}
- Altura: ${perfil.altura_cm ?? 'desconocida'} cm
- Peso: ${perfil.peso_kg ?? 'desconocido'} kg
- Nivel de actividad: ${perfil.nivel_actividad ?? 'desconocido'}
- Objetivo: ${perfil.objetivo ?? 'no especificado'}
- Preferencias alimentarias: ${JSON.stringify(perfil.preferencias ?? {})}
- Alergias/intolerancias: ${Array.isArray(perfil.alergias) ? perfil.alergias.join(', ') : 'ninguna indicada'}

Diseña menús variados y equilibrados, adaptados al objetivo (perder, mantener, ganar).
No añadas explicaciones fuera del JSON.
  `.trim()

  const result = await modelo.generateContent(prompt)
  const rawText = result.response.text()

  console.log('[Gemini] Respuesta cruda dieta:', rawText)

  const dieta = extraerJsonDeRespuesta(rawText)

  if (!Array.isArray(dieta) || dieta.length === 0) {
    throw new Error('La IA no ha devuelto un plan de dieta válido.')
  }

  // Validación mínima de estructura
  const normalizado = dieta.map((d) => ({
    dia: d.dia ?? 'Día',
    kcal: Number(d.kcal) || 0,
    comidas: Array.isArray(d.comidas) ? d.comidas : [],
  }))

  return normalizado
}