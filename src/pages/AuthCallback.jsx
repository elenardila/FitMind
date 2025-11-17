// src/pages/AuthCallback.jsx
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const comprobar = async () => {
      // Supabase ya habrá leído el token de la URL gracias a detectSessionInUrl: true
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        // ya estás logueada -> al panel
        navigate('/control', { replace: true })
      } else {
        // algo ha fallado -> al login
        navigate('/login', { replace: true })
      }
    }
    comprobar()
  }, [navigate])

  return (
    <section className="section">
      <div className="container">
        <p>Confirmando tu cuenta…</p>
      </div>
    </section>
  )
}
