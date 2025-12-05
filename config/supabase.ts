import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'

// Variables de entorno configuradas en .env.local:
// NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
// NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local')
}

/**
 * Crea un cliente de Supabase configurado
 * Funciona tanto en cliente como en servidor
 * @returns Cliente de Supabase
 */
export function createClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase credentials not configured')
  }

  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}

