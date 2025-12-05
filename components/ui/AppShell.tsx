import React from 'react'

interface AppShellProps {
  sidebar: React.ReactNode
  header: React.ReactNode
  children: React.ReactNode
}

const AppShell: React.FC<AppShellProps> = ({
  sidebar,
  header,
  children,
}) => {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          {sidebar}
        </div>
      </aside>
      
      {/* Main content area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
          {header}
        </header>
        
        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default AppShell

