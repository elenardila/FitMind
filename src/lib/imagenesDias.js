// src/lib/imagenesDias.js

// 👉 URLs públicas de tus imágenes de ENTRENAMIENTO en Supabase Storage
// Asegúrate de que si pegas cualquiera en el navegador, se ve la imagen.
export const IMAGENES_DIAS_ENTRENAMIENTO = [
  'https://ocdkltlwmqrxlyglsdcu.supabase.co/storage/v1/object/public/entrenamientos/entrenamientos/entrenamiento-1.jpg',
  'https://ocdkltlwmqrxlyglsdcu.supabase.co/storage/v1/object/public/entrenamientos/entrenamientos/entrenamiento-2.jpg',
  'https://ocdkltlwmqrxlyglsdcu.supabase.co/storage/v1/object/public/entrenamientos/entrenamientos/entrenamiento-3.jpg',
  'https://ocdkltlwmqrxlyglsdcu.supabase.co/storage/v1/object/public/entrenamientos/entrenamientos/entrenamiento-4.jpg',
  'https://ocdkltlwmqrxlyglsdcu.supabase.co/storage/v1/object/public/entrenamientos/entrenamientos/entrenamiento-5.jpg',
  'https://ocdkltlwmqrxlyglsdcu.supabase.co/storage/v1/object/public/entrenamientos/entrenamientos/entrenamiento-6.jpg',
  'https://ocdkltlwmqrxlyglsdcu.supabase.co/storage/v1/object/public/entrenamientos/entrenamientos/entrenamiento-7.jpg',
  'https://ocdkltlwmqrxlyglsdcu.supabase.co/storage/v1/object/public/entrenamientos/entrenamientos/entrenamiento-8.jpg',
  'https://ocdkltlwmqrxlyglsdcu.supabase.co/storage/v1/object/public/entrenamientos/entrenamientos/entrenamiento-9.jpg',
  'https://ocdkltlwmqrxlyglsdcu.supabase.co/storage/v1/object/public/entrenamientos/entrenamientos/entrenamiento-10.jpg',
  'https://ocdkltlwmqrxlyglsdcu.supabase.co/storage/v1/object/public/entrenamientos/entrenamientos/entrenamiento-11.jpg',
  'https://ocdkltlwmqrxlyglsdcu.supabase.co/storage/v1/object/public/entrenamientos/entrenamientos/entrenamiento-12.jpg',
]

// 👉 De momento las de dieta las dejamos vacías o con TODO.
// Cuando tengas las imágenes de dieta, metes aquí sus URLs reales.
export const IMAGENES_DIAS_DIETA = [
  // 'https://.../dieta-1.jpg',
  // 'https://.../dieta-2.jpg',
  // 'https://.../dieta-3.jpg',
]

function elegirImagenAleatoria(lista) {
  if (!lista || lista.length === 0) return null
  const indice = Math.floor(Math.random() * lista.length)
  return lista[indice]
}

/**
 * Enriquecemos el json de datos de un plan añadiendo `imagenUrl` a cada día.
 *
 * datosPlan: { nombre, dias: [ { dia, ..., imagenUrl? }, ... ] }
 * tipoPlan: 'entrenamiento' | 'dieta'
 */
export function asignarImagenesPorDia(datosPlan, tipoPlan) {
  const lista =
    tipoPlan === 'entrenamiento'
      ? IMAGENES_DIAS_ENTRENAMIENTO
      : IMAGENES_DIAS_DIETA

  // Por si acaso: si no hay lista (por ejemplo, aún no has definido las de dieta),
  // devolvemos el plan tal cual para no romper nada.
  if (!lista || lista.length === 0) {
    return datosPlan
  }

  return {
    ...datosPlan,
    dias: (datosPlan.dias || []).map((dia) => ({
      ...dia,
      // Si el día ya tenía imagenUrl (en el futuro), la respetamos.
      imagenUrl: dia.imagenUrl || elegirImagenAleatoria(lista),
    })),
  }
}
