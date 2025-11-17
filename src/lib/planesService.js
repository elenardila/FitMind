// src/lib/planesService.js
import { supabase } from './supabaseClient'

// 🔢 Calcula el lunes de la semana actual (inicio de semana)
function getSemanaInicioISO() {
  const hoy = new Date()
  const diaSemana = hoy.getDay() || 7 // Domingo = 0 -> 7
  const lunes = new Date(hoy)
  lunes.setDate(hoy.getDate() - (diaSemana - 1))
  // YYYY-MM-DD para encajar con una columna date
  return lunes.toISOString().slice(0, 10)
}

// 🔹 Guarda o actualiza el plan de la semana actual (UPERT sobre usuario_id+tipo+semana_inicio)
export async function guardarPlan(usuarioId, tipo, datos) {
  const semanaInicio = getSemanaInicioISO()

  const { data, error } = await supabase
    .from('planes')
    .upsert(
      {
        usuario_id: usuarioId,
        tipo,
        semana_inicio: semanaInicio,
        datos,
      },
      {
        onConflict: 'usuario_id,tipo,semana_inicio',
        ignoreDuplicates: false, // si existe, lo actualiza
      }
    )
    .select('*')
    .single()

  if (error) {
    console.error('[planesService] Error en guardarPlan:', error)
    throw error
  }

  return data
}

// 🔹 Devuelve el último plan de un tipo para un usuario
export async function obtenerUltimoPlan(usuarioId, tipo) {
  const { data, error } = await supabase
    .from('planes')
    .select('*')
    .eq('usuario_id', usuarioId)
    .eq('tipo', tipo)
    .order('semana_inicio', { ascending: false })
    .limit(1)
    .maybeSingle()

  // PGRST116 = "No rows found" en maybeSingle -> lo tratamos como null, no como error
  if (error && error.code !== 'PGRST116') {
    console.error('[planesService] Error en obtenerUltimoPlan:', error)
    throw error
  }

  return data || null
}

// 🔹 Historial de planes
export async function obtenerPlanes(usuarioId, tipo) {
  const { data, error } = await supabase
    .from('planes')
    .select('*')
    .eq('usuario_id', usuarioId)
    .eq('tipo', tipo)
    .order('semana_inicio', { ascending: false })

  if (error) {
    console.error('[planesService] Error en obtenerPlanes:', error)
    throw error
  }

  return data || []
}

// 🔹 Actualiza sólo los datos/json de un plan concreto
export async function actualizarPlan(planId, usuarioId, datos) {
  const { data, error } = await supabase
    .from('planes')
    .update({
      datos,
    })
    .eq('id', planId)
    .eq('usuario_id', usuarioId)
    .select('*')
    .single()

  if (error) {
    console.error('[planesService] Error en actualizarPlan:', error)
    throw error
  }

  return data
}

// 🔹 Eliminar un plan concreto
export async function eliminarPlan(planId, usuarioId) {
  const { error } = await supabase
    .from('planes')
    .delete()
    .eq('id', planId)
    .eq('usuario_id', usuarioId)

  if (error) {
    console.error('[planesService] Error en eliminarPlan:', error)
    throw error
  }
}
