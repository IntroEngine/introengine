'use client'

import React, { useState } from 'react'
import { useTheme } from 'next-themes'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

interface TopbarProps {
  title: string
  user?: {
    name?: string
    email?: string
    avatar?: string
  }
}

const Topbar: React.FC<TopbarProps> = ({ title, user }) => {
  const { theme, setTheme } = useTheme()
  const { signOut } = useAuth()
  const router = useRouter()
  const [showMenu, setShowMenu] = useState(false)
  
  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }
  
  return (
    <div className="flex items-center justify-between h-16 px-6 bg-white dark:bg-gray-900">
      {/* Title */}
      <h2 className="text-xl font-semibold text-foreground">
        {title}
      </h2>
      
      {/* Right side */}
      <div className="flex items-center space-x-4">
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
        
        {/* User section */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name || 'Usuario'}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-medium">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-foreground">
                {user?.name || 'Usuario'}
              </p>
              {user?.email && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user.email}
                </p>
              )}
            </div>
            <svg
              className="w-4 h-4 text-gray-500 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {/* Dropdown menu */}
          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-20 border border-gray-200 dark:border-gray-700">
                <div className="py-1">
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cerrar sesión
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Topbar

