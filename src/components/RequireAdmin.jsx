import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RequireAdmin({ children }) {
  const { loading, session, esAdmin } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <section className="section">
        <div className="container">
          <p>Comprobando sesión…</p>
        </div>
      </section>
    )
  }

  if (!session) {
    console.warn('[RequireAdmin] Sin sesión, redirigiendo a /login')
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (!esAdmin) {
    console.warn('[RequireAdmin] Usuario sin permisos de admin, redirigiendo a /control')
    return <Navigate to="/control" replace />
  }

  return children
}
