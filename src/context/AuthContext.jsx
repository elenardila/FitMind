/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { generarRutinaGemini, generarDietaGemini } from '../lib/geminiClient'
import { guardarPlan } from '../lib/planesService'

const CAMPOS_ENTRENAMIENTO = [
    'sexo',
    'edad',
    'altura_cm',
    'peso_kg',
    'nivel_actividad',
    'objetivo',
    'preferencias',
    'alergias',
]

function hanCambiadoCamposClave(antes = {}, despues = {}) {
    return CAMPOS_ENTRENAMIENTO.some((campo) => {
        const vAntes = antes?.[campo]
        const vDespues = despues?.[campo]

        if (typeof vAntes === 'object' || typeof vDespues === 'object') {
            return JSON.stringify(vAntes || null) !== JSON.stringify(vDespues || null)
        }

        return vAntes !== vDespues
    })
}

async function actualizarRutinaPorCambioPerfil(perfilAntes, perfilDespues, userId) {
    if (!userId) return null
    const haCambiado = hanCambiadoCamposClave(perfilAntes || {}, perfilDespues || {})
    if (!haCambiado) return null

    console.log('[AuthContext] Campos clave cambiados. Regenerando RUTINA…')
    const nuevaRutina = await generarRutinaGemini(perfilDespues)
    const plan = await guardarPlan(userId, 'entrenamiento', nuevaRutina)
    console.log('[AuthContext] Rutina actualizada. Plan id:', plan?.id)
    return plan
}

async function actualizarDietaPorCambioPerfil(perfilAntes, perfilDespues, userId) {
    if (!userId) return null
    const haCambiado = hanCambiadoCamposClave(perfilAntes || {}, perfilDespues || {})
    if (!haCambiado) return null

    console.log('[AuthContext] Campos clave cambiados. Regenerando DIETA…')
    const nuevaDieta = await generarDietaGemini(perfilDespues)
    const plan = await guardarPlan(userId, 'dieta', nuevaDieta)
    console.log('[AuthContext] Dieta actualizada. Plan id:', plan?.id)
    return plan
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [session, setSession] = useState(null)
    const [perfil, setPerfil] = useState(null)
    const [loading, setLoading] = useState(true)

    // 🔹 Cargar perfil desde la tabla `perfiles`
    const cargarPerfil = useCallback(async (userId) => {
        if (!userId) {
            setPerfil(null)
            return
        }
        try {
            const { data, error } = await supabase
                .from('perfiles')
                .select(`
          id,
          email,
          nombre,
          avatar_url,
          es_admin,
          activo,
          edad,
          sexo,
          altura_cm,
          peso_kg,
          nivel_actividad,
          objetivo,
          preferencias,
          alergias
        `)
                .eq('id', userId)
                .single()

            if (error) {
                console.warn('[AuthContext] No se pudo cargar perfil:', error.message)
                setPerfil(null)
            } else {
                setPerfil(data)
            }
        } catch (e) {
            console.error('[AuthContext] Error cargarPerfil():', e)
            setPerfil(null)
        }
    }, [])

    // 🔹 Crear / actualizar perfil del usuario logueado
    const updatePerfil = async (partial) => {
        if (!session?.user?.id) throw new Error('No hay usuario')

        const perfilAntes = perfil ? { ...perfil } : {}

        const payload = {
            ...partial,
            email: session.user.email,
            actualizado_en: new Date().toISOString(),
        }

        const { data, error } = await supabase
            .from('perfiles')
            .upsert(
                { id: session.user.id, ...payload },
                { onConflict: 'id' }
            )
            .select()
            .single()

        if (error) throw error

        setPerfil(data)

        // 🔁 Regenerar planes en background (NO bloquea la UI)
        try {
            const userId = session.user.id
            await Promise.all([
                actualizarRutinaPorCambioPerfil(perfilAntes, data, userId),
                actualizarDietaPorCambioPerfil(perfilAntes, data, userId),
            ])
        } catch (e) {
            console.error('[AuthContext] Error regenerando planes:', e)
        }

        return data
    }

    // 🔹 Inicialización + suscripción a cambios de auth (ESTABLE)
    useEffect(() => {
        let isMounted = true

        const init = async () => {
            console.log('[AuthContext] init() -> comprobando sesión inicial')
            setLoading(true)
            try {
                const { data } = await supabase.auth.getSession()
                const sess = data?.session ?? null
                console.log('[AuthContext] Sesión inicial:', sess)
                if (!isMounted) return

                setSession(sess)

                if (sess?.user?.id) {
                    // no hacemos await para no bloquear loading
                    cargarPerfil(sess.user.id)
                } else {
                    setPerfil(null)
                }
            } catch (e) {
                console.error('[AuthContext] Error init():', e)
                if (!isMounted) return
                setSession(null)
                setPerfil(null)
            } finally {
                if (isMounted) {
                    console.log('[AuthContext] init() -> loading = false')
                    setLoading(false)
                }
            }
        }

        init()

        const { data: sub } = supabase.auth.onAuthStateChange((event, sess) => {
            console.log('[AuthContext] onAuthStateChange:', event, sess)
            if (!isMounted) return

            setSession(sess || null)

            if (sess?.user?.id) {
                cargarPerfil(sess.user.id)
            } else {
                setPerfil(null)
            }
            // 🔸 NO tocamos loading aquí
        })

        const subscription = sub?.subscription

        return () => {
            isMounted = false
            if (subscription?.unsubscribe) {
                subscription.unsubscribe()
            }
        }
    }, [cargarPerfil])

    // 🔹 LOGIN con bloqueo si el email NO está confirmado
    const login = async (email, password) => {
        console.log('[AuthContext] login ->', email)

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            console.error('[AuthContext] error en login:', error)
            throw error
        }

        const user = data?.user ?? data?.session?.user
        if (!user) {
            throw new Error('No se ha podido iniciar sesión. Inténtalo de nuevo.')
        }

        console.log('[AuthContext] user en login:', {
            email: user.email,
            email_confirmed_at: user.email_confirmed_at,
            confirmed_at: user.confirmed_at,
        })

        if (!user.email_confirmed_at && !user.confirmed_at) {
            console.warn('[AuthContext] Email NO confirmado, cerrando sesión inmediata')
            await supabase.auth.signOut()
            const err = new Error('email_not_confirmed')
            err.code = 'email_not_confirmed'
            throw err
        }

        if (data.session) {
            setSession(data.session)
        }

        return data.session
    }

    // 🔹 REGISTRO robusto
    const register = async (email, password) => {
        console.log('[AuthContext] register ->', email)

        // 1️⃣ Comprobación previa en perfiles
        try {
            const { data: existing } = await supabase
                .from('perfiles')
                .select('id')
                .eq('email', email)
                .single()

            if (existing) {
                const err = new Error('user_already_exists')
                err.code = 'user_already_exists'
                throw err
            }
        } catch (e) {
            const msg = `${e?.message || ''}`.toLowerCase()
            if (!msg.includes('row') && e.code === 'user_already_exists') {
                throw e
            }
        }

        // 2️⃣ Registro en Supabase Auth
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        })

        if (error) {
            console.error('[AuthContext] register error:', error)
            throw error
        }

        // 3️⃣ Seguridad: fuera cualquier sesión después del registro
        try {
            await supabase.auth.signOut()
        } catch (e) {
            console.warn('[AuthContext] signOut tras registro falló (no es crítico):', e)
        }

        return data
    }

    // 🔹 LOGOUT
    const logout = async () => {
        console.log('[AuthContext] logout llamado')
        setLoading(true)

        try {
            // 🔧 Limpieza inmediata del estado del contexto
            setSession(null)
            setPerfil(null)
            localStorage.removeItem('perfilDraft')

            // 🔧 Limpiar claves de Supabase en localStorage
            try {
                if (typeof window !== 'undefined') {
                    Object.keys(localStorage)
                        .filter((k) => k.startsWith('sb-'))
                        .forEach((k) => localStorage.removeItem(k))
                }
            } catch (e) {
                console.error('[AuthContext] Error limpiando localStorage:', e)
            }

            // 🔧 Cerrar sesión en Supabase (global por si acaso)
            const { error } = await supabase.auth.signOut({ scope: 'global' })
            if (error) {
                console.error('[AuthContext] Error en supabase.auth.signOut():', error)
            }
        } catch (e) {
            console.error('[AuthContext] Error inesperado en logout():', e)
        } finally {
            console.log('[AuthContext] logout -> loading = false')
            setLoading(false)
        }
    }

    const resendConfirmEmail = async (email) => {
        const { error } = await supabase.auth.resend({ type: 'signup', email })
        if (error) throw error
    }

    const uploadAvatar = async (file) => {
        if (!session?.user?.id) throw new Error('No hay usuario')
        const uid = session.user.id
        const ext = file.name.split('.').pop()
        const path = `${uid}/${Date.now()}.${ext}`

        const { error: upErr } = await supabase.storage.from('avatares').upload(path, file, {
            cacheControl: '3600',
            upsert: false,
        })
        if (upErr) throw upErr

        const { data } = supabase.storage.from('avatares').getPublicUrl(path) || {}
        const publicUrl = data?.publicUrl || null
        if (!publicUrl) throw new Error('No se pudo obtener URL pública')
        await updatePerfil({ avatar_url: publicUrl })
        return publicUrl
    }

    const esAdmin =
        !!session &&
        (
            session.user?.email === 'admin@plexus.es' ||
            perfil?.es_admin === true
        )

    useEffect(() => {
        if (!loading && perfil && perfil.activo === false) {
            console.warn('[AuthContext] Usuario bloqueado por admin. Cerrando sesión.')
            alert('Tu cuenta ha sido bloqueada por el administrador.')
            logout()
        }
    }, [perfil, loading]) // eslint-disable-line react-hooks/exhaustive-deps

    const value = {
        session,
        perfil,
        loading,
        login,
        register,
        logout,
        resendConfirmEmail,
        updatePerfil,
        uploadAvatar,
        esAdmin,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
