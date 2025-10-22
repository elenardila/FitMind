import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [session, setSession] = useState(null)
    const [perfil, setPerfil] = useState(null)
    const [loading, setLoading] = useState(true)

    const cargarPerfil = useCallback(async (userId) => {
        if (!userId) return setPerfil(null)
        const { data, error } = await supabase
            .from('perfiles')
            .select('id, nombre, avatar_url, es_admin, suscrito, suscripcion_vence_en')
            .eq('id', userId)
            .single()
        if (!error) setPerfil(data)
    }, [])

    useEffect(() => {
        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            setSession(session)
            await cargarPerfil(session?.user?.id)
            setLoading(false)
        }
        init()

        const { data: sub } = supabase.auth.onAuthStateChange(async (_event, sess) => {
            setSession(sess)
            await cargarPerfil(sess?.user?.id)
        })
        return () => sub.subscription.unsubscribe()
    }, [cargarPerfil])

    const login = async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
    }

    const register = async (email, password) => {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
    }

    const logout = async () => {
        await supabase.auth.signOut()
        setPerfil(null)
    }

    // 🔔 Reenviar email de verificación
    const resendConfirmEmail = async (email) => {
        const { error } = await supabase.auth.resend({ type: 'signup', email })
        if (error) throw error
    }

    const value = { session, perfil, loading, login, register, logout, resendConfirmEmail }
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
