import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RequireAuth({ children }) {
    const { session, loading, perfil, esAdmin } = useAuth()
    const location = useLocation()

    console.log('[RequireAuth] loading:', loading, 'session:', session, 'esAdmin:', esAdmin)

    // 1️⃣ Mientras carga → BLOQUEAMOS TODO (sin comprobar session)
    if (loading) {
        return (
            <section className="section">
                <div className="container">
                    <p>Comprobando sesión…</p>
                </div>
            </section>
        )
    }

    // 2️⃣ Sin sesión → login
    if (!session) {
        console.warn('[RequireAuth] Sin sesión, redirigiendo a /login')
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    // 3️⃣ Cuenta desactivada → bloquear acceso inmediato
    if (perfil && perfil.activo === false) {
        console.warn('[RequireAuth] Cuenta desactivada → redirigiendo a /login')
        return <Navigate to="/login" replace />
    }

    // 4️⃣ Admin intentando entrar a zonas de usuario
    if (esAdmin) {
        return <Navigate to="/admin" replace />
    }

    // 5️⃣ Usuario normal → acceso OK
    return children
}
