'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import AppShell from '@/components/ui/AppShell'
import Sidebar from '@/components/ui/Sidebar'
import Topbar from '@/components/ui/Topbar'
import { useAuth } from '@/contexts/AuthContext'

// Mapeo de rutas a títulos
const routeTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/companies': 'Empresas',
  '/contacts': 'Contactos',
  '/opportunities': 'Oportunidades',
  '/actions': 'Acciones',
  '/weekly-summary': 'Resumen Semanal',
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { user, loading } = useAuth()
  
  // Obtener título basado en la ruta actual
  const title = routeTitles[pathname] || 'Dashboard'
  
  // Preparar datos del usuario para Topbar
  const userData = user ? {
    name: user.full_name || user.email,
    email: user.email,
    avatar: undefined,
  } : {
    name: 'Cargando...',
    email: '',
    avatar: undefined,
  }
  
  // Mostrar loading mientras se carga el usuario
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando...</p>
        </div>
      </div>
    )
  }
  
  return (
    <AppShell
      sidebar={<Sidebar />}
      header={<Topbar title={title} user={userData} />}
    >
      {children}
    </AppShell>
  )
}

