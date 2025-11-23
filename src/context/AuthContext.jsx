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

    if (!Array.isArray(nuevaRutina) || nuevaRutina.length === 0) {
        console.warn('[AuthContext] generarRutinaGemini no devolvió una rutina válida')
        return null
    }

    // 👇 mismo formato que Entrenamiento.jsx
    const datosPlan = {
        nombre: 'Rutina autogenerada',
        dias: nuevaRutina,
    }

    const plan = await guardarPlan(userId, 'entrenamiento', datosPlan)
    console.log('[AuthContext] Rutina actualizada. Plan id:', plan?.id)
    return plan
}

async function actualizarDietaPorCambioPerfil(perfilAntes, perfilDespues, userId) {
    if (!userId) return null
    const haCambiado = hanCambiadoCamposClave(perfilAntes || {}, perfilDespues || {})
    if (!haCambiado) return null

    console.log('[AuthContext] Campos clave cambiados. Regenerando DIETA…')
    const nuevaDieta = await generarDietaGemini(perfilDespues)

    if (!Array.isArray(nuevaDieta) || nuevaDieta.length === 0) {
        console.warn('[AuthContext] generarDietaGemini no devolvió una dieta válida')
        return null
    }

    const datosPlan = {
        nombre: 'Dieta autogenerada',
        dias: nuevaDieta,
    }

    const plan = await guardarPlan(userId, 'dieta', datosPlan)
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
        // 1️⃣ Intentar usar el usuario del estado
        let user = session?.user

        // 2️⃣ Si todavía no está en el estado (por ejemplo, justo después de login),
        //    lo pedimos directamente a Supabase
        if (!user) {
            try {
                const { data, error } = await supabase.auth.getSession()

                if (error) {
                    console.error('[AuthContext] Error obteniendo sesión en updatePerfil:', error)
                }

                user = data?.session?.user || null
            } catch (e) {
                console.error(
                    '[AuthContext] Error inesperado en getSession() dentro de updatePerfil:',
                    e
                )
            }
        }

        // 3️⃣ Si AÚN así no hay usuario, entonces sí es un error real
        if (!user?.id) {
            throw new Error('No hay usuario')
        }

        const userId = user.id
        const perfilAntes = perfil ? { ...perfil } : {}

        const payload = {
            ...partial,
            email: user.email,
            actualizado_en: new Date().toISOString(),
        }

        const { data, error } = await supabase
            .from('perfiles')
            .upsert(
                { id: userId, ...payload }, // 👈 en tu tabla usas `id` = uuid del user
                { onConflict: 'id' }
            )
            .select()
            .single()

        if (error) {
            console.error('[AuthContext] Error actualizando perfil:', error)
            throw error
        }

        setPerfil(data)

        // 4️⃣ Regenerar planes si han cambiado campos clave
        try {
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
            try {
                const { data } = await supabase.auth.getSession()
                const sess = data?.session ?? null
                console.log('[AuthContext] Sesión inicial:', sess)
                if (!isMounted) return

                setSession(sess)

                if (sess?.user?.id) {
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
            // loading solo se controla en init()
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
    //     y bloqueo si la cuenta está desactivada (activo = false)
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

        // 1️⃣ Email sin confirmar → bloqueamos
        if (!user.email_confirmed_at && !user.confirmed_at) {
            console.warn('[AuthContext] Email NO confirmado, cerrando sesión inmediata')
            await supabase.auth.signOut()
            const err = new Error('email_not_confirmed')
            err.code = 'email_not_confirmed'
            throw err
        }

        // 2️⃣ Comprobamos si la cuenta está desactivada en `perfiles`
        try {
            const { data: perfilRow, error: perfilError } = await supabase
                .from('perfiles')
                .select('activo')
                .eq('id', user.id)
                .maybeSingle()

            if (perfilError && perfilError.code !== 'PGRST116') {
                console.error('[AuthContext] Error leyendo perfil en login:', perfilError)
                throw perfilError
            }

            if (perfilRow && perfilRow.activo === false) {
                console.warn(
                    '[AuthContext] Cuenta desactivada. Cerrando sesión y bloqueando login.'
                )
                await supabase.auth.signOut()
                const err = new Error('Esta cuenta ha sido desactivada.')
                err.code = 'account_inactive'
                throw err
            }
        } catch (e) {
            // Si es nuestro error de cuenta inactiva o algo serio, lo re-lanzamos
            if (e.code === 'account_inactive') {
                throw e
            }
            console.error('[AuthContext] Error comprobando activo en login:', e)
            // si hay un problema raro en la consulta, mejor no dejar entrar
            throw new Error('No se ha podido verificar el estado de tu cuenta.')
        }

        // 3️⃣ Todo OK → guardamos sesión
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

        try {
            const { error } = await supabase.auth.signOut()
            if (error) {
                console.error('[AuthContext] Error en supabase.auth.signOut():', error)
            }
        } catch (e) {
            console.error('[AuthContext] Error inesperado en signOut():', e)
        }

        try {
            if (typeof window !== 'undefined') {
                Object.keys(localStorage)
                    .filter((k) => k.startsWith('sb-'))
                    .forEach((k) => localStorage.removeItem(k))
            }
        } catch (e) {
            console.error('[AuthContext] Error limpiando localStorage:', e)
        }

        setPerfil(null)
        setSession(null)
        localStorage.removeItem('perfilDraft')
    }

    // 🔹 Desactivar cuenta (activo = false)
    const desactivarCuenta = async () => {
        if (!session?.user?.id) throw new Error('No hay usuario')
        const userId = session.user.id

        console.log('[AuthContext] desactivarCuenta ->', userId)

        const { error } = await supabase
            .from('perfiles')
            .update({
                activo: false,
                actualizado_en: new Date().toISOString(),
            })
            .eq('id', userId)

        if (error) {
            console.error('[AuthContext] Error desactivando cuenta:', error)
            throw error
        }

        // Forzamos en el estado local para que salte el useEffect de cuenta inactiva
        setPerfil((prev) => (prev ? { ...prev, activo: false } : prev))
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
        (session.user?.email === 'admin@plexus.es' || perfil?.es_admin === true)

    //  Cuenta no activa (bloqueada por admin o auto-eliminada)
    useEffect(() => {
        if (!loading && perfil && perfil.activo === false) {
            console.warn('[AuthContext] Cuenta desactivada. Cerrando sesión.')
            logout()
        }
    }, [perfil, loading]) // logout se captura del cierre

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
        desactivarCuenta,
        esAdmin,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
