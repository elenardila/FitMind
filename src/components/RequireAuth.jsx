import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RequireAuth({ children }) {
  const { session, loading } = useAuth()
  const location = useLocation()

  console.log('[RequireAuth] loading:', loading, 'session:', session)

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
    console.warn('[RequireAuth] Sin sesión, redirigiendo a /login')
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
