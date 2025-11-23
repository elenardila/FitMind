import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const TESTIMONIOS = [
    { nombre: 'Laura, 32 años', detalle: 'Trabajadora con poco tiempo', texto: 'Antes saltaba de rutina...' },
    { nombre: 'Carlos, 28 años', detalle: 'Nivel intermedio en el gym', texto: 'Me gusta que la IA...' },
    { nombre: 'Marta, 40 años', detalle: 'Teletrabajo y familia', texto: 'Las dietas semanales me han salvado...' },
    { nombre: 'Javier, 25 años', detalle: 'Empieza desde cero', texto: 'Nunca había seguido un plan completo...' },
    { nombre: 'Ana, 36 años', detalle: 'Objetivo: perder peso', texto: 'No siento que esté a dieta eterna...' },
    { nombre: 'Diego, 30 años', detalle: 'Le aburren las rutinas fijas', texto: 'Lo que más me gusta es que...' },
]

export default function Home() {
    const [indiceTestimonio, setIndiceTestimonio] = useState(0)

    useEffect(() => {
        const id = setInterval(() => {
            setIndiceTestimonio((prev) => (prev + 1) % TESTIMONIOS.length)
        }, 7000)
        return () => clearInterval(id)
    }, [])

    const testimonioActivo = TESTIMONIOS[indiceTestimonio]

    return (
        <>
            {/* HERO */}
            <section className="relative min-h-[80vh] grid place-items-center text-center overflow-hidden">
                <img src="/img/hero.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60" />

                <div className="container px-6 md:px-12 lg:px-20 relative z-10 py-16 md:py-24">
                    <h1 className="font-display text-4xl md:text-6xl font-black text-white leading-tight">
                        Tu entrenador y nutricionista con IA
                    </h1>

                    <p className="mt-4 text-white/90 max-w-2xl mx-auto">
                        FitMind genera tus entrenamientos y dietas según tus datos, tu objetivo y tu tiempo disponible.
                    </p>

                    <div className="mt-6 flex flex-wrap justify-center gap-3 text-xs md:text-sm text-white/80">
                        <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20">Rutinas adaptadas</span>
                        <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20">Dietas equilibradas</span>
                        <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20">Todo en una app</span>
                    </div>

                    <Link to="/control" className="btn-primary mt-8 text-base px-8 py-3 inline-block">
                        Empezar ahora
                    </Link>

                    <p className="mt-3 text-xs text-white/70">
                        Te registras, completas tu perfil y tu primer plan estará listo.
                    </p>
                </div>
            </section>

            {/* ENTRENAMIENTOS */}
            <section className="section py-16 md:py-24">
                <div className="container px-6 md:px-12 lg:px-20 grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
                    <div>
                        <h2 className="section-title">Entrenamientos que evolucionan contigo</h2>
                        <p className="mt-3 text-text-muted dark:text-white/80">
                            FitMind genera rutinas realistas basadas en tu nivel, experiencia, objetivo y disponibilidad.
                        </p>

                        <ul className="mt-4 space-y-2 text-sm text-text-muted dark:text-white/75">
                            <li>• Qué toca cada día, sin dudas.</li>
                            <li>• Casa o gimnasio, tú eliges.</li>
                            <li>• Ejercicios con series, notas y consejos.</li>
                            <li>• Guarda tus rutinas y recupera semanas anteriores.</li>
                        </ul>

                        <p className="mt-4 text-sm text-text-muted dark:text-white/70">
                            Si cambias de objetivo, la IA se adapta automáticamente.
                        </p>
                    </div>

                    <img
                        src="/img/workout.jpg"
                        alt=""
                        className="rounded-2xl shadow-2xl aspect-[4/3] object-cover border border-slate-800"
                    />
                </div>
            </section>

            {/* DIETAS */}
            <section className="section py-16 md:py-24 bg-slate-950/70">
                <div className="container px-6 md:px-12 lg:px-20 grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
                    <img
                        src="/img/diet.jpg"
                        alt=""
                        className="rounded-2xl shadow-2xl aspect-[4/3] object-cover border border-slate-800"
                    />

                    <div>
                        <h2 className="section-title text-white">Dietas que encajan con tu vida real</h2>
                        <p className="mt-3 text-slate-200">
                            Menús semanales fáciles, equilibrados y sin ingredientes raros. Justo lo que necesitas para
                            organizarte sin pensar.
                        </p>

                        <ul className="mt-4 space-y-2 text-sm text-slate-200/90">
                            <li>• 7 días de comidas completas.</li>
                            <li>• Calorías orientativas según tu objetivo.</li>
                            <li>• Alergias y preferencias incluidas.</li>
                            <li>• Descarga en PDF para tenerla siempre a mano.</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* TESTIMONIOS */}
            <section className="section py-16 md:py-24">
                <div className="container px-6 md:px-12 lg:px-20">
                    <div className="text-center max-w-2xl mx-auto">
                        <h2 className="section-title">Lo que opinan quienes ya lo usan</h2>
                        <p className="mt-3 text-text-muted dark:text-white/80">
                            Testimonios ficticios (por ahora 😏) de usuarios con situaciones reales.
                        </p>
                    </div>

                    <div className="mt-10 flex justify-center">
                        <article className="max-w-xl w-full bg-slate-900/95 text-white rounded-2xl p-6 md:p-8 shadow-xl border border-slate-700">
                            <p className="text-sm md:text-base leading-relaxed">“{testimonioActivo.texto}”</p>
                            <div className="mt-4">
                                <p className="font-semibold">{testimonioActivo.nombre}</p>
                                <p className="text-xs text-slate-300">{testimonioActivo.detalle}</p>
                            </div>
                        </article>
                    </div>

                    <div className="mt-4 flex justify-center gap-2">
                        {TESTIMONIOS.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setIndiceTestimonio(index)}
                                className={`h-2.5 rounded-full transition-all ${
                                    index === indiceTestimonio
                                        ? 'w-6 bg-brand'
                                        : 'w-2 bg-slate-400/60 hover:bg-slate-300/80'
                                }`}
                            />
                        ))}
                    </div>
                </div>
            </section>
        </>
    )
}
