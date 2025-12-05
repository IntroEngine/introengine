'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }))
    }
  }

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {}

    if (!formData.email) {
      newErrors.email = 'El email es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El email no es válido'
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      // TODO: Conectar con Supabase Auth o el sistema de autenticación elegido
      // Ejemplo con Supabase:
      // const { data, error } = await supabase.auth.signInWithPassword({
      //   email: formData.email,
      //   password: formData.password,
      // })
      // if (error) throw error

      // Por ahora: permitir login con cualquier usuario y contraseña para desarrollo
      // Simular llamada a API
      await new Promise((resolve) => setTimeout(resolve, 500))

      console.log('Login exitoso (modo desarrollo):', { email: formData.email })
      
      // Redirigir al dashboard
      router.push('/dashboard')
    } catch (error) {
      console.error('Login error:', error)
      setErrors({
        email: 'Error al iniciar sesión. Verifica tus credenciales.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-foreground">IntroEngine</h1>
          </Link>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Inicia sesión en tu cuenta
          </p>
        </div>

        {/* Login Card */}
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Mensaje informativo */}
            <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
              <p className="text-sm text-primary-800 dark:text-primary-200">
                <strong>Modo desarrollo:</strong> Puedes iniciar sesión con cualquier email y contraseña.
              </p>
            </div>

            {/* Email Input */}
            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="tu@empresa.com"
              required
              error={errors.email}
              autoComplete="email"
            />

            {/* Password Input */}
            <Input
              label="Contraseña"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              error={errors.password}
              autoComplete="current-password"
            />

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full"
            >
              Entrar
            </Button>
          </form>

          {/* Link para volver */}
          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
            >
              ← Volver a la landing
            </Link>
          </div>
        </Card>

        {/* Footer adicional */}
        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>
            ¿No tienes cuenta?{' '}
            <Link
              href="/signup"
              className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
            >
              Solicitar acceso
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

