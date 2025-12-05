'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/config/supabase'
import { useRouter } from 'next/navigation'

interface AuthUser {
  id: string
  email: string
  account_id: string
  full_name: string | null
  role: string
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, name: string, company: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  // Cargar usuario al montar
  useEffect(() => {
    loadUser()

    // Escuchar cambios en la sesión
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await loadUser()
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  async function loadUser() {
    try {
      setLoading(true)
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session?.user) {
        setUser(null)
        return
      }

      // Obtener usuario de la tabla users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, account_id, full_name, role')
        .eq('id', session.user.id)
        .eq('is_active', true)
        .single()

      if (userError || !userData) {
        // Intentar buscar por email
        const { data: userByEmail } = await supabase
          .from('users')
          .select('id, email, account_id, full_name, role')
          .eq('email', session.user.email || '')
          .eq('is_active', true)
          .single()

        if (userByEmail) {
          setUser({
            id: userByEmail.id,
            email: userByEmail.email,
            account_id: userByEmail.account_id,
            full_name: userByEmail.full_name,
            role: userByEmail.role || 'member',
          })
        } else {
          setUser(null)
        }
      } else {
        setUser({
          id: userData.id,
          email: userData.email,
          account_id: userData.account_id,
          full_name: userData.full_name,
          role: userData.role || 'member',
        })
      }
    } catch (error) {
      console.error('Error loading user:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  async function signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { error }
      }

      // Recargar usuario después de login
      await loadUser()
      
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  async function signUp(email: string, password: string, name: string, company: string) {
    try {
      // 1. Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            company,
          },
        },
      })

      if (authError) {
        return { error: authError }
      }

      if (!authData.user) {
        return { error: new Error('Failed to create user') }
      }

      // 2. Crear account en la tabla accounts
      const { data: accountData, error: accountError } = await supabase
        .from('accounts')
        .insert({
          name: company,
        })
        .select('id')
        .single()

      if (accountError || !accountData) {
        // Si falla crear account, no podemos eliminar el usuario de auth desde el cliente
        // El usuario quedará en auth pero sin account - esto se puede limpiar manualmente
        console.error('Failed to create account:', accountError)
        return { error: accountError || new Error('Failed to create account') }
      }

      // 3. Crear usuario en la tabla users
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: authData.user.email!,
          account_id: accountData.id,
          full_name: name,
          role: 'admin', // Primer usuario es admin
        })

      if (userError) {
        // Si falla, limpiar account (el usuario de auth quedará pero sin account)
        await supabase.from('accounts').delete().eq('id', accountData.id).catch(() => {})
        console.error('Failed to create user:', userError)
        return { error: userError }
      }

      // Recargar usuario
      await loadUser()

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  async function signOut() {
    try {
      await supabase.auth.signOut()
      setUser(null)
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  async function refreshUser() {
    await loadUser()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
