import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'

export default function NuevaClave() {
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [mensaje, setMensaje] = useState('')
    const [error, setError] = useState('')
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setMensaje('')
        setError('')

        if (password !== confirm) {
            setError('Las contraseñas no coinciden.')
            return
        }

        try {
            const { error } = await supabase.auth.updateUser({ password })
            if (error) throw error
            setMensaje('Contraseña actualizada correctamente. Ya puedes iniciar sesión.')
            setTimeout(() => navigate('/login'), 2000)
        } catch (err) {
            setError(err.message || 'No se pudo actualizar la contraseña.')
        }
    }

    return (
        <section className="section">
            <div className="container max-w-md">
                <h1 className="section-title">Nueva contraseña</h1>
                <form onSubmit={handleSubmit} className="card card-pad space-y-4">
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
                    {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
                    {mensaje && <p className="text-sm text-emerald-600 dark:text-emerald-400">{mensaje}</p>}
                    <button type="submit" className="btn-primary w-full">Guardar contraseña</button>
                </form>
            </div>
        </section>
    )
}
