// src/pages/Entrenamiento.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { generarRutinaGemini } from '../lib/geminiClient'
import {
  guardarPlan,
  obtenerUltimoPlan,
  obtenerPlanes,
  eliminarPlan,
} from '../lib/planesService'
import { FiPlus, FiTrash2, FiEye, FiPlay, FiX, FiAlertTriangle } from 'react-icons/fi'

export default function Entrenamiento() {
  const { perfil, session } = useAuth()
  const userId = session?.user?.id

  const [rutina, setRutina] = useState([])
  const [planActual, setPlanActual] = useState(null)
  const [historial, setHistorial] = useState([])

  const [cargandoInicial, setCargandoInicial] = useState(true)
  const [generando, setGenerando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  // Modal: nueva rutina
  const [mostrarModalNueva, setMostrarModalNueva] = useState(false)
  const [nombreNuevaRutina, setNombreNuevaRutina] = useState('')

  // Modal: ver rutina
  const [mostrarModalVer, setMostrarModalVer] = useState(false)
  const [planSeleccionado, setPlanSeleccionado] = useState(null)

  // Modal: confirmar eliminación
  const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false)
  const [planAEliminar, setPlanAEliminar] = useState(null)

  // ------------------------------
  // Helpers para compatibilidad
  // ------------------------------
  const extraerDiasDesdeDatos = (datos) => {
    if (!datos) return []
    if (Array.isArray(datos)) return datos // Formato antiguo
    if (Array.isArray(datos.dias)) return datos.dias // Formato nuevo
    return []
  }

  const extraerNombrePlan = (plan) => {
    const datos = plan?.datos
    if (datos && !Array.isArray(datos) && datos.nombre) return datos.nombre
    if (plan?.semana_inicio) return `Rutina del ${plan.semana_inicio}`
    return 'Rutina sin nombre'
  }

  // ------------------------------
  // Cargar plan actual + historial
  // ------------------------------
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
          setRutina(extraerDiasDesdeDatos(ultimo.datos))
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

  // ------------------------------
  // Ver plan desde historial
  // ------------------------------
  const manejarVerPlan = (plan) => {
    setPlanSeleccionado(plan)
    setMostrarModalVer(true)
    setError('')
    setMensaje('')
  }

  // ------------------------------
  // Empezar rutina desde modal
  // ------------------------------
  const manejarEmpezarPlanSeleccionado = () => {
    if (!planSeleccionado) return
    setPlanActual(planSeleccionado)
    setRutina(extraerDiasDesdeDatos(planSeleccionado.datos))
    setMensaje(`Has comenzado la rutina "${extraerNombrePlan(planSeleccionado)}".`)
    setMostrarModalVer(false)
  }

  // ------------------------------
  // Generar nueva rutina
  // ------------------------------
  const manejarConfirmarNuevaRutina = async (e) => {
    e.preventDefault()

    if (!perfil || !userId) {
      setError('Completa tu perfil antes de generar la rutina.')
      return
    }

    if (!nombreNuevaRutina.trim()) {
      setError('El nombre de la rutina es obligatorio.')
      return
    }

    setGenerando(true)
    setError('')
    setMensaje('')

    try {
      const datosGemini = await generarRutinaGemini(perfil)

      if (!Array.isArray(datosGemini) || datosGemini.length === 0) {
        setError('La IA no ha devuelto una rutina válida.')
        return
      }

      const datosPlan = {
        nombre: nombreNuevaRutina.trim(),
        dias: datosGemini,
      }

      const plan = await guardarPlan(userId, 'entrenamiento', datosPlan)

      setPlanActual(plan)
      setRutina(extraerDiasDesdeDatos(plan.datos))
      setHistorial((prev) => [plan, ...prev])

      setMensaje('Rutina generada y guardada correctamente ✅')
      setNombreNuevaRutina('')
      setMostrarModalNueva(false)
    } catch (e) {
      console.error(e)
      setError('No se pudo generar o guardar la rutina.')
    } finally {
      setGenerando(false)
    }
  }

  // ------------------------------
  // Eliminar plan: abrir modal
  // ------------------------------
  const solicitarEliminarPlan = (plan) => {
    setPlanAEliminar(plan)
    setMostrarModalEliminar(true)
  }

  // ------------------------------
  // Confirmar eliminación en modal
  // ------------------------------
  const confirmarEliminarPlan = async () => {
    if (!planAEliminar) return
    try {
      await eliminarPlan(planAEliminar.id, userId)
      setHistorial((prev) => prev.filter((p) => p.id !== planAEliminar.id))
      if (planActual?.id === planAEliminar.id) {
        setPlanActual(null)
        setRutina([])
      }
      setMensaje('Rutina eliminada correctamente.')
    } catch (e) {
      console.error(e)
      setError('No se ha podido eliminar el plan.')
    } finally {
      setPlanAEliminar(null)
      setMostrarModalEliminar(false)
    }
  }

  const cerrarModalEliminar = () => {
    setPlanAEliminar(null)
    setMostrarModalEliminar(false)
  }

  // ==========================================================
  //              🚀 RETURN: UI DE LA PÁGINA
  // ==========================================================
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
              onClick={() => setMostrarModalNueva(true)}
              className="btn-ghost flex items-center gap-2"
              disabled={generando || !perfil || !userId}
            >
              <FiPlus />
              {generando ? 'Generando...' : 'Generar nueva rutina'}
            </button>

            <button className="btn-primary">Descargar PDF</button>
          </div>
        </div>

        {/* Mensajes */}
        {mensaje && <p className="text-green-500 mt-4">{mensaje}</p>}
        {error && <p className="text-red-500 mt-4">{error}</p>}

        {/* Cargando */}
        {cargandoInicial && (
          <p className="mt-6 text-sm text-text-muted dark:text-white/70">
            Cargando tu última rutina guardada...
          </p>
        )}

        {/* Texto inicial */}
        {!cargandoInicial && !generando && rutina.length === 0 && (
          <p className="mt-6 text-sm text-text-muted dark:text-white/70">
            Pulsa <strong>Generar nueva rutina</strong> para crear tu primera rutina semanal.
          </p>
        )}

        {/* =====================================================
             RUTINA ACTUAL
        ===================================================== */}
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {rutina.map((r, i) => (
            <article
              key={`actual-${r.dia || 'dia'}-${i}`}
              className="card card-pad"
            >
              {/* Cabecera del día con mini imagen */}
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-semibold text-lg text-brand">
                  {r.dia}
                </h2>

                {r.imagenUrl && (
                  <div className="shrink-0">
                    <img
                      src={r.imagenUrl}
                      alt={`Ilustración de entrenamiento para ${r.dia}`}
                      className="w-24 h-24 rounded-lg object-cover border border-slate-700"
                      loading="lazy"
                    />
                  </div>
                )}
              </div>

              <ul className="mt-4 space-y-3">
                {r.ejercicios.map((e, j) => (
                  <li
                    key={`actual-${r.dia}-${e.nombre}-${j}`}
                    className="flex items-start justify-between gap-4"
                  >
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

        {/* =====================================================
             HISTORIAL
        ===================================================== */}
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
                  key={`plan-${p.id}`}
                  className="flex items-center justify-between gap-4 border-b border-white/10 pb-2 last:border-none"
                >
                  <div className="flex-1">
                    <p className="font-medium">{extraerNombrePlan(p)}</p>
                    <p className="text-xs text-text-muted dark:text-white/60">
                      Semana de inicio: {p.semana_inicio}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      className="btn-ghost flex items-center gap-1 text-xs"
                      onClick={() => manejarVerPlan(p)}
                    >
                      <FiEye />
                      Ver rutina
                    </button>

                    <button
                      className="btn-ghost flex items-center gap-1 text-xs text-red-500"
                      onClick={() => solicitarEliminarPlan(p)}
                    >
                      <FiTrash2 />
                      Eliminar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* =====================================================
          MODAL: NUEVA RUTINA
      ===================================================== */}
      {mostrarModalNueva && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4"
          onClick={() => {
            setMostrarModalNueva(false)
            setNombreNuevaRutina('')
          }}
        >
          <div
            className="w-full max-w-md rounded-xl bg-slate-900 p-6 shadow-2xl border border-slate-700 max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Generar nueva rutina
                </h2>
                <p className="text-sm text-slate-300 mt-1">
                  Introduce el nombre de tu nueva rutina de entrenamiento.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMostrarModalNueva(false)
                  setNombreNuevaRutina('')
                }}
                className="text-slate-400 hover:text-slate-100"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            <form onSubmit={manejarConfirmarNuevaRutina} className="space-y-4">
              <input
                type="text"
                value={nombreNuevaRutina}
                onChange={(e) => setNombreNuevaRutina(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Ej. Fuerza 3 días"
                autoFocus
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="submit"
                  className="btn-primary flex items-center gap-2"
                  disabled={generando}
                >
                  <FiPlus />
                  {generando ? 'Generando...' : 'OK'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          MODAL: VER RUTINA
      ===================================================== */}
      {mostrarModalVer && planSeleccionado && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4"
          onClick={() => setMostrarModalVer(false)}
        >
          <div
            className="w-full max-w-4xl rounded-xl bg-slate-900 p-6 shadow-2xl border border-slate-700 max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {extraerNombrePlan(planSeleccionado)}
                </h2>
                <p className="text-xs text-slate-300">
                  Semana de inicio: {planSeleccionado.semana_inicio}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMostrarModalVer(false)}
                className="text-slate-400 hover:text-slate-100"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {extraerDiasDesdeDatos(planSeleccionado.datos).map((r, i) => (
                <article
                  key={`modal-${r.dia}-${i}`}
                  className="card card-pad"
                >
                  {/* Cabecera del día con mini imagen */}
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-lg text-brand">
                      {r.dia}
                    </h3>

                    {r.imagenUrl && (
                      <div className="shrink-0">
                        <img
                          src={r.imagenUrl}
                          alt={`Ilustración de entrenamiento para ${r.dia}`}
                          className="w-24 h-24 rounded-lg object-cover border border-slate-700"
                          loading="lazy"
                        />
                      </div>
                    )}
                  </div>

                  <ul className="mt-4 space-y-3">
                    {r.ejercicios.map((e, j) => (
                      <li
                        key={`modal-${r.dia}-${e.nombre}-${j}`}
                        className="flex items-start justify-between gap-4"
                      >
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

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                className="btn-primary flex items-center gap-2"
                onClick={manejarEmpezarPlanSeleccionado}
              >
                <FiPlay />
                Empezar rutina
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          MODAL: CONFIRMAR ELIMINACIÓN
      ===================================================== */}
      {mostrarModalEliminar && planAEliminar && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4"
          onClick={cerrarModalEliminar}
        >
          <div
            className="w-full max-w-md rounded-xl bg-slate-900 p-6 shadow-2xl border border-slate-700 max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <FiAlertTriangle className="text-red-400 text-xl" />
                <h2 className="text-lg font-semibold text-white">
                  Eliminar rutina
                </h2>
              </div>
              <button
                type="button"
                onClick={cerrarModalEliminar}
                className="text-slate-400 hover:text-slate-100"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            <p className="text-sm text-slate-200">
              ¿Seguro que quieres eliminar la rutina{' '}
              <span className="font-semibold">
                "{extraerNombrePlan(planAEliminar)}"
              </span>
              ? Esta acción no se puede deshacer.
            </p>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                className="btn-ghost text-sm"
                onClick={cerrarModalEliminar}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-primary bg-red-600 hover:bg-red-500 flex items-center gap-2 text-sm"
                onClick={confirmarEliminarPlan}
              >
                <FiTrash2 />
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
