import { Link } from 'react-router-dom'

export default function Home() {
    return (
        <>
            <section className="relative min-h-[80vh] grid place-items-center text-center">
                <img src="/img/hero.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/55" />
                <div className="container relative z-10">
                    <h1 className="font-display text-5xl md:text-6xl font-black text-white leading-tight">
                        Tu entrenador y nutricionista con IA
                    </h1>
                    <p className="mt-4 text-white/90 max-w-2xl mx-auto">
                        Planes que se adaptan a tu semana. Sin complicarte.
                    </p>
                    <Link to="/control" className="btn-primary mt-8 text-base px-6 py-3 inline-block">
                        Empezar ahora
                    </Link>
                </div>
            </section>

            <section className="section">
                <div className="container grid md:grid-cols-2 gap-10 items-center">
                    <div>
                        <h2 className="section-title">Entrenos que evolucionan</h2>
                        <p className="mt-3 text-text-muted dark:text-white/80">
                            Ajustes semanales según tu progreso, en casa o gym.
                        </p>
                    </div>
                    <img src="/img/workout.jpg" className="rounded-xl shadow-2xl aspect-[4/3] object-cover" />
                </div>
            </section>
        </>
    )
}
