import { Link } from 'react-router-dom'

export default function NotFound() {
    return (
        <section className="section">
            <div className="container grid place-items-center text-center min-h-[60vh]">
                <div className="max-w-lg">
                    <p className="text-brand font-bold text-8xl leading-none">404</p>
                    <h1 className="mt-4 section-title">Página no encontrada</h1>
                    <p className="mt-2 text-text-muted dark:text-white/80">
                        La ruta que has solicitado no existe o fue movida.
                    </p>
                    <div className="mt-6 flex justify-center gap-3">
                        <Link to="/" className="btn-primary">Volver al inicio</Link>
                        <Link to="/control" className="btn-ghost">Ir al panel</Link>
                    </div>
                </div>
            </div>
        </section>
    )
}
