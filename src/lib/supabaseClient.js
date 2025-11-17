import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: variables de entorno de Supabase no definidas.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: true,
  },
})

// 🔍 Verificación en consola (solo entorno local)
if (import.meta.env.DEV) {
  console.log('🔧 Cliente Supabase inicializado con URL:', supabaseUrl)
}
