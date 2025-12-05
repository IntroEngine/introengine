/**
 * Helpers de autenticación para IntroEngine
 * 
 * Funciones para obtener el usuario autenticado y su account_id
 */

import { createClient } from '@/config/supabase'
import { cookies } from 'next/headers'

export interface AuthUser {
  id: string
  email: string
  account_id: string
  full_name: string | null
  role: string
}

/**
 * Crea un cliente de Supabase para uso en servidor
 * En Next.js 14, el cliente maneja las cookies automáticamente
 */
function createServerClient() {
  return createClient()
}

/**
 * Obtiene el usuario autenticado desde el servidor (Server Component o API Route)
 * 
 * @returns Usuario autenticado con account_id o null si no está autenticado
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    const supabase = await createServerClient()
    
    // Obtener sesión
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      return null
    }

    // Obtener el usuario de la tabla users usando el id de auth
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, account_id, full_name, role')
      .eq('id', session.user.id)
      .eq('is_active', true)
      .single()

    if (userError || !user) {
      // Si no existe en users, intentar buscar por email
      const { data: userByEmail, error: emailError } = await supabase
        .from('users')
        .select('id, email, account_id, full_name, role')
        .eq('email', session.user.email || '')
        .eq('is_active', true)
        .single()

      if (emailError || !userByEmail) {
        console.error('User not found in users table:', { userId: session.user.id, email: session.user.email })
        return null
      }

      return {
        id: userByEmail.id,
        email: userByEmail.email,
        account_id: userByEmail.account_id,
        full_name: userByEmail.full_name,
        role: userByEmail.role || 'member',
      }
    }

    return {
      id: user.id,
      email: user.email,
      account_id: user.account_id,
      full_name: user.full_name,
      role: user.role || 'member',
    }
  } catch (error) {
    console.error('Error getting auth user:', error)
    return null
  }
}

/**
 * Obtiene el account_id del usuario autenticado
 * 
 * @returns account_id o null si no está autenticado
 */
export async function getAccountId(): Promise<string | null> {
  const user = await getAuthUser()
  return user?.account_id || null
}

/**
 * Requiere autenticación - lanza error si no está autenticado
 * 
 * @returns Usuario autenticado
 * @throws Error si no está autenticado
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getAuthUser()
  
  if (!user) {
    throw new Error('Unauthorized: Authentication required')
  }
  
  return user
}
