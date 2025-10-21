import { Link } from 'react-router-dom'

export default function Layout({ children }) {
    return (
        <>
            <nav className="app-nav">
                <div className="nav-inner">
                    <Link to="/" className="nav-title">FitMind</Link>
                    <div className="nav-actions">
                        <Link to="/login" className="btn-ghost">Iniciar sesión</Link>
                        <Link to="/control" className="btn-primary">Panel</Link>
                    </div>
                </div>
            </nav>
            <main>{children}</main>
            <footer className="border-t border-black/5 dark:border-white/10">
                <div className="container py-8 text-center text-sm text-text-muted dark:text-white/60">
                    <p>© {new Date().getFullYear()} FitMind</p>
                    <nav className="mt-3 flex justify-center gap-6">
                        <Link className="hover:text-brand" to="/politica">Privacidad</Link>
                        <a className="hover:text-brand" href="mailto:hola@fitmind.local">Contacto</a>
                    </nav>
                </div>
            </footer>
        </>
    )
}
