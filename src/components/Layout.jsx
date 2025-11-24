import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FiMenu, FiX } from 'react-icons/fi'
import { useState } from 'react'

export default function Layout({ children }) {
    const { session, perfil, loading, logout, esAdmin } = useAuth()
    const navigate = useNavigate()
    const [open, setOpen] = useState(false)

    const isLogged = session?.user && perfil?.id

    const avatarSrc = perfil?.avatar_url
        ? perfil.avatar_url
        : 'https://ui-avatars.com/api/?name=' +
        encodeURIComponent(perfil?.nombre || 'Usuario') +
        '&background=8c52ff&color=fff'

    const closeMenu = () => setOpen(false)

    const NavButton = ({ to, children }) => (
        <Link
            to={to}
            onClick={closeMenu}
            className="px-3 py-2 rounded-full text-sm font-medium text-slate-200 hover:bg-slate-800 transition-colors block md:inline-block"
        >
            {children}
        </Link>
    )

    return (
        <>
            {/* NAVBAR */}
            <nav className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur border-b border-slate-800">
                <div className="container flex items-center justify-between h-16 md:h-20">

                    {/* Logo */}
                    <Link
                        to="/"
                        onClick={closeMenu}
                        className="flex items-center gap-2"
                    >
                        <div className="w-9 h-9 rounded-2xl bg-brand flex items-center justify-center font-black text-slate-950 shadow-lg">
                            FM
                        </div>
                        <span className="font-bold text-white text-base">FitMind</span>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-4">
                        {loading ? (
                            <span className="text-sm text-slate-400">Comprobando sesión…</span>
                        ) : !isLogged ? (
                            <>
                                <NavButton to="/login">Iniciar sesión</NavButton>
                                <Link
                                    to="/login?mode=registro"
                                    className="px-4 py-2 rounded-full bg-brand text-slate-950 font-semibold hover:bg-brand/90 transition-colors"
                                >
                                    Registrarse
                                </Link>
                            </>
                        ) : (
                            <>
                                {!esAdmin && <NavButton to="/control">Dashboard</NavButton>}
                                {esAdmin && <NavButton to="/admin">Admin</NavButton>}

                                <button
                                    type="button"
                                    onClick={() => {
                                        closeMenu()
                                        navigate('/perfil')
                                    }}
                                    className="flex items-center gap-3 px-3 py-2 rounded-full text-slate-200 hover:bg-slate-800"
                                >
                                    <img
                                        src={avatarSrc}
                                        alt="Avatar"
                                        className="h-8 w-8 rounded-full border border-slate-700 object-cover"
                                    />
                                    <span className="text-sm">
                                        Hola{perfil?.nombre ? `, ${perfil.nombre}` : ''}
                                        {perfil?.es_admin ? ' · Admin' : ''}
                                    </span>
                                </button>

                                <button
                                    onClick={async () => {
                                        await logout()
                                        navigate('/login', { replace: true })
                                    }}
                                    className="px-4 py-2 rounded-full bg-brand text-slate-950 font-semibold hover:bg-brand/90 transition-colors"
                                >
                                    Cerrar sesión
                                </button>
                            </>
                        )}
                    </div>

                    {/* Hamburguesa (Mobile) */}
                    <button
                        type="button"
                        className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg border border-slate-700 text-slate-200 hover:bg-slate-800"
                        onClick={() => setOpen((prev) => !prev)}
                    >
                        {open ? <FiX size={22} /> : <FiMenu size={22} />}
                    </button>
                </div>

                {/* Mobile menu */}
                {open && (
                    <div className="md:hidden border-t border-slate-800 bg-slate-950/95">
                        <div className="container py-4 flex flex-col gap-2">

                            {loading ? (
                                <span className="text-sm text-slate-400 text-center">
                                    Comprobando sesión…
                                </span>
                            ) : !isLogged ? (
                                <>
                                    <NavButton to="/login">Iniciar sesión</NavButton>

                                    <Link
                                        to="/login?mode=registro"
                                        onClick={closeMenu}
                                        className="px-4 py-2 rounded-full bg-brand text-slate-950 font-semibold text-center"
                                    >
                                        Registrarse
                                    </Link>
                                </>
                            ) : (
                                <>
                                    {!esAdmin && <NavButton to="/control">Dashboard</NavButton>}
                                    {esAdmin && <NavButton to="/admin">Admin</NavButton>}

                                    <button
                                        type="button"
                                        onClick={() => {
                                            closeMenu()
                                            navigate('/perfil')
                                        }}
                                        className="flex items-center gap-3 px-3 py-2 rounded-full text-slate-200 hover:bg-slate-800"
                                    >
                                        <img
                                            src={avatarSrc}
                                            alt="Avatar"
                                            className="h-10 w-10 rounded-full border border-slate-700 object-cover"
                                        />
                                        <span className="text-sm">
                                            Hola{perfil?.nombre ? `, ${perfil.nombre}` : ''}
                                            {perfil?.es_admin ? ' · Admin' : ''}
                                        </span>
                                    </button>

                                    <button
                                        onClick={async () => {
                                            closeMenu()
                                            await logout()
                                            navigate('/login', { replace: true })
                                        }}
                                        className="px-4 py-2 rounded-full bg-brand text-slate-950 font-semibold hover:bg-brand/90 transition-colors mt-1"
                                    >
                                        Cerrar sesión
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </nav>

            {/* CONTENIDO */}
            <main>{children}</main>

            {/* FOOTER */}
            <footer className="border-t border-slate-800">
                <div className="container py-8 text-center text-sm text-slate-400">
                    <p>© {new Date().getFullYear()} FitMind</p>
                    <nav className="mt-3 flex justify-center gap-6">
                        <Link className="hover:text-brand" to="/politica">
                            Privacidad
                        </Link>
                        <a className="hover:text-brand" href="mailto:hola@fitmind.es">
                            Contacto
                        </a>
                    </nav>
                </div>
            </footer>
        </>
    )
}
