import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RequireAuth({ children }) {
    const { session, loading, esAdmin } = useAuth()
    const location = useLocation()

    console.log('[RequireAuth] loading:', loading, 'session:', session, 'esAdmin:', esAdmin)

    // Solo mostramos "Comprobando sesión…" si NO tenemos sesión todavía
    if (loading && !session) {
        return (
            <section className="section">
                <div className="container">
                    <p>Comprobando sesión…</p>
                </div>
            </section>
        )
    }

    // Si tras la carga inicial no hay sesión -> al login
    if (!session) {
        console.warn('[RequireAuth] Sin sesión, redirigiendo a /login')
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    // Admin intentando entrar a rutas de usuario → lo mandamos a /admin
    if (esAdmin) {
        console.warn(
            '[RequireAuth] Admin intentando acceder a ruta de usuario, redirigiendo a /admin'
        )
        return <Navigate to="/admin" replace />
    }

    return children
}
