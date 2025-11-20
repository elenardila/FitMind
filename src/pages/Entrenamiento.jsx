// src/pages/Entrenamiento.jsx
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { generarRutinaGemini } from '../lib/geminiClient'
import {
    guardarPlan,
    obtenerUltimoPlan,
    obtenerPlanes,
    eliminarPlan,
} from '../lib/planesService'
import {
    FiPlus,
    FiTrash2,
    FiEye,
    FiPlay,
    FiX,
    FiAlertTriangle,
    FiDownload,
    FiActivity,
    FiCalendar,
    FiBookOpen,
    FiCheckCircle,
    FiAlertCircle,
} from 'react-icons/fi'

import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export default function Entrenamiento() {
    const { perfil, session } = useAuth()
    const userId = session?.user?.id

    const [rutina, setRutina] = useState([])
    const [planActual, setPlanActual] = useState(null)
    const [historial, setHistorial] = useState([])

    const [cargandoInicial, setCargandoInicial] = useState(true)
    const [generando, setGenerando] = useState(false)

    // Notificaciones tipo toast
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

    // Modal: confirmar descarga PDF
    const [mostrarModalPdf, setMostrarModalPdf] = useState(false)
    const [generandoPdf, setGenerandoPdf] = useState(false)

    // Ref para el contenido que se exporta a PDF (versión simplificada)
    const pdfRef = useRef(null)

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

    // Autocierre de notificaciones (toast)
    useEffect(() => {
        if (!mensaje && !error) return
        const t = setTimeout(() => {
            setMensaje('')
            setError('')
        }, 4000)
        return () => clearTimeout(t)
    }, [mensaje, error])

    // Cargar plan actual + historial
    useEffect(() => {
        const cargar = async () => {
            if (!userId) {
                setCargandoInicial(false)
                return
            }

            setCargandoInicial(true)
            setError('')
            setMensaje('')
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

        setMensaje('')
        setError('')

        if (!perfil || !userId) {
            setError('Completa tu perfil antes de generar la rutina.')
            return
        }

        if (!nombreNuevaRutina.trim()) {
            setError('El nombre de la rutina es obligatorio.')
            return
        }

        setGenerando(true)

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

            setMensaje('Rutina generada y guardada correctamente.')
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
        setMensaje('')
        setError('')
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

    // ------------------------------
    // Generar PDF de la rutina actual (usando versión simplificada)
    // ------------------------------
    const generarPdfRutina = async () => {
        setMensaje('')
        setError('')

        if (!rutina || rutina.length === 0) {
            setError('No hay ninguna rutina para descargar.')
            setMostrarModalPdf(false)
            return
        }

        const elemento = pdfRef.current
        if (!elemento) {
            setError('No se ha encontrado el contenido para generar el PDF.')
            setMostrarModalPdf(false)
            return
        }

        try {
            setGenerandoPdf(true)

            const canvas = await html2canvas(elemento, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
            })

            const imgData = canvas.toDataURL('image/png')
            const pdf = new jsPDF('p', 'mm', 'a4')

            const pdfWidth = pdf.internal.pageSize.getWidth()
            const pdfHeight = pdf.internal.pageSize.getHeight()

            const imgWidth = pdfWidth
            const imgHeight = (canvas.height * imgWidth) / canvas.width

            let heightLeft = imgHeight
            let position = 0

            // Primera página
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
            heightLeft -= pdfHeight

            // Páginas adicionales si hace falta
            while (heightLeft > 0) {
                position -= pdfHeight
                pdf.addPage()
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
                heightLeft -= pdfHeight
            }

            const fecha = new Date().toISOString().slice(0, 10)
            const nombreBase = planActual ? extraerNombrePlan(planActual) : 'rutina'
            const nombreLimpio = nombreBase.replace(/[\s"/\\:*?<>|]+/g, '-')

            pdf.save(`${nombreLimpio}-${fecha}.pdf`)
            setMensaje('PDF de la rutina generado correctamente.')
        } catch (e) {
            console.error(e)
            setError('Ha habido un problema al generar el PDF de la rutina.')
        } finally {
            setGenerandoPdf(false)
            setMostrarModalPdf(false)
        }
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
                        <h1 className="section-title flex items-center gap-2">
                            <FiActivity className="text-brand" />
                            <span>Rutina semanal</span>
                        </h1>
                        <p className="mt-2 text-text-muted dark:text-white/80">
                            Generada por IA según tu perfil.
                        </p>

                        {planActual && (
                            <p className="mt-2 text-sm text-brand flex items-center gap-2">
                                <FiBookOpen />
                                <span>
                  Rutina actual:{' '}
                                    <span className="font-semibold">
                    {extraerNombrePlan(planActual)}
                  </span>
                </span>
                            </p>
                        )}
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

                        <button
                            className="btn-primary flex items-center gap-2"
                            onClick={() => setMostrarModalPdf(true)}
                            disabled={rutina.length === 0 || generandoPdf}
                        >
                            <FiDownload />
                            {generandoPdf ? 'Generando PDF...' : 'Descargar PDF'}
                        </button>
                    </div>
                </div>

                {/* Toast / notificaciones flotantes */}
                {(mensaje || error) && (
                    <div className="fixed bottom-4 right-4 z-50 flex justify-end px-4 pointer-events-none">
                        <div
                            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm shadow-lg border pointer-events-auto
        ${mensaje
                                ? 'bg-emerald-900/80 border-emerald-500 text-emerald-50'
                                : 'bg-red-900/80 border-red-500 text-red-50'
                            }`}
                        >
                            {mensaje ? (
                                <FiCheckCircle className="shrink-0" />
                            ) : (
                                <FiAlertCircle className="shrink-0" />
                            )}
                            <p>{mensaje || error}</p>
                        </div>
                    </div>
                )}


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

                {/* Indicador mientras genera */}
                {generando && (
                    <p className="mt-4 text-sm text-text-muted dark:text-white/70">
                        Generando / guardando rutina...
                    </p>
                )}

                {/* =====================================================
             RUTINA ACTUAL (visible en pantalla)
        ===================================================== */}
                {rutina.length > 0 && (
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
                )}

                {/* =====================================================
             VERSIÓN SIMPLIFICADA SOLO PARA PDF
             (fuera de pantalla, fondo blanco y texto oscuro)
        ===================================================== */}
                <div
                    ref={pdfRef}
                    className="fixed -left-[9999px] top-0 bg-white text-slate-900 p-6 w-[800px]"
                >
                    <h1 className="text-2xl font-bold mb-4">
                        {planActual ? extraerNombrePlan(planActual) : 'Rutina semanal'}
                    </h1>

                    {rutina.map((r, i) => (
                        <div key={`pdf-${r.dia || 'dia'}-${i}`} className="mb-4">
                            <h2 className="text-lg font-semibold mb-2">
                                {r.dia}
                            </h2>

                            <ul className="text-sm list-disc pl-4 space-y-1">
                                {r.ejercicios.map((e, j) => (
                                    <li key={`pdf-${r.dia}-${e.nombre}-${j}`}>
                                        <span className="font-medium">{e.nombre}</span>{' — '}
                                        <span>{e.series}</span>{' — '}
                                        <span className="italic">{e.nota}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* =====================================================
             HISTORIAL
        ===================================================== */}
                <div className="mt-10 card card-pad">
                    <h2 className="font-semibold text-lg flex items-center gap-2">
                        <FiCalendar />
                        <span>Historial de rutinas</span>
                    </h2>

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
                                        <p className="font-medium flex items-center gap-2">
                                            <FiActivity className="text-brand" />
                                            <span>{extraerNombrePlan(p)}</span>
                                        </p>
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
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
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

            {/* =====================================================
          MODAL: CONFIRMAR DESCARGA PDF
      ===================================================== */}
            {mostrarModalPdf && (
                <div
                    className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4"
                    onClick={() => !generandoPdf && setMostrarModalPdf(false)}
                >
                    <div
                        className="w-full max-w-md rounded-xl bg-slate-900 p-6 shadow-2xl border border-slate-700 max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-slate-700"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <FiDownload className="text-brand text-xl" />
                                <h2 className="text-lg font-semibold text-white">
                                    Descargar rutina en PDF
                                </h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => !generandoPdf && setMostrarModalPdf(false)}
                                className="text-slate-400 hover:text-slate-100"
                                disabled={generandoPdf}
                            >
                                <FiX className="text-lg" />
                            </button>
                        </div>

                        <p className="text-sm text-slate-200">
                            Se generará un archivo PDF con tu rutina actual en formato texto legible.
                            ¿Quieres continuar con la descarga?
                        </p>

                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                type="button"
                                className="btn-ghost text-sm"
                                onClick={() => !generandoPdf && setMostrarModalPdf(false)}
                                disabled={generandoPdf}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className="btn-primary flex items-center gap-2 text-sm"
                                onClick={generarPdfRutina}
                                disabled={generandoPdf}
                            >
                                <FiDownload />
                                {generandoPdf ? 'Generando PDF...' : 'Descargar PDF'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    )
}
