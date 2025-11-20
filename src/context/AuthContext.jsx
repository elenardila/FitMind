/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { generarRutinaGemini, generarDietaGemini } from '../lib/geminiClient'
import {
  guardarPlan,
  obtenerUltimoPlan,
  actualizarPlan,
} from '../lib/planesService'

// 🔍 Campos del perfil que afectan directamente a los planes (entreno + dieta)
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

    // Para objetos/arrays (preferencias, alergias) comparamos serializado
    if (typeof vAntes === 'object' || typeof vDespues === 'object') {
      return JSON.stringify(vAntes || null) !== JSON.stringify(vDespues || null)
    }

    return vAntes !== vDespues
  })
}

// 🔁 Regenerar rutina de entrenamiento si el perfil ha cambiado en campos relevantes
async function actualizarRutinaPorCambioPerfil(perfilAntes, perfilDespues, userId) {
  if (!userId) return null

  const haCambiado = hanCambiadoCamposClave(perfilAntes || {}, perfilDespues || {})
  if (!haCambiado) {
    console.log('[AuthContext] Perfil cambiado, pero sin campos clave de entrenamiento.')
    return null
  }

  console.log(
    '[AuthContext] Campos clave de perfil cambiados. Regenerando rutina de entrenamiento...'
  )

  const nuevaRutina = await generarRutinaGemini(perfilDespues)

  // 👉 guardarPlan es un upsert (usuario_id + tipo + semana_inicio)
  const plan = await guardarPlan(userId, 'entrenamiento', nuevaRutina)

  console.log(
    '[AuthContext] Rutina generada/actualizada automáticamente. Plan id:',
    plan?.id
  )

  return plan
}

// 🔁 Regenerar plan de dieta si el perfil ha cambiado en campos relevantes
async function actualizarDietaPorCambioPerfil(perfilAntes, perfilDespues, userId) {
  if (!userId) return null

  const haCambiado = hanCambiadoCamposClave(perfilAntes || {}, perfilDespues || {})
  if (!haCambiado) {
    console.log('[AuthContext] Perfil cambiado, pero sin campos clave de dieta.')
    return null
  }

  console.log(
    '[AuthContext] Campos clave de perfil cambiados. Regenerando plan de dieta...'
  )

  const nuevaDieta = await generarDietaGemini(perfilDespues)

  const plan = await guardarPlan(userId, 'dieta', nuevaDieta)

  console.log(
    '[AuthContext] Plan de dieta generado/actualizado automáticamente. Plan id:',
    plan?.id
  )

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
  // Además, si cambian campos clave, regeneramos automáticamente la rutina y la dieta
  const updatePerfil = async (partial) => {
    if (!session?.user?.id) throw new Error('No hay usuario')

    // Guardamos el perfil anterior para poder comparar
    const perfilAntes = perfil ? { ...perfil } : {}

    const payload = {
      ...partial,
      email: session.user.email, // sincronizado con auth.users
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

    // 🔁 Intentar regenerar automáticamente rutina y dieta si el perfil ha cambiado
    try {
      await Promise.all([
        actualizarRutinaPorCambioPerfil(perfilAntes, data, session.user.id),
        actualizarDietaPorCambioPerfil(perfilAntes, data, session.user.id),
      ])
    } catch (e) {
      console.error(
        '[AuthContext] Error regenerando planes automáticos tras cambio de perfil:',
        e
      )
      // No re-lanzamos el error para no romper la UX al guardar el perfil
    }

    return data
  }

  // 🔹 Inicialización + suscripción a cambios de auth
  useEffect(() => {
    let subscription

    const init = async () => {
      setLoading(true)
      try {
        const { data } = await supabase.auth.getSession()
        const sess = data?.session ?? null
        console.log('[AuthContext] Sesión inicial:', sess)
        setSession(sess)
        if (sess?.user?.id) {
          await cargarPerfil(sess.user.id)
        } else {
          setPerfil(null)
        }
      } catch (e) {
        console.error('[AuthContext] Error init():', e)
        setSession(null)
        setPerfil(null)
      } finally {
        setLoading(false)
      }
    }

    init()

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, sess) => {
      console.log('[AuthContext] onAuthStateChange:', event, sess)
      setSession(sess || null)

      if (sess?.user?.id) {
        await cargarPerfil(sess.user.id)

        // aplicar borrador de perfil si existe
        try {
          const draft = localStorage.getItem('perfilDraft')
          if (draft) {
            const parsed = JSON.parse(draft)
            await updatePerfil(parsed)
            localStorage.removeItem('perfilDraft')
          }
        } catch {
          // ignoramos errores del draft
        }
      } else {
        setPerfil(null)
      }
    })

    subscription = sub?.subscription

    return () => {
      if (subscription?.unsubscribe) {
        subscription.unsubscribe()
      }
    }
    // 👇 Sólo depende de `cargarPerfil` para que no se ejecute en bucle
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
      console.error('[AuthContext] login: no se ha podido obtener el usuario tras login')
      throw new Error('No se ha podido iniciar sesión. Inténtalo de nuevo.')
    }

    console.log('[AuthContext] user en login:', {
      email: user.email,
      email_confirmed_at: user.email_confirmed_at,
      confirmed_at: user.confirmed_at,
    })

    // 🚫 BLOQUEAR si el email NO está confirmado
    if (!user.email_confirmed_at && !user.confirmed_at) {
      console.warn('[AuthContext] Email NO confirmado, cerrando sesión inmediata')
      await supabase.auth.signOut()
      const err = new Error('email_not_confirmed')
      throw err
    }

    // ✅ Email confirmado: guardamos sesión
    if (data.session) {
      setSession(data.session)
    }

    return data.session
  }

    // 🔹 REGISTRO robusto: detecta usuario existente sin depender del error de Supabase
    const register = async (email, password) => {
        console.log('[AuthContext] register ->', email)

        // 1️⃣ Comprobación previa en la tabla perfiles
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
            // si single() falla por "Row not found", significa que NO existe, así que continuamos
            if (!`${e.message}`.toLowerCase().includes('row')) {
                if (e.code === 'user_already_exists') throw e
            }
        }

        // 2️⃣ Intento real de registro
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        })

        // 3️⃣ Si signUp devuelve error explícito → lo mostramos
        if (error) {
            console.error('[AuthContext] register error:', error)
            throw error
        }

        // 4️⃣ Seguridad: nunca dejamos sesión activa tras registro
        try {
            await supabase.auth.signOut()
        } catch {}

        return data
    }


    // 🔹 LOGOUT global + limpieza de tokens
  const logout = async () => {
    console.log('[AuthContext] logout llamado')

    try {
      await supabase.auth.signOut({ scope: 'global' })
    } catch (e) {
      console.error('[AuthContext] Error en supabase.auth.signOut():', e)
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

  // 🧮 Propiedad derivada: ¿es admin?
  const esAdmin =
    !!session &&
    (
      session.user?.email === 'admin@plexus.es' || // admin por email
      perfil?.es_admin === true                    // o por flag en BD
    )

  // 🚫 Si el perfil existe pero está bloqueado, cierro sesión
  useEffect(() => {
    if (!loading && perfil && perfil.activo === false) {
      console.warn('[AuthContext] Usuario bloqueado por admin. Cerrando sesión.')
      alert('Tu cuenta ha sido bloqueada por el administrador.')
      logout()
    }
  }, [perfil, loading]) // logout se captura en el cierre

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
