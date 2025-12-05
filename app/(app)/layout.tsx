import React from 'react'
import AppShell from '@/components/ui/AppShell'
import Sidebar from '@/components/ui/Sidebar'
import Topbar from '@/components/ui/Topbar'

// TODO: Obtener título dinámico basado en la ruta actual
// TODO: Conectar con datos reales del usuario desde backend/sesión
const getUserData = () => {
  // Placeholder - conectar con backend más adelante
  return {
    name: 'Usuario Demo',
    email: 'usuario@introengine.com',
    avatar: undefined,
  }
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = getUserData()
  
  // TODO: Implementar lógica para obtener título dinámico según la ruta
  const title = 'Dashboard' // Placeholder - se actualizará dinámicamente
  
  return (
    <AppShell
      sidebar={<Sidebar />}
      header={<Topbar title={title} user={user} />}
    >
      {children}
    </AppShell>
  )
}

