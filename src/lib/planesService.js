// src/lib/planesService.js
import { supabase } from './supabaseClient'

/**
 * Guarda un nuevo plan (dieta o entrenamiento).
 * tipo: 'dieta' | 'entrenamiento'
 * datos: estructura JSON que mostrarás en la vista
 * semanaInicio: Date o string 'YYYY-MM-DD'
 */
export async function guardarPlan(usuarioId, tipo, datos, semanaInicio = new Date()) {
  const fecha =
    typeof semanaInicio === 'string'
      ? semanaInicio
      : semanaInicio.toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('planes')
    .insert({
      usuario_id: usuarioId,
      tipo,             // Supabase lo mapea al tipo USER-DEFINED que creaste
      semana_inicio: fecha,
      datos
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Devuelve todos los planes de un tipo para un usuario concreto
 */
export async function obtenerPlanes(usuarioId, tipo) {
  const { data, error } = await supabase
    .from('planes')
    .select('*')
    .eq('usuario_id', usuarioId)
    .eq('tipo', tipo)
    .order('semana_inicio', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Devuelve el último plan (por semana_inicio) de un tipo
 */
export async function obtenerUltimoPlan(usuarioId, tipo) {
  const { data, error } = await supabase
    .from('planes')
    .select('*')
    .eq('usuario_id', usuarioId)
    .eq('tipo', tipo)
    .order('semana_inicio', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data // puede ser null si no hay planes
}

/**
 * Actualiza solo los datos (jsonb) de un plan
 */
export async function actualizarPlan(id, usuarioId, nuevosDatos) {
  const { data, error } = await supabase
    .from('planes')
    .update({
      datos: nuevosDatos,
      // opcional: podrías añadir una columna actualizado_en si quieres
    })
    .eq('id', id)
    .eq('usuario_id', usuarioId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Elimina un plan por id (solo si pertenece al usuario)
 */
export async function eliminarPlan(id, usuarioId) {
  const { error } = await supabase
    .from('planes')
    .delete()
    .eq('id', id)
    .eq('usuario_id', usuarioId)

  if (error) throw error
}
