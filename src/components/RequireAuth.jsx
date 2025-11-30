import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RequireAuth({ children }) {
    const { session, loading, perfil, esAdmin } = useAuth()
    const location = useLocation()


    // Mientras carga → BLOQUEAMOS TODO (sin comprobar session)
    if (loading) {
        return (
            <section className="section">
                <div className="container">
                    <p>Comprobando sesión…</p>
                </div>
            </section>
        )
    }

    // Sin sesión → login
    if (!session) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    // Cuenta desactivada → bloquear acceso inmediato
    if (perfil && perfil.activo === false) {
        return <Navigate to="/login" replace />
    }

    // 4 Admin intentando entrar a zonas de usuario
    if (esAdmin) {
        return <Navigate to="/admin" replace />
    }

    // Usuario normal → acceso OK
    return children
}
