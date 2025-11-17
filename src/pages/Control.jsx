// src/pages/Control.jsx
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { obtenerUltimoPlan } from '../lib/planesService'

// 🔢 IMC = peso(kg) / (altura(m)²)
function calcularIMC(pesoKg, alturaCm) {
  if (!pesoKg || !alturaCm) return null
  const alturaM = alturaCm / 100
  if (!alturaM || alturaM <= 0) return null
  return Number((pesoKg / (alturaM * alturaM)).toFixed(1))
}

// 📊 Clasificación simple del IMC
function clasificarIMC(imc) {
  if (imc == null) return null
  if (imc < 18.5) return 'Bajo peso'
  if (imc < 25) return 'Peso ideal'
  if (imc < 30) return 'Sobrepeso'
  return 'Obesidad'
}

// 🔥 Calorías diarias recomendadas según objetivo
function calcularKcalDiarias({ pesoKg, alturaCm, edad, sexo, nivelActividad, objetivo }) {
  if (!pesoKg || !alturaCm || !edad) return null

  let tmb
  if (sexo === 'mujer')
    tmb = 10 * pesoKg + 6.25 * alturaCm - 5 * edad - 161
  else if (sexo === 'hombre')
    tmb = 10 * pesoKg + 6.25 * alturaCm - 5 * edad + 5
  else
    tmb = 10 * pesoKg + 6.25 * alturaCm - 5 * edad

  const factores = {
    sedentario: 1.2,
    ligero: 1.375,
    medio: 1.55,
    alto: 1.725,
    atleta: 1.9,
  }

  const factorActividad = factores[nivelActividad] || 1.55
  const mantenimiento = tmb * factorActividad

  const factorObjetivo =
    objetivo === 'perder' ? 0.85 :
    objetivo === 'ganar' ? 1.15 :
    1

  return Math.round(mantenimiento * factorObjetivo)
}

// 🗓️ Día actual
function obtenerInfoSemana() {
  const hoy = new Date()
  const nombreLower = hoy.toLocaleDateString('es-ES', { weekday: 'long' })
  const nombreDia = nombreLower.charAt(0).toUpperCase() + nombreLower.slice(1)

  const orden = {
    lunes: 1, martes: 2, miércoles: 3, miercoles: 3,
    jueves: 4, viernes: 5, sábado: 6, sabado: 6, domingo: 7
  }

  const key = nombreLower.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const diaSemana = orden[key] || 0
  const porcentaje = diaSemana ? (diaSemana / 7) * 100 : 0

  return { nombreDia, diaSemana, porcentaje }
}

// Coincidencia flexible de días
function coincideDiaPlan(diaPlan, nombreLargo) {
  if (!diaPlan) return false
  const p = diaPlan.toLowerCase()
  const base = nombreLargo.toLowerCase()
  const alternativas = [base]

  if (base.startsWith('mier')) alternativas.push('mié', 'mie')
  else if (base.startsWith('saba')) alternativas.push('sáb', 'sab')
  else alternativas.push(base.slice(0, 3))

  return alternativas.some(pref => p.startsWith(pref))
}

function Stat({ label, value }) {
  return (
    <div className="card card-pad">
      <p className="text-sm text-text-muted dark:text-white/70">{label}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
    </div>
  )
}

export default function Control() {
  const { perfil, session } = useAuth()
  const userId = session?.user?.id

  const [hoyEntrenamiento, setHoyEntrenamiento] = useState(null)
  const [hoyDieta, setHoyDieta] = useState(null)
  const [errorResumen, setErrorResumen] = useState('')
  const [cargandoResumen, setCargandoResumen] = useState(false)

  const { nombreDia, diaSemana, porcentaje } = useMemo(() => obtenerInfoSemana(), [])

  // 🧮 Datos usuario
  const {
    pesoKg, alturaCm, edad, sexo, nivelActividad, objetivo,
    imc, imcLabel, kcalObjetivo
  } = useMemo(() => {
    const datos = {
      pesoKg: perfil?.peso_kg ?? null,
      alturaCm: perfil?.altura_cm ?? null,
      edad: perfil?.edad ?? null,
      sexo: perfil?.sexo ?? 'no_especificado',
      nivelActividad: perfil?.nivel_actividad ?? 'medio',
      objetivo: perfil?.objetivo ?? 'mantener',
    }

    return {
      ...datos,
      imc: calcularIMC(datos.pesoKg, datos.alturaCm),
      imcLabel: clasificarIMC(calcularIMC(datos.pesoKg, datos.alturaCm)),
      kcalObjetivo: calcularKcalDiarias(datos),
    }
  }, [perfil])

  const faltanDatos =
    !pesoKg || !alturaCm || !edad || !sexo || !nivelActividad || !objetivo

  // 🔹 KPIs finales
  const stats = [
    {
      label: 'Peso',
      value: pesoKg ? `${pesoKg} kg` : '—',
    },
    {
      label: 'IMC',
      value: imc != null ? `${imc} ${imcLabel}` : '—',
    },
    {
      label: 'Kcal diarias recomendadas',
      value: kcalObjetivo ? `${kcalObjetivo} kcal` : '—',
    },
  ]

  // 🔄 Resumen de hoy
  useEffect(() => {
    if (!userId) return

    const cargarResumen = async () => {
      setCargandoResumen(true)
      setErrorResumen('')
      try {
        const [planEnt, planDiet] = await Promise.all([
          obtenerUltimoPlan(userId, 'entrenamiento'),
          obtenerUltimoPlan(userId, 'dieta'),
        ])

        const d = nombreDia

        setHoyEntrenamiento(
          Array.isArray(planEnt?.datos)
            ? planEnt.datos.find(elem => coincideDiaPlan(elem.dia, d))
            : null
        )

        setHoyDieta(
          Array.isArray(planDiet?.datos)
            ? planDiet.datos.find(elem => coincideDiaPlan(elem.dia, d))
            : null
        )
      } catch (e) {
        console.error('[Control] Error resumen:', e)
        setErrorResumen('No se pudo cargar el resumen de hoy.')
      } finally {
        setCargandoResumen(false)
      }
    }

    cargarResumen()
  }, [userId, nombreDia])

  return (
    <section className="section">
      <div className="container">
        <h1 className="section-title">Tu panel de control</h1>

        {faltanDatos && (
          <p className="mt-4 text-sm text-amber-500">
            Completa tu perfil para obtener métricas precisas.
          </p>
        )}

        {/* KPIs */}
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {stats.map((s, i) => <Stat key={i} {...s} />)}
        </div>

        {/* Resumen + progreso semanal */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3 items-start">

          {/* Resumen de hoy */}
          <div className="card card-pad lg:col-span-2">
            <h2 className="font-semibold text-lg">Resumen de hoy</h2>
            <p className="mt-1 text-sm text-text-muted dark:text-white/70">
              {nombreDia}
            </p>

            {cargandoResumen && (
              <p className="mt-3 text-sm text-text-muted dark:text-white/70">
                Cargando resumen...
              </p>
            )}

            {errorResumen && (
              <p className="mt-3 text-sm text-red-500">{errorResumen}</p>
            )}

            {!cargandoResumen && !errorResumen && (
              <div className="mt-4 space-y-6">

                {/* Entrenamiento */}
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Entrenamiento</h3>
                  </div>

                  {hoyEntrenamiento ? (
                    <div className="mt-2">
                      <p className="text-sm font-medium">{hoyEntrenamiento.dia}</p>
                      <ul className="mt-2 space-y-1 text-xs">
                        {hoyEntrenamiento.ejercicios?.slice(0, 4).map((e, i) => (
                          <li key={i}>• {e.nombre} ({e.series})</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-text-muted dark:text-white/70">
                      No hay entrenamiento asignado hoy.
                    </p>
                  )}
                </div>

                {/* Dieta */}
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Dieta</h3>
                  </div>

                  {hoyDieta ? (
                    <div className="mt-2">
                      <p className="text-sm font-medium">
                        {hoyDieta.dia} · <span className="text-text-muted dark:text-white/70">{hoyDieta.kcal} kcal</span>
                      </p>
                      <ul className="mt-2 space-y-1 text-xs">
                        {hoyDieta.comidas?.slice(0, 4).map((c, i) => (
                          <li key={i}>• {c}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-text-muted dark:text-white/70">
                      No hay dieta asignada hoy.
                    </p>
                  )}
                </div>

              </div>
            )}
          </div>

          {/* Progreso semanal */}
          <div className="card card-pad">
            <h2 className="font-semibold text-lg">Progreso semanal</h2>
            <p className="mt-2 text-sm text-text-muted dark:text-white/70">
              Día: <strong>{nombreDia}</strong>
            </p>
            <div className="mt-4">
              <div className="h-3 w-full rounded-full bg-black/10 dark:bg-white/10">
                <div
                  className="h-3 rounded-full bg-brand"
                  style={{ width: `${porcentaje}%` }}
                />
              </div>
              <p className="mt-2 text-sm">{diaSemana} / 7 días</p>
            </div>
          </div>

        </div>

        {/* Acciones principales */}
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="card card-pad">
            <h2 className="font-semibold text-lg">Plan de entrenamiento</h2>
            <p className="mt-2 text-sm text-text-muted dark:text-white/70">
              Visualiza y gestiona tu rutina semanal.
            </p>
            <div className="mt-4">
              <Link to="/entrenamiento" className="btn-primary">Ver rutina</Link>
            </div>
          </div>

          <div className="card card-pad">
            <h2 className="font-semibold text-lg">Plan de dieta</h2>
            <p className="mt-2 text-sm text-text-muted dark:text-white/70">
              Consulta tus menús personalizados.
            </p>
            <div className="mt-4">
              <Link to="/dieta" className="btn-primary">Ver menús</Link>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
