// src/pages/Dieta.jsx
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import {
    guardarPlan,
    obtenerUltimoPlan,
    obtenerPlanes,
    eliminarPlan,
    // actualizarPlan,
} from '../lib/planesService'
import { generarDietaGemini } from '../lib/geminiClient'
import {
    FiPlus,
    FiTrash2,
    FiEye,
    FiPlay,
    FiX,
    FiAlertTriangle,
} from 'react-icons/fi'

// Fallback SOLO si vienen datos rotos de la BD/IA
const semanaMock = [
    {
        dia: 'Lunes',
        kcal: 2100,
        comidas: [
            'Desayuno: Avena y fruta',
            'Comida: Pollo + quinoa',
            'Cena: Tortilla y ensalada',
        ],
    },
    {
        dia: 'Martes',
        kcal: 2050,
        comidas: [
            'Desayuno: Yogur + granola',
            'Comida: Lentejas',
            'Cena: Salmón al horno',
        ],
    },
    {
        dia: 'Miércoles',
        kcal: 2080,
        comidas: [
            'Desayuno: Tostadas + aguacate',
            'Comida: Arroz + pavo',
            'Cena: Crema de calabaza',
        ],
    },
    {
        dia: 'Jueves',
        kcal: 2120,
        comidas: [
            'Desayuno: Batido proteico',
            'Comida: Pasta integral',
            'Cena: Wok de verduras',
        ],
    },
    {
        dia: 'Viernes',
        kcal: 2000,
        comidas: [
            'Desayuno: Avena + cacao',
            'Comida: Garbanzos',
            'Cena: Huevo + verduras',
        ],
    },
    {
        dia: 'Sábado',
        kcal: 2200,
        comidas: [
            'Desayuno: Tortitas',
            'Comida: Paella mixta',
            'Cena: Ensalada completa',
        ],
    },
    {
        dia: 'Domingo',
        kcal: 2150,
        comidas: [
            'Desayuno: Tostadas francesas',
            'Comida: Pollo asado',
            'Cena: Crema + yogur',
        ],
    },
]

export default function Dieta() {
    const { session, perfil } = useAuth()
    const userId = session?.user?.id

    const [semana, setSemana] = useState([]) // array { dia, kcal, comidas[], imagenUrl? }
    const [planActual, setPlanActual] = useState(null) // fila de la tabla planes
    const [historial, setHistorial] = useState([])

    const [cargandoInicial, setCargandoInicial] = useState(true)
    const [generando, setGenerando] = useState(false)
    const [mensaje, setMensaje] = useState('')
    const [error, setError] = useState('')

    // Modales
    const [mostrarModalNueva, setMostrarModalNueva] = useState(false)
    const [nombreNuevaDieta, setNombreNuevaDieta] = useState('')

    const [mostrarModalVer, setMostrarModalVer] = useState(false)
    const [planSeleccionado, setPlanSeleccionado] = useState(null)

    const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false)
    const [planAEliminar, setPlanAEliminar] = useState(null)

    // Helpers: compatibilidad de formato de datos
    const extraerDiasDesdeDatos = (datos) => {
        if (!datos) return []
        if (Array.isArray(datos)) return datos // formato antiguo: array directo
        if (Array.isArray(datos.dias)) return datos.dias // formato nuevo: { nombre, dias: [...] }
        return []
    }

    const extraerNombrePlan = (plan) => {
        const datos = plan?.datos
        if (datos && !Array.isArray(datos) && typeof datos === 'object' && datos.nombre) {
            return datos.nombre
        }
        if (plan?.semana_inicio) return `Dieta del ${plan.semana_inicio}`
        return 'Dieta sin nombre'
    }

    const kcalTot = semana.reduce((acc, d) => acc + (d.kcal || 0), 0)

    // Cargar último plan + historial al entrar
    useEffect(() => {
        const cargar = async () => {
            if (!userId) {
                setCargandoInicial(false)
                return
            }
            setCargandoInicial(true)
            setError('')
            try {
                const ultimo = await obtenerUltimoPlan(userId, 'dieta')
                if (ultimo) {
                    console.log('[Dieta] Último plan cargado:', ultimo)
                    setPlanActual(ultimo)
                    const dias = extraerDiasDesdeDatos(ultimo.datos)
                    setSemana(dias.length ? dias : semanaMock)
                } else {
                    setPlanActual(null)
                    setSemana([])
                }

                const lista = await obtenerPlanes(userId, 'dieta')
                console.log('[Dieta] Historial de dietas cargado:', lista)
                setHistorial(lista || [])
            } catch (e) {
                console.error('[Dieta] Error al cargar datos iniciales:', e)
                setError('No se pudo cargar tu plan de dieta.')
            } finally {
                setCargandoInicial(false)
            }
        }
        cargar()
    }, [userId])

    // Generar nueva dieta (desde modal)
    const manejarConfirmarNuevaDieta = async (e) => {
        e.preventDefault()

        if (!userId) {
            setError('Debes iniciar sesión para generar tu plan de dieta.')
            return
        }

        if (!perfil) {
            setError('Completa tu perfil antes de generar la dieta.')
            return
        }

        if (!nombreNuevaDieta.trim()) {
            setError('El nombre de la dieta es obligatorio.')
            return
        }

        setGenerando(true)
        setError('')
        setMensaje('')

        try {
            console.log('[Dieta] Generando plan de dieta para perfil:', perfil)
            const nuevaSemana = await generarDietaGemini(perfil)
            console.log('[Dieta] Dieta generada (respuesta de Gemini):', nuevaSemana)

            if (!Array.isArray(nuevaSemana) || nuevaSemana.length === 0) {
                console.error('[Dieta] La respuesta de Gemini no es un array válido')
                setError('La IA no ha devuelto un plan de dieta válido.')
                setSemana([])
                return
            }

            const datosPlan = {
                nombre: nombreNuevaDieta.trim(),
                dias: nuevaSemana,
            }

            console.log('[Dieta] Guardando dieta en Supabase con datosPlan:', datosPlan)
            const plan = await guardarPlan(userId, 'dieta', datosPlan)
            console.log('[Dieta] Plan guardado en Supabase:', plan)

            setPlanActual(plan)
            const dias = extraerDiasDesdeDatos(plan.datos)
            setSemana(dias.length ? dias : semanaMock)

            setHistorial((prev) => [plan, ...prev])

            setMensaje('Dieta generada y guardada correctamente ✅')
            setNombreNuevaDieta('')
            setMostrarModalNueva(false)
        } catch (e) {
            console.error('[Dieta] Error al generar/guardar la dieta:', e)
            setError(e.message || 'No se pudo generar o guardar la dieta.')
        } finally {
            setGenerando(false)
        }
    }

    // Ver dieta desde historial
    const manejarVerPlan = (plan) => {
        setPlanSeleccionado(plan)
        setMostrarModalVer(true)
        setError('')
        setMensaje('')
    }

    // Empezar dieta desde el modal
    const manejarEmpezarPlanSeleccionado = () => {
        if (!planSeleccionado) return
        setPlanActual(planSeleccionado)
        const dias = extraerDiasDesdeDatos(planSeleccionado.datos)
        setSemana(dias.length ? dias : semanaMock)
        setMensaje(`Has comenzado la dieta "${extraerNombrePlan(planSeleccionado)}".`)
        setMostrarModalVer(false)
    }

    // Eliminar dieta: abrir modal
    const solicitarEliminarPlan = (plan) => {
        setPlanAEliminar(plan)
        setMostrarModalEliminar(true)
    }

    // Confirmar eliminación
    const confirmarEliminarPlan = async () => {
        if (!planAEliminar) return
        try {
            await eliminarPlan(planAEliminar.id, userId)
            setHistorial((prev) => prev.filter((p) => p.id !== planAEliminar.id))
            if (planActual?.id === planAEliminar.id) {
                setPlanActual(null)
                setSemana([])
            }
            setMensaje('Dieta eliminada correctamente.')
        } catch (e) {
            console.error('[Dieta] Error al eliminar dieta:', e)
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

    return (
        <section className="section">
            <div className="container">
                {/* Cabecera */}
                <div className="flex items-end justify-between gap-4">
                    <div>
                        <h1 className="section-title">Plan de dieta</h1>
                        <p className="mt-2 text-text-muted dark:text-white/80">
                            Menús variados y balanceados. Ajusta raciones según hambre y actividad.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            className="btn-ghost flex items-center gap-2"
                            onClick={() => setMostrarModalNueva(true)}
                            disabled={generando || !perfil || !userId}
                        >
                            <FiPlus />
                            {generando ? 'Generando...' : 'Generar nueva dieta'}
                        </button>
                        <button className="btn-primary">Descargar PDF</button>
                    </div>
                </div>

                {/* Mensajes */}
                {mensaje && <p className="text-green-500 mt-4">{mensaje}</p>}
                {error && <p className="text-red-500 mt-4">{error}</p>}

                {/* Cargando inicial */}
                {cargandoInicial && (
                    <p className="mt-4 text-sm text-text-muted dark:text-white/70">
                        Cargando tu último plan de dieta guardado...
                    </p>
                )}

                {/* Estado sin dietas */}
                {!cargandoInicial &&
                    !generando &&
                    !error &&
                    (!planActual || !historial.length) && (
                        <p className="mt-4 text-sm text-text-muted dark:text-white/70">
                            Pulsa <strong>Generar nueva dieta</strong> para crear tu primer plan de dieta
                            semanal.
                        </p>
                    )}

                {/* Indicador mientras genera */}
                {generando && (
                    <p className="mt-4 text-sm text-text-muted dark:text-white/70">
                        Generando / guardando plan de dieta...
                    </p>
                )}

                {/* Dieta actual */}
                {planActual && semana.length > 0 && (
                    <>
                        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {semana.map((d, i) => (
                                <article
                                    key={`dieta-dia-${d.dia || i}-${i}`}
                                    className="card card-pad"
                                >
                                    <header className="flex items-center justify-between gap-3">
                                        <div>
                                            <h2 className="font-semibold text-lg text-brand">{d.dia}</h2>
                                            <span className="text-sm text-text-muted dark:text-white/70">
                        {d.kcal} kcal
                      </span>
                                        </div>

                                        {d.imagenUrl && (
                                            <div className="shrink-0">
                                                <img
                                                    src={d.imagenUrl}
                                                    alt={`Ilustración de plato para ${d.dia}`}
                                                    className="w-24 h-24 rounded-lg object-cover border border-slate-700"
                                                    loading="lazy"
                                                />
                                            </div>
                                        )}
                                    </header>

                                    <ul className="mt-4 space-y-2 text-sm">
                                        {d.comidas?.map((c, j) => (
                                            <li
                                                key={`dieta-${d.dia || i}-comida-${j}`}
                                                className="list-disc ml-5"
                                            >
                                                {c}
                                            </li>
                                        ))}
                                    </ul>
                                </article>
                            ))}
                        </div>

                        {/* Totales de kcal */}
                        <div className="mt-8 card card-pad">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-text-muted dark:text-white/70">
                                    Calorías totales aprox.
                                </p>
                                <p className="text-lg font-semibold">{kcalTot} kcal / semana</p>
                            </div>
                        </div>
                    </>
                )}

                {/* Historial de dietas */}
                <div className="mt-10 card card-pad">
                    <h2 className="font-semibold text-lg">Historial de dietas</h2>
                    {historial.length === 0 ? (
                        <p className="mt-2 text-sm text-text-muted dark:text-white/70">
                            Aún no tienes dietas guardadas.
                        </p>
                    ) : (
                        <ul className="mt-4 space-y-2 text-sm">
                            {historial.map((p) => (
                                <li
                                    key={`dieta-plan-${p.id}`}
                                    className="flex items-center justify-between gap-4 border-b border-white/10 pb-2 last:border-none"
                                >
                                    <div className="flex-1">
                                        <p className="font-medium">{extraerNombrePlan(p)}</p>
                                        <p className="text-xs text-text-muted dark:text-white/60">
                                            Semana inicio: {p.semana_inicio}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            className="btn-ghost flex items-center gap-1 text-xs"
                                            onClick={() => manejarVerPlan(p)}
                                        >
                                            <FiEye />
                                            Ver dieta
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

            {/* MODAL: Generar nueva dieta */}
            {mostrarModalNueva && (
                <div
                    className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4"
                    onClick={() => {
                        setMostrarModalNueva(false)
                        setNombreNuevaDieta('')
                    }}
                >
                    <div
                        className="w-full max-w-md rounded-xl bg-slate-900 p-6 shadow-2xl border border-slate-700 max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-slate-700"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-semibold text-white">
                                    Generar nueva dieta
                                </h2>
                                <p className="text-sm text-slate-300 mt-1">
                                    Introduce el nombre de tu nuevo plan de dieta semanal.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setMostrarModalNueva(false)
                                    setNombreNuevaDieta('')
                                }}
                                className="text-slate-400 hover:text-slate-100"
                            >
                                <FiX className="text-lg" />
                            </button>
                        </div>

                        <form onSubmit={manejarConfirmarNuevaDieta} className="space-y-4">
                            <div className="space-y-1.5">
                                <label
                                    htmlFor="nombreDieta"
                                    className="block text-sm font-medium text-slate-200"
                                >
                                    Nombre de la dieta
                                </label>
                                <input
                                    id="nombreDieta"
                                    type="text"
                                    value={nombreNuevaDieta}
                                    onChange={(e) => setNombreNuevaDieta(e.target.value)}
                                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm
                             text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2
                             focus:ring-emerald-500 focus:border-transparent"
                                    placeholder="Ej. Definición 2000 kcal"
                                    autoFocus
                                />
                            </div>

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

            {/* MODAL: Ver dieta */}
            {mostrarModalVer && planSeleccionado && (
                <div
                    className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4"
                    onClick={() => setMostrarModalVer(false)}
                >
                    <div
                        className="w-full max-w-4xl rounded-xl bg-slate-900 p-6 shadow-2xl border border-slate-700 max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-slate-700"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <div>
                                <h2 className="text-lg font-semibold text-white">
                                    {extraerNombrePlan(planSeleccionado)}
                                </h2>
                                <p className="text-xs text-slate-300">
                                    Semana inicio: {planSeleccionado.semana_inicio}
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

                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {extraerDiasDesdeDatos(planSeleccionado.datos).map((d, i) => (
                                <article
                                    key={`modal-dieta-dia-${d.dia || i}-${i}`}
                                    className="card card-pad"
                                >
                                    <header className="flex items-center justify-between gap-3">
                                        <div>
                                            <h3 className="font-semibold text-lg text-brand">{d.dia}</h3>
                                            <span className="text-sm text-text-muted dark:text-white/70">
                        {d.kcal} kcal
                      </span>
                                        </div>

                                        {d.imagenUrl && (
                                            <div className="shrink-0">
                                                <img
                                                    src={d.imagenUrl}
                                                    alt={`Ilustración de plato para ${d.dia}`}
                                                    className="w-24 h-24 rounded-lg object-cover border border-slate-700"
                                                    loading="lazy"
                                                />
                                            </div>
                                        )}
                                    </header>

                                    <ul className="mt-4 space-y-2 text-sm">
                                        {d.comidas?.map((c, j) => (
                                            <li
                                                key={`modal-dieta-${d.dia || i}-comida-${j}`}
                                                className="list-disc ml-5"
                                            >
                                                {c}
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
                                Empezar dieta
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: Confirmar eliminación de dieta */}
            {mostrarModalEliminar && planAEliminar && (
                <div
                    className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4"
                    onClick={cerrarModalEliminar}
                >
                    <div
                        className="w-full max-w-md rounded-xl bg-slate-900 p-6 shadow-2xl border border-slate-700 max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-slate-700"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="flex items-center gap-2">
                                <FiAlertTriangle className="text-red-400 text-xl" />
                                <h2 className="text-lg font-semibold text-white">
                                    Eliminar dieta
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
                            ¿Seguro que quieres eliminar la dieta{' '}
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
