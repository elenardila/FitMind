import { Link } from 'react-router-dom'

function Stat({ label, value, hint }) {
    return (
        <div className="card card-pad">
            <p className="text-sm text-text-muted dark:text-white/70">{label}</p>
            <p className="mt-1 text-3xl font-bold">{value}</p>
            {hint && <p className="mt-2 text-sm text-text-muted dark:text-white/60">{hint}</p>}
        </div>
    )
}

export default function Control() {
    // Datos de ejemplo (sustituye por tu estado/props)
    const stats = [
        { label: 'Peso', value: '67.8 kg', hint: 'Última actualización: hoy' },
        { label: 'IMC', value: '22.1', hint: 'Rango saludable' },
        { label: 'Kcal diarias', value: '2.100', hint: 'Objetivo para mantenimiento' }
    ]

    const proximas = [
        { dia: 'Hoy', titulo: 'Full body (45 min)', lugar: 'Casa' },
        { dia: 'Jue', titulo: 'Pull + core (40 min)', lugar: 'Gimnasio' },
        { dia: 'Sáb', titulo: 'Cardio suave (30 min)', lugar: 'Parque' }
    ]

    return (
        <>
            <section className="section">
                <div className="container">
                    <h1 className="section-title">Tu panel de control</h1>
                    <p className="mt-2 text-text-muted dark:text-white/80">
                        Revisa tu progreso y genera tus planes semanales con un clic.
                    </p>

                    {/* KPIs */}
                    <div className="mt-8 grid gap-6 md:grid-cols-3">
                        {stats.map((s, i) => <Stat key={i} {...s} />)}
                    </div>

                    {/* Acciones principales */}
                    <div className="mt-8 grid gap-6 md:grid-cols-2">
                        <div className="card card-pad">
                            <h2 className="font-semibold text-lg">Plan de entrenamiento</h2>
                            <p className="mt-2 text-sm text-text-muted dark:text-white/70">
                                Genera tu rutina para la semana según tu disponibilidad.
                            </p>
                            <div className="mt-4 flex gap-3">
                                <Link to="/entrenamiento" className="btn-primary">Ver rutina</Link>
                                <button className="btn-ghost">Regenerar</button>
                            </div>
                        </div>

                        <div className="card card-pad">
                            <h2 className="font-semibold text-lg">Plan de dieta</h2>
                            <p className="mt-2 text-sm text-text-muted dark:text-white/70">
                                Menús equilibrados basados en tus preferencias.
                            </p>
                            <div className="mt-4 flex gap-3">
                                <Link to="/dieta" className="btn-primary">Ver menús</Link>
                                <button className="btn-ghost">Regenerar</button>
                            </div>
                        </div>
                    </div>

                    {/* Progreso + próximas sesiones */}
                    <div className="mt-8 grid gap-6 lg:grid-cols-2">
                        <div className="card card-pad">
                            <h2 className="font-semibold text-lg">Progreso semanal</h2>
                            <p className="mt-2 text-sm text-text-muted dark:text-white/70">Sesiones completadas</p>
                            <div className="mt-4">
                                <div className="h-3 w-full rounded-full bg-black/10 dark:bg-white/10">
                                    <div className="h-3 rounded-full bg-brand" style={{ width: '60%' }} />
                                </div>
                                <p className="mt-2 text-sm">3 / 5 sesiones</p>
                            </div>
                        </div>

                        <div className="card card-pad">
                            <h2 className="font-semibold text-lg">Próximas sesiones</h2>
                            <ul className="mt-4 space-y-3">
                                {proximas.map((p, i) => (
                                    <li key={i} className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">{p.titulo}</p>
                                            <p className="text-sm text-text-muted dark:text-white/70">{p.lugar}</p>
                                        </div>
                                        <span className="text-sm text-brand font-semibold">{p.dia}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                </div>
            </section>
        </>
    )
}
