// src/pages/NuevaClave.jsx
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'

export default function NuevaClave() {
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [mensaje, setMensaje] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(true)
    const [puedeCambiar, setPuedeCambiar] = useState(false)

    const navigate = useNavigate()

    // 1️⃣ Comprobar que el enlace es válido y que Supabase ha creado una sesión temporal
    useEffect(() => {
        const checkUser = async () => {
            try {
                const { data, error } = await supabase.auth.getUser()
                console.log('[NuevaClave] getUser =>', data, error)

                if (error || !data?.user) {
                    setError(
                        'El enlace para restablecer la contraseña no es válido o ha caducado. ' +
                        'Vuelve a solicitar un correo desde la pantalla de acceso.'
                    )
                    setPuedeCambiar(false)
                } else {
                    setPuedeCambiar(true)
                }
            } catch (e) {
                console.error('[NuevaClave] Error en checkUser:', e)
                setError(
                    'No se ha podido verificar tu enlace. Vuelve a solicitar un correo desde la pantalla de acceso.'
                )
                setPuedeCambiar(false)
            } finally {
                setLoading(false)
            }
        }

        checkUser()
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setMensaje('')
        setError('')

        if (!password || !confirm) {
            setError('Debes introducir y repetir la nueva contraseña.')
            return
        }

        if (password.length < 6 || /\s/.test(password)) {
            setError('La contraseña debe tener al menos 6 caracteres y no contener espacios.')
            return
        }

        if (password !== confirm) {
            setError('Las contraseñas no coinciden.')
            return
        }

        try {
            setLoading(true)

            const { error } = await supabase.auth.updateUser({ password })
            console.log('[NuevaClave] updateUser =>', error)
            if (error) throw error

            setMensaje('Contraseña actualizada correctamente. Te redirigimos al inicio de sesión.')

            // 2️⃣ Cerrar sesión y mandar al login tras unos segundos
            setTimeout(async () => {
                try {
                    await supabase.auth.signOut()
                } catch {
                    // si falla el signOut, tampoco pasa nada
                }
                navigate('/login', { replace: true })
            }, 2000)
        } catch (err) {
            console.error('[NuevaClave] Error al actualizar contraseña:', err)
            setError(err.message || 'No se pudo actualizar la contraseña.')
        } finally {
            setLoading(false)
        }
    }

    if (loading && !mensaje && !error) {
        return (
            <section className="section">
                <div className="container max-w-md">
                    <div className="card card-pad text-sm text-text-muted dark:text-white/80">
                        Comprobando tu enlace…
                    </div>
                </div>
            </section>
        )
    }

    return (
        <section className="section">
            <div className="container max-w-md">
                <h1 className="section-title text-brand mb-2">Nueva contraseña</h1>
                <p className="text-sm text-text-muted dark:text-white/80 mb-6">
                    Introduce tu nueva contraseña. Después podrás iniciar sesión normalmente.
                </p>

                <form onSubmit={handleSubmit} className="card card-pad space-y-4">
                    {!puedeCambiar && (
                        <p className="text-sm text-red-600 dark:text-red-400">
                            {error ||
                                'No se ha podido validar el enlace para restablecer la contraseña. Vuelve a solicitar un correo.'}
                        </p>
                    )}

                    {puedeCambiar && (
                        <>
                            <div>
                                <label className="block text-sm mb-1">Nueva contraseña</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full rounded-md border-slate-300 dark:border-white/20 bg-white dark:bg-white/10 text-slate-900 dark:text-white"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm mb-1">Repite la contraseña</label>
                                <input
                                    type="password"
                                    value={confirm}
                                    onChange={(e) => setConfirm(e.target.value)}
                                    className="w-full rounded-md border-slate-300 dark:border-white/20 bg-white dark:bg-white/10 text-slate-900 dark:text-white"
                                    required
                                />
                            </div>
                            {error && (
                                <p className="text-sm text-red-600 dark:text-red-400">
                                    {error}
                                </p>
                            )}
                            {mensaje && (
                                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                                    {mensaje}
                                </p>
                            )}
                            <button
                                type="submit"
                                className={`btn-primary w-full ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                                disabled={loading || !puedeCambiar}
                            >
                                {loading ? 'Guardando…' : 'Guardar contraseña'}
                            </button>
                        </>
                    )}
                </form>
            </div>
        </section>
    )
}
