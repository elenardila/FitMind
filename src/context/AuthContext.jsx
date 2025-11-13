// javascript
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [loading, setLoading] = useState(true)

  // helper: timeout para detectar llamadas colgadas
  const withTimeout = (promise, ms = 15000) =>
    new Promise((resolve, reject) => {
      const id = setTimeout(() => reject(new Error('timeout')), ms)
      promise
        .then((res) => {
          clearTimeout(id)
          resolve(res)
        })
        .catch((err) => {
          clearTimeout(id)
          reject(err)
        })
    })

  const cargarPerfil = useCallback(async (userId) => {
    if (!userId) {
      setPerfil(null)
      return
    }
    try {
      const { data, error } = await supabase
        .from('perfiles')
        .select('id, nombre, avatar_url, es_admin, suscrito, suscripcion_vence_en')
        .eq('id', userId)
        .single()
      if (!error) setPerfil(data)
    } catch (e) {
      console.error('[AuthContext] Error cargarPerfil():', e)
      setPerfil(null)
    }
  }, [])

  // 🔐 LOGIN robusto (única implementación)
  const login = async (email, password) => {
    console.log('🟢 Intentando iniciar sesión:', email)
    try {
      if (!supabase || !supabase.auth) {
        console.error('[AuthContext] Supabase no está inicializado:', supabase)
        throw new Error('Supabase no inicializado')
      }

      console.log('[AuthContext] Llamando a signInWithPassword (con timeout 15s)')
      const { data, error } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        15000
      )

      console.log('📦 Respuesta Supabase:', data, error)
      if (error) {
        console.error('[AuthContext] Error en login (Supabase):', error)
        throw error
      }

      const sess = data.session || null
      console.log('🧾 Sesión en login():', sess)
      setSession(sess)

      const userId = sess?.user?.id || data?.user?.id
      console.log('👤 userId detectado:', userId)

      if (userId) {
        await cargarPerfil(userId)
        console.log('✅ Perfil cargado correctamente')
      }
    } catch (e) {
      console.error('[AuthContext] Error en login():', e)
      throw e
    }
  }

  // ✅ Inicialización: leer sesión almacenada y perfil
  useEffect(() => {
    const init = async () => {
      setLoading(true)
      try {
        if (!supabase || !supabase.auth) {
          console.error('[AuthContext] Supabase no está inicializado en init():', supabase)
          setSession(null)
          setPerfil(null)
          return
        }

        const { data: { session } = {} } = await supabase.auth.getSession()
        console.log('[AuthContext] Sesión inicial:', session)
        setSession(session || null)
        if (session?.user?.id) {
          await cargarPerfil(session.user.id)
        } else {
          setPerfil(null)
        }
      } catch (e) {
        console.error('[AuthContext] Error en init():', e)
        setSession(null)
        setPerfil(null)
      } finally {
        setLoading(false)
      }
    }
    init()

    const { data: { subscription } = {} } = supabase.auth.onAuthStateChange(async (event, sess) => {
      console.log('[AuthContext] onAuthStateChange:', event, sess)
      setSession(sess || null)
      if (sess?.user?.id) {
        await cargarPerfil(sess.user.id)
        try {
          const draft = localStorage.getItem('perfilDraft')
          if (draft) {
            const parsed = JSON.parse(draft)
            await updatePerfil(parsed)
            localStorage.removeItem('perfilDraft')
          }
        } catch {
          // ignoramos error del borrador
        }
      } else {
        setPerfil(null)
      }
    })

    return () => {
      try {
        subscription?.unsubscribe?.()
      } catch (e) {
        // noop
      }
    }
  }, [cargarPerfil])

  const register = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    const userId = data?.user?.id || data?.session?.user?.id
    if (userId) await cargarPerfil(userId)
  }

  // 🔓 LOGOUT: limpia sesión + perfil
  const logout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (e) {
      console.error('[AuthContext] Error en logout():', e)
    } finally {
      setPerfil(null)
      setSession(null)
      localStorage.removeItem('perfilDraft')
    }
  }

  const resendConfirmEmail = async (email) => {
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    if (error) throw error
  }

  const updatePerfil = async (partial) => {
    if (!session?.user?.id) throw new Error('No hay usuario')
    const { data, error } = await supabase
      .from('perfiles')
      .update({ ...partial, actualizado_en: new Date().toISOString() })
      .eq('id', session.user.id)
      .select()
      .single()
    if (error) throw error
    setPerfil(data)
    return data
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
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
