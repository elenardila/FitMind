import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import Modal from '../components/Modal'

export default function Login() {
  const { login, register, resendConfirmEmail, updatePerfil } = useAuth()

  const navigate = useNavigate()
  const location = useLocation()

  // 👇 leemos el modo inicial de la query ?mode=registro
  const searchParams = new URLSearchParams(location.search)
  const initialMode =
    searchParams.get('mode') === 'registro'
      ? 'registro'
      : 'login'

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

  // Estado UI
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [loading, setLoading] = useState(false)
  const [modalVerificacionOpen, setModalVerificacionOpen] = useState(false)
  const [modalExisteOpen, setModalExisteOpen] = useState(false)

  const redirectTo = location.state?.from?.pathname || '/control'

  // 🔎 Validaciones de email y password
  const emailLimpio = email.trim()
  const emailSinEspacios = email === emailLimpio && !/\s/.test(email)
  const emailFormatoValido = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailLimpio)
  const emailValido = emailSinEspacios && emailFormatoValido
  const passValida = password.length >= 6 && !/\s/.test(password)
  const passCoincide = modo === 'login' ? true : password === password2

  // 👇 si estás en registro: contraseña ok + términos aceptados
  const puedeEnviar = useMemo(() => {
    if (loading) return false
    if (!emailValido) return false
    if (modo === 'login') return passValida
    // modo registro:
    return (
      passValida &&
      passCoincide &&
      aceptaTerminos &&
      aceptaLegal
    )
  }, [loading, emailValido, passValida, passCoincide, aceptaTerminos, aceptaLegal, modo])

  // 👇 si cambia la URL (por ejemplo, entras desde /login?mode=registro) cambiamos el modo
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const modeParam = params.get('mode') === 'registro' ? 'registro' : 'login'
    setModo(modeParam)
  }, [location.search])

  useEffect(() => {
    setError('')
    setOk('')
  }, [modo, email, password, password2, aceptaTerminos, aceptaLegal])

  // 📩 Envío de formulario
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setOk('')
    if (!puedeEnviar) return
    setLoading(true)

    try {
      const correo = emailLimpio

      if (modo === 'login') {
        // ⬇️ ÚNICO CAMBIO IMPORTANTE: decidir destino según admin o no
        const session = await login(correo, password)
        const userEmail = session?.user?.email || correo

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
        setError('Debes aceptar la Política de privacidad y de tratamiento de datos.')
        return
      }
      if (!aceptaLegal) {
        setError('Debes aceptar los Términos y Condiciones de uso.')
        return
      }
      if (!passCoincide) {
        setError('Las contraseñas no coinciden.')
        return
      }

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
          ? alergiasTxt.split(',').map((s) => s.trim()).filter(Boolean)
          : null,
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.id) {
        await updatePerfil(draftPerfil)
        setOk('Cuenta creada y perfil inicial guardado.')
      } else {
        localStorage.setItem('perfilDraft', JSON.stringify(draftPerfil))
        setOk('Cuenta creada. Revisa tu correo para confirmar tu cuenta.')
      }

      setModo('login')
      setPassword('')
      setPassword2('')
    } catch (err) {
      console.error('Auth error:', err)
      const msg = (err?.message || '').toLowerCase()

      if (
        modo === 'login' &&
        (msg.includes('email not confirmed') || msg.includes('email_not_confirmed'))
      ) {
        setError('Tu correo no está verificado. Reenvía el email de verificación para poder acceder.')
        setModalVerificacionOpen(true)
      } else if (
        modo === 'registro' &&
        (msg.includes('already registered') || msg.includes('exists'))
      ) {
        setModalExisteOpen(true)
        setError('')
      } else if (
        modo === 'login' &&
        (msg.includes('invalid login credentials') || msg.includes('invalid'))
      ) {
        setError('Credenciales inválidas. Revisa el correo y la contraseña.')
      } else {
        setError(err?.message || 'Se ha producido un error. Inténtalo de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  // 🌈 Clase común para inputs en modo claro/oscuro (TU ORIGINAL)
  const inputClass =
    'w-full rounded-md border-slate-300 dark:border-white/20 bg-white dark:bg-white/10 text-slate-900 dark:text-white'

  return (
    <section className="section">
      <div className="container max-w-md">
        <h1 className="section-title text-brand mb-2">
          {modo === 'login' ? 'Acceder' : 'Crear cuenta'}
        </h1>
        <p className="text-sm text-text-muted dark:text-white/80 mb-6">
          {modo === 'login'
            ? 'Introduce tu correo y contraseña para entrar.'
            : 'Regístrate con tus datos y una contraseña segura.'}
        </p>

        <form onSubmit={handleSubmit} className="card card-pad space-y-4">
          {/* 📧 Email */}
          <div>
            <label className="block text-sm mb-1">Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder="tucorreo@ejemplo.com"
              required
            />
          </div>

          {/* 🔒 Contraseña */}
          <div>
            <label className="block text-sm mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              placeholder="Mínimo 6 caracteres"
              required
            />
          </div>

          {modo === 'login' && (
            <div className="text-right text-sm">
              <button
                type="button"
                onClick={() => setModalResetOpen(true)}
                className="text-brand hover:underline"
              >
                ¿Has olvidado tu contraseña?
              </button>
            </div>
          )}

          {/* 🔁 Confirmar contraseña (solo registro) */}
          {modo === 'registro' && (
            <div>
              <label className="block text-sm mb-1">Repite la contraseña</label>
              <input
                type="password"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                className={inputClass}
                placeholder="Repite tu contraseña"
                required
              />
            </div>
          )}

          {/* 🧍 Campos extra de perfil (solo registro) */}
          {modo === 'registro' && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block text-sm mb-1">Nombre</label>
                <input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Edad</label>
                <input
                  type="number"
                  min="0"
                  value={edad}
                  onChange={(e) => setEdad(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Sexo</label>
                <select
                  value={sexo}
                  onChange={(e) => setSexo(e.target.value)}
                  className={inputClass}
                >
                  <option value="no_especificado">No especificado</option>
                  <option value="mujer">Mujer</option>
                  <option value="hombre">Hombre</option>
                </select>
              </div>

              <div>
                <label className="block text-sm mb-1">Altura (cm)</label>
                <input
                  type="number"
                  step="0.01"
                  value={altura}
                  onChange={(e) => setAltura(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Peso (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  value={peso}
                  onChange={(e) => setPeso(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Nivel de actividad</label>
                <select
                  value={nivelActividad}
                  onChange={(e) => setNivelActividad(e.target.value)}
                  className={inputClass}
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
                  className={inputClass}
                >
                  <option value="perder">Perder peso</option>
                  <option value="mantener">Mantener</option>
                  <option value="ganar">Ganar masa</option>
                </select>
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

              <div className="md:col-span-2">
                <label className="block text-sm mb-1">
                  Alergias (separadas por comas)
                </label>
                <input
                  value={alergiasTxt}
                  onChange={(e) => setAlergiasTxt(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {/* ✅ Términos / Legal (solo registro) */}
          {modo === 'registro' && (
            <div className="space-y-2 text-sm">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={aceptaTerminos}
                  onChange={(e) => setAceptaTerminos(e.target.checked)}
                  className="mt-1 rounded border-slate-300 dark:border-white/20"
                />
                <span>
                  Acepto la{' '}
                  <Link to="/politica" className="underline hover:text-brand">
                    Política de privacidad y tratamiento de datos
                  </Link>.
                </span>
              </label>

              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={aceptaLegal}
                  onChange={(e) => setAceptaLegal(e.target.checked)}
                  className="mt-1 rounded border-slate-300 dark:border-white/20"
                />
                <span>
                  Acepto los{' '}
                  <Link to="/politica" className="underline hover:text-brand">
                    Términos y Condiciones de uso
                  </Link>.
                </span>
              </label>
            </div>
          )}

          {/* Mensajes */}
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          {ok && (
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              {ok}
            </p>
          )}

          {/* Botones */}
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
            <button
              className="btn-ghost"
              onClick={() => setModalExisteOpen(false)}
            >
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
          Parece que <strong>{emailLimpio}</strong> ya está registrado en FitMind.
          Si es tuyo, entra con tu contraseña o usa la opción de recuperación.
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
            <button
              className="btn-ghost"
              onClick={() => setModalVerificacionOpen(false)}
            >
              Cerrar
            </button>
            <button
              className="btn-primary"
              onClick={async () => {
                try {
                  await resendConfirmEmail(emailLimpio)
                  setModalVerificacionOpen(false)
                  setOk(
                    'Te hemos enviado un nuevo correo de verificación. Revisa tu bandeja.'
                  )
                } catch (e) {
                  setError(
                    e?.message ||
                      'No se pudo reenviar el correo. Inténtalo más tarde.'
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
          Tu cuenta existe pero <strong>{emailLimpio}</strong> aún no ha sido
          verificada. Abre el correo de confirmación o reenvíalo ahora.
        </p>
      </Modal>

      {/* MODAL: recuperación de contraseña */}
      <Modal
        open={modalResetOpen}
        onClose={() => setModalResetOpen(false)}
        title="Recuperar contraseña"
        actions={
          <>
            <button
              className="btn-ghost"
              onClick={() => setModalResetOpen(false)}
            >
              Cancelar
            </button>
            <button
              className="btn-primary"
              onClick={async () => {
                setError('')
                setOk('')
                try {
                  if (!resetEmail) {
                    setError('Introduce un correo válido.')
                    return
                  }
                  await supabase.auth.resetPasswordForEmail(resetEmail, {
                    redirectTo: 'http://localhost:5173/nueva-clave',
                  })
                  setOk(
                    'Hemos enviado un correo para restablecer tu contraseña.'
                  )
                  setModalResetOpen(false)
                } catch (err) {
                  setError(
                    err.message ||
                      'No se pudo enviar el correo. Inténtalo más tarde.'
                  )
                }
              }}
            >
              Enviar correo
            </button>
          </>
        }
      >
        <p className="text-sm mb-3">
          Introduce tu correo electrónico y te enviaremos un enlace para
          restablecer tu contraseña.
        </p>
        <input
          type="email"
          value={resetEmail}
          onChange={(e) => setResetEmail(e.target.value)}
          className={inputClass}
          placeholder="tu@correo.com"
        />
      </Modal>
    </section>
  )
}
