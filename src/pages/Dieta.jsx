// src/pages/Dieta.jsx
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import {
  guardarPlan,
  obtenerUltimoPlan,
  obtenerPlanes,
  eliminarPlan,
  actualizarPlan,
} from '../lib/planesService'
import { generarDietaGemini } from '../lib/geminiClient'

// Datos base (fallback si algo falla con la IA o no hay nada)
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

  const [semana, setSemana] = useState(semanaMock)
  const [planActual, setPlanActual] = useState(null)
  const [historial, setHistorial] = useState([])

  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  const kcalTot = semana.reduce((acc, d) => acc + (d.kcal || 0), 0)

  // Cargar último plan + historial de dietas
  useEffect(() => {
    const cargar = async () => {
      if (!userId) return
      setCargando(true)
      setError('')
      try {
        const ultimo = await obtenerUltimoPlan(userId, 'dieta')
        if (ultimo) {
          setPlanActual(ultimo)
          setSemana(ultimo.datos || semanaMock) // datos es el array de días
        }
        const lista = await obtenerPlanes(userId, 'dieta')
        setHistorial(lista)
      } catch (e) {
        console.error(e)
        setError('No se pudo cargar tu plan de dieta.')
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [userId])

  const onRegenerar = async () => {
    if (!userId) {
      setError('Debes iniciar sesión para generar tu plan de dieta.')
      return
    }

    if (!perfil) {
      setError('Completa tu perfil antes de generar la dieta.')
      return
    }

    setCargando(true)
    setError('')
    setMensaje('')

    try {
      console.log('[Dieta] Generando plan de dieta para perfil:', perfil)
      const nuevaSemana = await generarDietaGemini(perfil)
      console.log('[Dieta] Dieta generada:', nuevaSemana)

      if (!Array.isArray(nuevaSemana) || nuevaSemana.length === 0) {
        setError('La IA no ha devuelto un plan de dieta válido.')
        setSemana(semanaMock)
        return
      }

      setSemana(nuevaSemana)

      const plan = await guardarPlan(userId, 'dieta', nuevaSemana)
      setPlanActual(plan)
      setHistorial((prev) => [plan, ...prev])

      setMensaje('Dieta generada y guardada correctamente ✅')
    } catch (e) {
      console.error('[Dieta] Error al generar/guardar la dieta:', e)
      setError(e.message || 'No se pudo generar o guardar la dieta.')
    } finally {
      setCargando(false)
    }
  }

  const onSeleccionarPlan = (plan) => {
    setPlanActual(plan)
    setSemana(plan.datos || semanaMock)
    setMensaje(`Has cargado la dieta de la semana que empieza el ${plan.semana_inicio}.`)
    setError('')
  }

  const onEliminarPlan = async (plan) => {
    if (!window.confirm('¿Eliminar este plan de dieta?')) return
    try {
      await eliminarPlan(plan.id, userId)
      setHistorial((prev) => prev.filter((p) => p.id !== plan.id))
      if (planActual?.id === plan.id) {
        setPlanActual(null)
        setSemana(semanaMock)
      }
    } catch (e) {
      console.error(e)
      setError('No se ha podido eliminar el plan.')
    }
  }

  // Si quisieras editar manualmente un día/comida,
  // modificarías `semana` con setSemana(...) y luego:
  // await actualizarPlan(planActual.id, userId, semana)

  return (
    <section className="section">
      <div className="container">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="section-title">Plan de dieta (semana)</h1>
            <p className="mt-2 text-text-muted dark:text-white/80">
              Menús variados y balanceados. Ajusta raciones según hambre y actividad.
            </p>
          </div>
          <div className="flex gap-3">
            <button className="btn-ghost" onClick={onRegenerar} disabled={cargando}>
              {cargando ? 'Generando...' : 'Regenerar'}
            </button>
            <button className="btn-primary">Descargar PDF</button>
          </div>
        </div>

        {mensaje && <p className="text-green-500 mt-4">{mensaje}</p>}
        {error && <p className="text-red-500 mt-4">{error}</p>}

        {!cargando && !error && (!planActual || !historial.length) && (
          <p className="mt-4 text-sm text-text-muted dark:text-white/70">
            Pulsa <strong>Regenerar</strong> para crear tu primer plan de dieta semanal.
          </p>
        )}

        {cargando && (
          <p className="mt-4 text-sm text-text-muted dark:text-white/70">
            Cargando / guardando plan...
          </p>
        )}

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {semana.map((d, i) => (
            <article key={i} className="card card-pad">
              <header className="flex items-center justify-between">
                <h2 className="font-semibold text-lg text-brand">{d.dia}</h2>
                <span className="text-sm text-text-muted dark:text-white/70">
                  {d.kcal} kcal
                </span>
              </header>
              <ul className="mt-4 space-y-2 text-sm">
                {d.comidas?.map((c, j) => (
                  <li key={j} className="list-disc ml-5">
                    {c}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="mt-8 card card-pad">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-muted dark:text-white/70">
              Calorías totales aprox.
            </p>
            <p className="text-lg font-semibold">{kcalTot} kcal / semana</p>
          </div>
        </div>

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
                  key={p.id}
                  className="flex items-center justify-between gap-4 border-b border-white/10 pb-2 last:border-none"
                >
                  <button
                    className="text-left flex-1 hover:underline"
                    onClick={() => onSeleccionarPlan(p)}
                  >
                    Semana inicio: {p.semana_inicio}
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
