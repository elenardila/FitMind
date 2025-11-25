// src/pages/Login.jsx
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import Modal from '../components/Modal'
import { FiAlertCircle, FiCheckCircle } from 'react-icons/fi'

export default function Login() {
    const { login, register, resendConfirmEmail, updatePerfil } = useAuth()

    const navigate = useNavigate()
    const location = useLocation()

    // 👇 leemos el modo inicial de la query ?mode=registro
    const searchParams = new URLSearchParams(location.search)
    const initialMode = searchParams.get('mode') === 'registro' ? 'registro' : 'login'

    const [modo, setModo] = useState(initialMode) // 'login' | 'registro'

    // Campos generales
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [password2, setPassword2] = useState('')
    const [aceptaTerminos, setAceptaTerminos] = useState(false)
    const [aceptaLegal, setAceptaLegal] = useState(false)

    // Campos de perfil (solo para registro)
    const [nombre, setNombre] = useState('')
    const [edad, setEdad] = useState('')
    const [sexo, setSexo] = useState('no_especificado')
    const [altura, setAltura] = useState('')
    const [peso, setPeso] = useState('')
    const [nivelActividad, setNivelActividad] = useState('medio')
    const [objetivo, setObjetivo] = useState('mantener')
    const [prefVegetariano, setPrefVegetariano] = useState(false)
    const [prefSinGluten, setPrefSinGluten] = useState(false)
    const [alergiasTxt, setAlergiasTxt] = useState('')

    const [modalResetOpen, setModalResetOpen] = useState(false)
    const [resetEmail, setResetEmail] = useState('')
    const [resetError, setResetError] = useState('') // error visible dentro del modal de reset

    // Estado UI
    const [error, setError] = useState('')
    const [ok, setOk] = useState('')
    const [loading, setLoading] = useState(false)
    const [modalVerificacionOpen, setModalVerificacionOpen] = useState(false)
    const [modalExisteOpen, setModalExisteOpen] = useState(false)

    // Para resaltar campos obligatorios tras intento de envío
    const [intentoEnvio, setIntentoEnvio] = useState(false)

    // Toast global
    const [toast, setToast] = useState({ type: null, message: '' }) // type: 'success' | 'error' | null

    const redirectTo = location.state?.from?.pathname || '/control'

    // 🔎 Validaciones de email y password
    const emailLimpio = email.trim()
    const emailSinEspacios = email === emailLimpio && !/\s/.test(email)
    const emailFormatoValido = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailLimpio)
    const emailValido = emailSinEspacios && emailFormatoValido
    const passValida = password.length >= 6 && !/\s/.test(password)
    const passCoincide = modo === 'login' ? true : password === password2

    // ✅ Campos obligatorios inválidos (para bordes en brand)
    const emailInvalido = intentoEnvio && !emailValido
    const passInvalida = intentoEnvio && !passValida
    const pass2Invalida = intentoEnvio && modo === 'registro' && (!password2 || !passCoincide)
    const terminosInvalidos = intentoEnvio && modo === 'registro' && !aceptaTerminos
    const legalInvalido = intentoEnvio && modo === 'registro' && !aceptaLegal

    // 👇 si estás en registro: contraseña ok + términos aceptados
    const puedeEnviar = useMemo(() => {
        if (loading) return false
        if (!emailValido) return false
        if (modo === 'login') return passValida
        // modo registro:
        return passValida && passCoincide && aceptaTerminos && aceptaLegal
    }, [loading, emailValido, passValida, passCoincide, aceptaTerminos, aceptaLegal, modo])

    // 👇 si cambia la URL (por ejemplo, entras desde /login?mode=registro) cambiamos el modo
    useEffect(() => {
        const params = new URLSearchParams(location.search)
        const modeParam = params.get('mode') === 'registro' ? 'registro' : 'login'
        setModo(modeParam)
    }, [location.search])

    // Limpiar errores/ok al cambiar cosas de formulario
    useEffect(() => {
        setError('')
        setOk('')
        setIntentoEnvio(false)
    }, [modo, email, password, password2, aceptaTerminos, aceptaLegal])

    // Autocierre del toast
    useEffect(() => {
        if (!toast.type) return
        const t = setTimeout(() => {
            setToast({ type: null, message: '' })
        }, 4000)
        return () => clearTimeout(t)
    }, [toast.type])

    // Helpers para mensajes + toast
    const showToast = (type, message) => {
        setToast({ type, message })
    }

    const pushError = (msg) => {
        setError(msg)
        if (msg) showToast('error', msg)
    }

    const pushOk = (msg) => {
        setOk(msg)
        if (msg) showToast('success', msg)
    }

    // 🌈 Clase común para inputs en modo claro/oscuro + borde dinámico
    const baseInputClasses =
        'w-full rounded-md bg-white dark:bg-white/10 text-slate-900 dark:text-white border'
    const defaultBorderClasses = 'border-slate-300 dark:border-white/20'
    const inputClass = (invalid = false) =>
        `${baseInputClasses} ${invalid ? 'border-brand' : defaultBorderClasses}`

    // 📩 Envío de formulario
    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setOk('')
        setIntentoEnvio(true)

        if (!puedeEnviar) {
            pushError('Revisa los campos obligatorios marcados con *.')
            return
        }

        setLoading(true)

        try {
            const correo = emailLimpio

            if (modo === 'login') {
                // ⬇️ Destino según admin o usuario normal
                const session = await login(correo, password)
                const userEmail = session?.user?.email || correo

                // 🔄 Aplicar perfilDraft si existe (nombre, edad, etc)
                try {
                    const draftStr = localStorage.getItem('perfilDraft')
                    if (draftStr) {
                        const draftPerfil = JSON.parse(draftStr)
                        await updatePerfil(draftPerfil)
                        localStorage.removeItem('perfilDraft')
                    }
                } catch (e) {
                    console.error('[Login] Error aplicando perfilDraft tras login:', e)
                    // no rompemos el login por esto
                }

                if (userEmail === 'admin@plexus.es') {
                    navigate('/admin', { replace: true })
                } else {
                    navigate(redirectTo, { replace: true })
                }

                setLoading(false)
                return
            }

            // ---- registro ----
            if (!aceptaTerminos) {
                pushError('Debes aceptar la Política de privacidad y de tratamiento de datos.')
                return
            }
            if (!aceptaLegal) {
                pushError('Debes aceptar los Términos y Condiciones de uso.')
                return
            }
            if (!passCoincide) {
                pushError('Las contraseñas no coinciden.')
                return
            }

            // 👉 register AHORA nunca deja sesión activa y lanza error claro si el usuario ya existe
            await register(correo, password)

            // guarda draft de perfil o actualiza si hay sesión
            const draftPerfil = {
                nombre: nombre || null,
                edad: edad ? Number(edad) : null,
                sexo: sexo || 'no_especificado',
                altura_cm: altura ? Number(altura) : null,
                peso_kg: peso ? Number(peso) : null,
                nivel_actividad: nivelActividad || 'medio',
                objetivo: objetivo || 'mantener',
                preferencias: { vegetariano: prefVegetariano, sin_gluten: prefSinGluten },
                alergias: alergiasTxt
                    ? alergiasTxt
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean)
                    : null,
            }

            const { data: sessionData } = await supabase.auth.getSession()
            const currentSession = sessionData?.session

            if (currentSession?.user?.id) {
                await updatePerfil(draftPerfil)
                pushOk('Cuenta creada y perfil inicial guardado.')
            } else {
                localStorage.setItem('perfilDraft', JSON.stringify(draftPerfil))
                pushOk('Cuenta creada. Revisa tu correo para confirmar tu cuenta.')
            }

            setModo('login')
            setPassword('')
            setPassword2('')
        } catch (err) {
            console.error('Auth error:', err)
            const msg = (err?.message || '').toLowerCase()
            const code = err?.code

            if (
                modo === 'login' &&
                (msg.includes('email not confirmed') ||
                    msg.includes('email_not_confirmed') ||
                    code === 'email_not_confirmed')
            ) {
                pushError(
                    'Tu correo no está verificado. Reenvía el email de verificación para poder acceder.'
                )
                setModalVerificacionOpen(true)
            } else if (
                modo === 'registro' &&
                (code === 'user_already_exists' ||
                    msg.includes('already registered') ||
                    msg.includes('already exists') ||
                    msg.includes('user_already_exists'))
            ) {
                // 💡 Correo ya registrado: mostramos modal específico
                setModalExisteOpen(true)
                setError('')
            } else if (
                modo === 'login' &&
                (msg.includes('invalid login credentials') || msg.includes('invalid'))
            ) {
                pushError('Credenciales inválidas. Revisa el correo y la contraseña.')
            } else {
                pushError(err?.message || 'Se ha producido un error. Inténtalo de nuevo.')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <section className="section">
            {/* Login estrecho / registro ancho */}
            <div className={`container ${modo === 'login' ? 'max-w-md' : 'max-w-4xl'}`}>
                <h1 className="section-title text-brand mb-2">
                    {modo === 'login' ? 'Acceder' : 'Crear cuenta'}
                </h1>
                <p className="text-sm text-text-muted dark:text-white/80 mb-6">
                    {modo === 'login'
                        ? 'Introduce tu correo y contraseña para entrar.'
                        : 'Regístrate con tus datos y una contraseña segura.'}
                </p>

                <form onSubmit={handleSubmit} className="card card-pad space-y-6">
                    {modo === 'login' ? (
                        // ============================
                        // 🔑 MODO LOGIN (una columna)
                        // ============================
                        <div className="space-y-4">
                            {/* 📧 Email */}
                            <div>
                                <label className="block text-sm mb-1">
                                    Correo electrónico <span className="text-brand">*</span>
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={inputClass(emailInvalido)}
                                    placeholder="tucorreo@ejemplo.com"
                                    required
                                />
                            </div>

                            {/* 🔒 Contraseña */}
                            <div>
                                <label className="block text-sm mb-1">
                                    Contraseña <span className="text-brand">*</span>
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={inputClass(passInvalida)}
                                    placeholder="Mínimo 6 caracteres"
                                    required
                                />
                            </div>

                            <div className="text-right text-sm">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setResetEmail(emailLimpio || '')
                                        setResetError('')
                                        setModalResetOpen(true)
                                    }}
                                    className="text-brand hover:underline"
                                >
                                    ¿Has olvidado tu contraseña?
                                </button>
                            </div>
                        </div>
                    ) : (
                        // ==============================
                        // 🧾 MODO REGISTRO (DOS COLUMNAS)
                        // ==============================
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* 🔹 Columna izquierda: acceso + legales */}
                            <div className="space-y-4">
                                {/* 📧 Email */}
                                <div>
                                    <label className="block text-sm mb-1">
                                        Correo electrónico <span className="text-brand">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className={inputClass(emailInvalido)}
                                        placeholder="tucorreo@ejemplo.com"
                                        required
                                    />
                                </div>

                                {/* 🔒 Contraseña */}
                                <div>
                                    <label className="block text-sm mb-1">
                                        Contraseña <span className="text-brand">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className={inputClass(passInvalida)}
                                        placeholder="Mínimo 6 caracteres"
                                        required
                                    />
                                </div>

                                {/* 🔁 Confirmar contraseña */}
                                <div>
                                    <label className="block text-sm mb-1">
                                        Repite la contraseña <span className="text-brand">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        value={password2}
                                        onChange={(e) => setPassword2(e.target.value)}
                                        className={inputClass(pass2Invalida)}
                                        placeholder="Repite tu contraseña"
                                        required
                                    />
                                </div>

                                {/* ✅ Términos / Legal */}
                                <div className="space-y-2 text-sm mt-2">
                                    <label className="flex items-start gap-3">
                                        <input
                                            type="checkbox"
                                            checked={aceptaTerminos}
                                            onChange={(e) => setAceptaTerminos(e.target.checked)}
                                            className={`mt-1 rounded border-slate-300 dark:border-white/20 ${
                                                terminosInvalidos ? 'ring-1 ring-brand border-brand' : ''
                                            }`}
                                        />
                                        <span>
                      <span className="text-brand">*</span>{' '}
                                            Acepto la{' '}
                                            <Link to="/politica" className="underline hover:text-brand">
                        Política de privacidad y tratamiento de datos
                      </Link>
                      .
                    </span>
                                    </label>

                                    <label className="flex items-start gap-3">
                                        <input
                                            type="checkbox"
                                            checked={aceptaLegal}
                                            onChange={(e) => setAceptaLegal(e.target.checked)}
                                            className={`mt-1 rounded border-slate-300 dark:border-white/20 ${
                                                legalInvalido ? 'ring-1 ring-brand border-brand' : ''
                                            }`}
                                        />
                                        <span>
                      <span className="text-brand">*</span>{' '}
                                            Acepto los{' '}
                                            <Link to="/politica" className="underline hover:text-brand">
                        Términos y Condiciones de uso
                      </Link>
                      .
                    </span>
                                    </label>
                                </div>
                            </div>

                            {/* 🔹 Columna derecha: datos de perfil */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm mb-1">Nombre</label>
                                    <input
                                        value={nombre}
                                        onChange={(e) => setNombre(e.target.value)}
                                        className={inputClass(false)}
                                    />
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="block text-sm mb-1">Edad</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={edad}
                                            onChange={(e) => setEdad(e.target.value)}
                                            className={inputClass(false)}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm mb-1">Sexo</label>
                                        <select
                                            value={sexo}
                                            onChange={(e) => setSexo(e.target.value)}
                                            className={inputClass(false)}
                                        >
                                            <option value="no_especificado">No especificado</option>
                                            <option value="mujer">Mujer</option>
                                            <option value="hombre">Hombre</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="block text-sm mb-1">Altura (cm)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={altura}
                                            onChange={(e) => setAltura(e.target.value)}
                                            className={inputClass(false)}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm mb-1">Peso (kg)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={peso}
                                            onChange={(e) => setPeso(e.target.value)}
                                            className={inputClass(false)}
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="block text-sm mb-1">Nivel de actividad</label>
                                        <select
                                            value={nivelActividad}
                                            onChange={(e) => setNivelActividad(e.target.value)}
                                            className={inputClass(false)}
                                        >
                                            <option value="sedentario">Sedentario</option>
                                            <option value="ligero">Ligero</option>
                                            <option value="medio">Medio</option>
                                            <option value="alto">Alto</option>
                                            <option value="atleta">Atleta</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm mb-1">Objetivo</label>
                                        <select
                                            value={objetivo}
                                            onChange={(e) => setObjetivo(e.target.value)}
                                            className={inputClass(false)}
                                        >
                                            <option value="perder">Perder peso</option>
                                            <option value="mantener">Mantener</option>
                                            <option value="ganar">Ganar masa</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm mb-1">Preferencias</label>
                                    <div className="flex flex-col gap-2 text-sm">
                                        <label className="inline-flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={prefVegetariano}
                                                onChange={(e) => setPrefVegetariano(e.target.checked)}
                                            />
                                            Vegetariano
                                        </label>
                                        <label className="inline-flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={prefSinGluten}
                                                onChange={(e) => setPrefSinGluten(e.target.checked)}
                                            />
                                            Sin gluten
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm mb-1">
                                        Alergias (separadas por comas)
                                    </label>
                                    <input
                                        value={alergiasTxt}
                                        onChange={(e) => setAlergiasTxt(e.target.value)}
                                        className={inputClass(false)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Botones (comunes a login y registro) */}
                    <button
                        type="submit"
                        disabled={!puedeEnviar}
                        className={`btn-primary w-full ${
                            !puedeEnviar ? 'opacity-60 cursor-not-allowed' : ''
                        }`}
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

            {/* TOAST global abajo centrado */}
            {toast.type && (
                <div className="fixed bottom-4 inset-x-0 flex justify-center z-[60] px-4">
                    <div
                        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm shadow-lg border ${
                            toast.type === 'success'
                                ? 'bg-emerald-900/90 border-emerald-500 text-emerald-50'
                                : 'bg-red-900/90 border-red-500 text-red-50'
                        }`}
                    >
                        {toast.type === 'success' ? (
                            <FiCheckCircle className="shrink-0" />
                        ) : (
                            <FiAlertCircle className="shrink-0" />
                        )}
                        <p>{toast.message}</p>
                    </div>
                </div>
            )}

            {/* MODAL: correo ya registrado */}
            <Modal
                open={modalExisteOpen}
                onClose={() => {
                    setModalExisteOpen(false)
                    setLoading(false)
                }}
                title="Este correo ya tiene una cuenta"
                actions={
                    <>
                        <button className="btn-ghost" onClick={() => setModalExisteOpen(false)}>
                            Cerrar
                        </button>
                        <button
                            className="btn-primary"
                            onClick={() => {
                                setModo('login')
                                setModalExisteOpen(false)
                            }}
                        >
                            Iniciar sesión
                        </button>
                    </>
                }
            >
                <p>
                    Parece que <strong>{emailLimpio}</strong> ya está registrado en FitMind. Si es tuyo,
                    entra con tu contraseña o usa la opción de recuperación.
                </p>
            </Modal>

            {/* MODAL: correo no verificado */}
            <Modal
                open={modalVerificacionOpen}
                onClose={() => {
                    setModalVerificacionOpen(false)
                    setLoading(false)
                }}
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
                                    await resendConfirmEmail(emailLimpio)
                                    setModalVerificacionOpen(false)
                                    pushOk(
                                        'Te hemos enviado un nuevo correo de verificación. Revisa tu bandeja.'
                                    )
                                } catch (e) {
                                    pushError(
                                        e?.message || 'No se pudo reenviar el correo. Inténtalo más tarde.'
                                    )
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

            {/* MODAL: recuperación de contraseña */}
            <Modal
                open={modalResetOpen}
                onClose={() => {
                    setModalResetOpen(false)
                    setResetEmail('')
                    setResetError('')
                }}
                title="Recuperar contraseña"
                actions={
                    <>
                        <button
                            className="btn-ghost"
                            onClick={() => {
                                setModalResetOpen(false)
                                setResetEmail('')
                                setResetError('')
                            }}
                        >
                            Cancelar
                        </button>
                        <button
                            className="btn-primary"
                            onClick={async () => {
                                setError('')
                                setOk('')
                                setResetError('')

                                try {
                                    const correo = resetEmail.trim()

                                    if (!correo) {
                                        const msg = 'Introduce un correo válido.'
                                        setResetError(msg)
                                        return
                                    }

                                    // 1️⃣ Comprobar si la cuenta está desactivada
                                    const { data: perfilRow, error: perfilError } = await supabase
                                        .from('perfiles')
                                        .select('activo')
                                        .eq('email', correo)
                                        .maybeSingle()

                                    if (perfilError && perfilError.code !== 'PGRST116') {
                                        console.error(
                                            '[Login] Error comprobando perfil en reset:',
                                            perfilError
                                        )
                                        const msg =
                                            'No se ha podido verificar el estado de tu cuenta.'
                                        setResetError(msg)
                                        pushError(msg)
                                        return
                                    }

                                    if (perfilRow && perfilRow.activo === false) {
                                        // Cuenta desactivada → NO permitimos resetear contraseña
                                        const msg =
                                            'Tu cuenta está desactivada. No es posible recuperar la contraseña con este correo.'
                                        setResetError(msg) // se ve dentro del modal
                                        return
                                    }

                                    // 2️⃣ Si no hay perfil o está activo → permitimos el reset
                                    await supabase.auth.resetPasswordForEmail(correo, {
                                        redirectTo: 'https://fitmind-six.vercel.app/nueva-clave',
                                    })

                                    pushOk('Hemos enviado un correo para restablecer tu contraseña.')
                                    setModalResetOpen(false)
                                    setResetEmail('')
                                    setResetError('')
                                } catch (err) {
                                    console.error('[Login] Error en reset password:', err)
                                    const msg =
                                        err?.message ||
                                        'No se pudo enviar el correo. Inténtalo más tarde.'
                                    setResetError(msg)
                                    pushError(msg)
                                }
                            }}
                        >
                            Enviar correo
                        </button>
                    </>
                }
            >
                <p className="text-sm mb-3">
                    Introduce tu correo electrónico y te enviaremos un enlace para restablecer tu
                    contraseña.
                </p>

                {resetError && (
                    <div className="mb-3 flex items-center gap-2 rounded-md border border-red-500 bg-red-900/70 text-red-50 px-3 py-2 text-xs">
                        <FiAlertCircle className="shrink-0" />
                        <span>{resetError}</span>
                    </div>
                )}

                <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className={inputClass(false)}
                    placeholder="tu@correo.com"
                />
            </Modal>
        </section>
    )
}
