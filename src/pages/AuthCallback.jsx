// src/pages/AuthCallback.jsx
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function AuthCallback() {
    const navigate = useNavigate()

    useEffect(() => {
        const procesar = async () => {
            try {
                // Supabase ya ha procesado el token de la URL.
                // Por coherencia con tu flujo, cerramos sesión igualmente.
                await supabase.auth.signOut()
            } catch (e) {
                console.error('[AuthCallback] Error en signOut:', e)
            } finally {
                // En cualquier caso, mandamos al login.
                navigate('/login', { replace: true })
            }
        }

        procesar()
    }, [navigate])

    return (
        <section className="section">
            <div className="container max-w-md">
                <p className="text-sm text-text-muted dark:text-white/80">
                    Confirmando tu cuenta…
                </p>
            </div>
        </section>
    )
}
