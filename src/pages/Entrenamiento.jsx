export default function Entrenamiento() {
    // Demo — estructura sencilla tipo push/pull/legs
    const rutina = [
        {
            dia: 'Lun — Full body',
            ejercicios: [
                { nombre: 'Sentadilla', series: '4x8', nota: 'Técnica, controla bajada' },
                { nombre: 'Press banca', series: '4x6', nota: 'Pausa 1s en pecho' },
                { nombre: 'Remo con barra', series: '4x8', nota: 'Espalda recta' },
            ]
        },
        {
            dia: 'Mié — Pull + core',
            ejercicios: [
                { nombre: 'Dominadas / Jalón', series: '4x6-8', nota: 'Range completo' },
                { nombre: 'Remo mancuerna', series: '3x10', nota: 'Sin balanceo' },
                { nombre: 'Plancha', series: '3x40s', nota: 'Core firme' },
            ]
        },
        {
            dia: 'Vie — Push + piernas',
            ejercicios: [
                { nombre: 'Press militar', series: '4x6-8', nota: 'Codos bajo control' },
                { nombre: 'Zancadas', series: '3x12', nota: 'Paso largo, torso alto' },
                { nombre: 'Fondos / Flexiones', series: '3xAMRAP', nota: 'Buen rango' },
            ]
        }
    ]

    return (
        <section className="section">
            <div className="container">
                <div className="flex items-end justify-between gap-4">
                    <div>
                        <h1 className="section-title">Rutina semanal</h1>
                        <p className="mt-2 text-text-muted dark:text-white/80">
                            En casa o gym. Ajusta cargas si el esfuerzo es bajo/alto.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button className="btn-ghost">Regenerar</button>
                        <button className="btn-primary">Descargar PDF</button>
                    </div>
                </div>

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
            </div>
        </section>
    )
}
