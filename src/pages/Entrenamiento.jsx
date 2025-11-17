// src/pages/Entrenamiento.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { generarRutinaGemini } from '../lib/geminiClient'
import {
  guardarPlan,
  obtenerUltimoPlan,
  obtenerPlanes,
  eliminarPlan,
  actualizarPlan,
} from '../lib/planesService'

export default function Entrenamiento() {
  const { perfil, session, logout } = useAuth()  // 👈 ahora también tenemos logout
  const userId = session?.user?.id

  const [rutina, setRutina] = useState([])            // array { dia, ejercicios[] }
  const [planActual, setPlanActual] = useState(null)  // fila de la tabla planes
  const [historial, setHistorial] = useState([])

  const [cargandoInicial, setCargandoInicial] = useState(true) // 👈 carga desde Supabase
  const [generando, setGenerando] = useState(false)            // 👈 llamada a Gemini
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  // 🔹 Cargar último plan + historial al entrar
  useEffect(() => {
    const cargar = async () => {
      if (!userId) {
        setCargandoInicial(false)
        return
      }
      setCargandoInicial(true)
      setError('')
      try {
        const ultimo = await obtenerUltimoPlan(userId, 'entrenamiento')
        if (ultimo) {
          setPlanActual(ultimo)
          setRutina(ultimo.datos || [])
        } else {
          setPlanActual(null)
          setRutina([])
        }

        const lista = await obtenerPlanes(userId, 'entrenamiento')
        setHistorial(lista || [])
      } catch (e) {
        console.error(e)
        setError('No se pudo cargar tu rutina.')
      } finally {
        setCargandoInicial(false)
      }
    }
    cargar()
  }, [userId])

  // 🔹 Generar / Regenerar rutina con Gemini
  const obtenerRutina = async () => {
    if (!perfil || !userId) {
      setError('Completa tu perfil antes de generar la rutina.')
      return
    }

    setGenerando(true)
    setError('')
    setMensaje('')

    try {
      console.log('[Entrenamiento] Generando rutina para perfil:', perfil)
      const datos = await generarRutinaGemini(perfil)
      console.log('[Entrenamiento] Rutina generada:', datos)

      if (!Array.isArray(datos) || datos.length === 0) {
        setError('La IA no ha devuelto una rutina válida.')
        setRutina([])
        return
      }

      setRutina(datos)

      // Guardar rutina en Supabase como nuevo plan
      const plan = await guardarPlan(userId, 'entrenamiento', datos)
      setPlanActual(plan)

      // Recargar historial (añadiendo el plan nuevo al principio)
      setHistorial((prev) => [plan, ...prev])

      setMensaje('Rutina generada y guardada correctamente ✅')
    } catch (e) {
      console.error('Error en obtenerRutina:', e)
      setError(e.message || 'No se pudo generar o guardar la rutina.')
    } finally {
      // ⭐ Pase lo que pase (error o éxito), dejamos de estar "Generando..."
      setGenerando(false)
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

  return (
    <section className="section">
      <div className="container">
        {/* Cabecera */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="section-title">Rutina semanal</h1>
            <p className="mt-2 text-text-muted dark:text-white/80">
              Generada por IA según tu perfil.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={obtenerRutina}
              className="btn-ghost"
              disabled={generando || !perfil || !userId}
            >
              {generando
                ? 'Generando...'
                : rutina.length > 0
                ? 'Regenerar'
                : 'Generar rutina'}
            </button>

            <button className="btn-primary">Descargar PDF</button>

            {/* Opcional: botón de cierre de sesión aquí */}
            {/* <button onClick={logout} className="btn-ghost text-red-500">
              Cerrar sesión
            </button> */}
          </div>
        </div>

        {/* Mensajes */}
        {mensaje && <p className="text-green-500 mt-4">{mensaje}</p>}
        {error && <p className="text-red-500 mt-4">{error}</p>}

        {/* Info mientras se carga desde Supabase */}
        {cargandoInicial && (
          <p className="mt-6 text-sm text-text-muted dark:text-white/70">
            Cargando tu última rutina guardada...
          </p>
        )}

        {/* Texto inicial cuando NO hay rutina todavía */}
        {!cargandoInicial && !generando && !error && rutina.length === 0 && (
          <p className="mt-6 text-sm text-text-muted dark:text-white/70">
            Pulsa <strong>Generar rutina</strong> para crear tu primera rutina semanal.
          </p>
        )}

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
                      <p className="text-sm text-text-muted dark:text-white/70">
                        {e.nota}
                      </p>
                    </div>
                    <span className="text-sm font-semibold">{e.series}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        {/* Historial de planes */}
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
