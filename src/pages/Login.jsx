import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'

export default function Login() {
    const { login, register, resendConfirmEmail } = useAuth()
    const [modo, setModo] = useState('login') // 'login' | 'registro'

    // Campos
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [password2, setPassword2] = useState('')
    const [aceptaTerminos, setAceptaTerminos] = useState(false)

    // UI
    const [error, setError] = useState('')
    const [ok, setOk] = useState('')
    const [loading, setLoading] = useState(false)
    const [modalVerificacionOpen, setModalVerificacionOpen] = useState(false)

    // Modal “usuario ya registrado”
    const [modalExisteOpen, setModalExisteOpen] = useState(false)

    const navigate = useNavigate()
    const location = useLocation()
    const redirectTo = location.state?.from?.pathname || '/control'

    // Validaciones
    const emailLimpio = email.trim()
    const emailSinEspacios = email === emailLimpio && !/\s/.test(email)
    const emailFormatoValido = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailLimpio)
    const emailValido = emailSinEspacios && emailFormatoValido

    const passValida = password.length >= 6 && !/\s/.test(password)
    const passCoincide = modo === 'login' ? true : password === password2

    const puedeEnviar = useMemo(() => {
        if (loading) return false
        if (!emailValido) return false
        if (modo === 'login') {
            return passValida
        } else {
            return passValida && passCoincide && aceptaTerminos
        }
    }, [loading, emailValido, passValida, passCoincide, aceptaTerminos, modo])

    useEffect(() => { setError(''); setOk('') }, [modo, email, password, password2, aceptaTerminos])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setOk('')
        if (!puedeEnviar) return
        setLoading(true)
        try {
            const correo = emailLimpio
            if (modo === 'login') {
                await login(correo, password)
                navigate(redirectTo, { replace: true })
            } else {
                if (!aceptaTerminos) { setError('Debes aceptar los Términos y Condiciones.'); return }
                if (!passCoincide) { setError('Las contraseñas no coinciden.'); return }
                await register(correo, password)
                setOk('Cuenta creada. Ya puedes acceder con tu correo y contraseña.')
                setModo('login')
                setPassword(''); setPassword2('')
            }
        } catch (err) {
            const msg = (err?.message || '').toLowerCase()

            if (modo === 'login' && (msg.includes('email not confirmed') || msg.includes('email_not_confirmed'))) {
                setError('Tu correo no está verificado. Reenvía el email de verificación para poder acceder.')
                setModalVerificacionOpen(true)
            } else if (modo === 'registro' && (msg.includes('already registered') || msg.includes('exists'))) {
                setModalExisteOpen(true)
                setError('')
            } else if (modo === 'login' && (msg.includes('invalid login credentials') || msg.includes('invalid'))) {
                setError('Credenciales inválidas. Revisa el correo y la contraseña.')
            } else {
                setError(err?.message || 'Se ha producido un error. Inténtalo de nuevo.')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <section className="section">
            <div className="container max-w-md">
                <h1 className="section-title text-brand mb-2">
                    {modo === 'login' ? 'Acceder' : 'Crear cuenta'}
                </h1>
                <p className="text-sm text-text-muted dark:text-white/80 mb-6">
                    {modo === 'login'
                        ? 'Introduce tu correo y contraseña para entrar.'
                        : 'Regístrate con tu correo y una contraseña segura.'}
                </p>

                <form onSubmit={handleSubmit} className="card card-pad space-y-4">
                    {/* Email */}
                    <div>
                        <label className="block text-sm mb-1">Correo electrónico</label>
                        <input
                            type="email"
                            inputMode="email"
                            autoComplete="email"
                            placeholder="tucorreo@ejemplo.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-md border-slate-300 dark:border-white/20 bg-white/90 dark:bg-white/10"
                            required
                        />
                        {!emailValido && email.length > 0 && (
                            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                                Introduce un correo válido sin espacios.
                            </p>
                        )}
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm mb-1">Contraseña</label>
                        <input
                            type="password"
                            autoComplete={modo === 'login' ? 'current-password' : 'new-password'}
                            placeholder={modo === 'login' ? 'Tu contraseña' : 'Mínimo 6 caracteres, sin espacios'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-md border-slate-300 dark:border-white/20 bg-white/90 dark:bg-white/10"
                            required
                        />
                        {!passValida && password.length > 0 && (
                            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                                La contraseña debe tener al menos 6 caracteres y no contener espacios.
                            </p>
                        )}
                    </div>

                    {/* Repetir contraseña (solo registro) */}
                    {modo === 'registro' && (
                        <div>
                            <label className="block text-sm mb-1">Repite la contraseña</label>
                            <input
                                type="password"
                                autoComplete="new-password"
                                placeholder="Repite tu contraseña"
                                value={password2}
                                onChange={(e) => setPassword2(e.target.value)}
                                className="w-full rounded-md border-slate-300 dark:border-white/20 bg-white/90 dark:bg-white/10"
                                required
                            />
                            {password2.length > 0 && password !== password2 && (
                                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                                    Las contraseñas no coinciden.
                                </p>
                            )}
                        </div>
                    )}

                    {/* Términos (solo registro) */}
                    {modo === 'registro' && (
                        <label className="flex items-start gap-3 text-sm">
                            <input
                                type="checkbox"
                                checked={aceptaTerminos}
                                onChange={(e) => setAceptaTerminos(e.target.checked)}
                                className="mt-1 rounded border-slate-300 dark:border-white/20"
                            />
                            <span>
                Acepto los{' '}
                                <Link to="/politica" className="underline hover:text-brand">
                  Términos y Condiciones / Política de privacidad
                </Link>
                .
              </span>
                        </label>
                    )}

                    {/* Mensajes inline */}
                    {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
                    {ok && <p className="text-sm text-emerald-600 dark:text-emerald-400">{ok}</p>}

                    {/* Botones */}
                    <button
                        type="submit"
                        disabled={!puedeEnviar}
                        className={`btn-primary w-full ${!puedeEnviar ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Cargando…' : modo === 'login' ? 'Entrar' : 'Registrarme'}
                    </button>

                    <button
                        type="button"
                        className="btn-ghost w-full"
                        onClick={() => setModo(modo === 'login' ? 'registro' : 'login')}
                    >
                        {modo === 'login' ? 'Crear cuenta nueva' : 'Ya tengo cuenta'}
                    </button>
                </form>
            </div>

            {/* MODAL: Correo ya registrado */}
            <Modal
                open={modalExisteOpen}
                onClose={() => setModalExisteOpen(false)}
                title="Este correo ya tiene una cuenta"
                actions={
                    <>
                        <button
                            className="btn-ghost"
                            onClick={() => setModalExisteOpen(false)}
                        >
                            Cerrar
                        </button>
                        <button
                            className="btn-primary"
                            onClick={() => { setModo('login'); setModalExisteOpen(false) }}
                        >
                            Iniciar sesión
                        </button>
                    </>
                }
            >
                <p>
                    Parece que <strong>{emailLimpio}</strong> ya está registrado en FitMind.
                    Si es tuyo, entra con tu contraseña. Si no recuerdas tu clave, usa la opción de
                    recuperación de contraseña desde el formulario de inicio de sesión.
                </p>
            </Modal>
            <Modal
                open={modalVerificacionOpen}
                onClose={() => setModalVerificacionOpen(false)}
                title="Confirma tu correo para continuar"
                actions={
                    <>
                        <button className="btn-ghost" onClick={() => setModalVerificacionOpen(false)}>
                            Cerrar
                        </button>
                        <button
                            className="btn-primary"
                            onClick={async () => {
                                try {
                                    await resendConfirmEmail(emailLimpio) // <- usa el helper del contexto
                                    setModalVerificacionOpen(false)
                                    setOk('Te hemos enviado un nuevo correo de verificación. Revisa tu bandeja.')
                                } catch (e) {
                                    setError(e?.message || 'No se pudo reenviar el correo. Inténtalo más tarde.')
                                }
                            }}
                        >
                            Reenviar verificación
                        </button>
                    </>
                }
            >
                <p>
                    Tu cuenta existe pero <strong>{emailLimpio}</strong> aún no ha sido verificada.
                    Abre el correo de confirmación o reenvíalo ahora.
                </p>
            </Modal>
        </section>
    )
}
