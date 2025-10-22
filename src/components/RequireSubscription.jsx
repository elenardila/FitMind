import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RequireSubscription({ children }) {
    const { perfil, loading } = useAuth()
    const location = useLocation()
    if (loading) return null
    const activa = !!perfil?.suscrito && (!perfil?.suscripcion_vence_en || new Date(perfil.suscripcion_vence_en) >= new Date())
    if (!activa) return <Navigate to="/control" state={{ from: location, needSub: true }} replace />
    return children
}
