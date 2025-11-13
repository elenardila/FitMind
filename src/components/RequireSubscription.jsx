// components/RequireSubscription.jsx
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function RequireSubscription({ children }) {
  const { perfil, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    console.log('[RequireSubscription] Cargando perfil...')
    return <div className="section"><div className="container">Comprobando suscripción…</div></div>
  }

  console.log('[RequireSubscription] perfil actual:', perfil)

  if (!perfil) {
    console.warn('[RequireSubscription] Sin perfil, redirigiendo a /perfil')
    return <Navigate to="/perfil" replace state={{ from: location, reason: 'sin-perfil' }} />
  }

  const { suscrito, suscripcion_vence_en } = perfil
  let activa = !!suscrito

  if (activa && suscripcion_vence_en) {
    const hoy = new Date()
    const vence = new Date(suscripcion_vence_en)
    if (vence < hoy) {
      activa = false
    }
  }

  if (!activa) {
    console.warn('[RequireSubscription] Usuario sin suscripción activa, redirigiendo a /perfil')
    return <Navigate to="/perfil" replace state={{ from: location, reason: 'no-sub' }} />
  }

  return children
}
