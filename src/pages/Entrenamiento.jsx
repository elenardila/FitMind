// src/pages/Entrenamiento.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import {
  generarRutinaGemini
} from '../lib/geminiClient'
import {
  guardarPlan,
  obtenerUltimoPlan,
  obtenerPlanes,
  eliminarPlan,
  actualizarPlan
} from '../lib/planesService'

export default function Entrenamiento() {
  const { perfil, session } = useAuth()
  const userId = session?.user?.id

  const [rutina, setRutina] = useState([])       // array { dia, ejercicios[] }
  const [planActual, setPlanActual] = useState(null) // fila de la tabla planes
  const [historial, setHistorial] = useState([])

  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  // Cargar último plan + historial
  useEffect(() => {
    const cargar = async () => {
      if (!userId) return
      setCargando(true)
      setError('')
      try {
        const ultimo = await obtenerUltimoPlan(userId, 'entrenamiento')
        if (ultimo) {
          setPlanActual(ultimo)
          setRutina(ultimo.datos) // aquí asumo que datos es el array que pintas
        }
        const lista = await obtenerPlanes(userId, 'entrenamiento')
        setHistorial(lista)
      } catch (e) {
        console.error(e)
        setError('No se pudo cargar tu rutina.')
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [userId])

  const obtenerRutina = async () => {
    if (!perfil || !userId) return
    setCargando(true)
    setError('')
    setMensaje('')
    try {
      const datos = await generarRutinaGemini(perfil)
      setRutina(datos)

      // Guardar rutina en Supabase como nuevo plan
      const plan = await guardarPlan(userId, 'entrenamiento', datos)
      setPlanActual(plan)

      // Recargar historial (o añadir al principio)
      setHistorial((prev) => [plan, ...prev])

      setMensaje('Rutina generada y guardada correctamente ✅')
    } catch (e) {
      console.error('Error en obtenerRutina:', e)
      setError('No se pudo generar o guardar la rutina.')
    } finally {
      setCargando(false)
    }
  }

  const onSeleccionarPlan = (plan) => {
    setPlanActual(plan)
    setRutina(plan.datos || [])
    setMensaje(`Has cargado la rutina del ${plan.semana_inicio}.`)
    setError('')
  }

  const onEliminarPlan = async (plan) => {
    if (!window.confirm('¿Eliminar este plan de entrenamiento?')) return
    try {
      await eliminarPlan(plan.id, userId)
      setHistorial((prev) => prev.filter((p) => p.id !== plan.id))
      if (planActual?.id === plan.id) {
        setPlanActual(null)
        setRutina([])
      }
    } catch (e) {
      console.error(e)
      setError('No se ha podido eliminar el plan.')
    }
  }

  // Si quisieras editar manualmente la rutina (por ejemplo nota/series),
  // aquí llamarías a actualizarPlan(planActual.id, userId, rutinaModificada)

  return (
    <section className="section">
      <div className="container">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="section-title">Rutina semanal</h1>
            <p className="mt-2 text-text-muted dark:text-white/80">
              Generada por IA según tu perfil.
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={obtenerRutina} className="btn-ghost" disabled={cargando}>
              {cargando ? 'Generando...' : 'Regenerar'}
            </button>
            <button className="btn-primary">Descargar PDF</button>
          </div>
        </div>

        {mensaje && <p className="text-green-500 mt-4">{mensaje}</p>}
        {error && <p className="text-red-500 mt-4">{error}</p>}

        {/* Rutina actual */}
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {rutina.map((r, i) => (
            <article key={i} className="card card-pad">
              <h2 className="font-semibold text-lg text-brand">{r.dia}</h2>
              <ul className="mt-4 space-y-3">
                {r.ejercicios.map((e, j) => (
                  <li key={j} className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">{e.nombre}</p>
                      <p className="text-sm text-text-muted dark:text-white/70">{e.nota}</p>
                    </div>
                    <span className="text-sm font-semibold">{e.series}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        {/* Historial simple de planes */}
        <div className="mt-10 card card-pad">
          <h2 className="font-semibold text-lg">Historial de rutinas</h2>
          {historial.length === 0 ? (
            <p className="mt-2 text-sm text-text-muted dark:text-white/70">
              Aún no tienes rutinas guardadas.
            </p>
          ) : (
            <ul className="mt-4 space-y-2 text-sm">
              {historial.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-4 border-b border-white/10 pb-2 last:border-none"
                >
                  <button
                    className="text-left flex-1 hover:underline"
                    onClick={() => onSeleccionarPlan(p)}
                  >
                    Semana de inicio: {p.semana_inicio}
                  </button>
                  <button
                    className="text-xs text-red-500"
                    onClick={() => onEliminarPlan(p)}
                  >
                    Eliminar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
