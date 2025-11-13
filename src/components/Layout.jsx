import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Layout({ children }) {
  const { session, perfil, loading, logout } = useAuth()
  const navigate = useNavigate()

  const isLogged = !!session?.user
  const avatarSrc = perfil?.avatar_url
    ? perfil.avatar_url
    : 'https://ui-avatars.com/api/?name=' +
      encodeURIComponent(perfil?.nombre || 'Usuario') +
      '&background=8c52ff&color=fff'

  return (
    <>
      <nav className="app-nav">
        <div className="nav-inner">
          <Link to="/" className="nav-title">FitMind</Link>

          <div className="nav-actions">
            {/* 🔁 Mejor separar loading / invitado / logueado */}
            {loading ? (
              // mientras se comprueba la sesión, no enseñamos nada “firme”
              <span className="text-sm text-text-muted dark:text-white/70">
                Comprobando sesión…
              </span>
            ) : !isLogged ? (
              <>
                <Link to="/login" className="btn-ghost">Iniciar sesión</Link>
                <Link to="/login" className="btn-primary">Registrarse</Link>
              </>
            ) : (
              <>
                <Link to="/control" className="btn-ghost">Panel</Link>

                <button
                  type="button"
                  onClick={() => navigate('/perfil')}
                  className="flex items-center gap-3 px-2 py-1 rounded-lg hover:bg-black/5 dark:hover:bg:white/10"
                >
                  <img
                    src={avatarSrc}
                    alt="Avatar"
                    className="h-8 w-8 rounded-full object-cover border border-black/10 dark:border-white/10"
                  />
                  <span className="text-sm">
                    Hola{perfil?.nombre ? `, ${perfil.nombre}` : ''}
                    {perfil?.es_admin ? ' · Admin' : ''}
                  </span>
                </button>

                <button
                  onClick={async () => {
                    // 🔐 cierre de sesión + navegación garantizada
                    try {
                      await logout()
                    } finally {
                      navigate('/login', { replace: true })
                    }
                  }}
                  className="btn-primary"
                >
                  Cerrar sesión
                </button>
              </>
            )}
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
