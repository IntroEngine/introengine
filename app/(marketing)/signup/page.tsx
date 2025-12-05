'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useAuth } from '@/contexts/AuthContext'

export default function SignupPage() {
  const router = useRouter()
  const { signUp, user, loading: authLoading } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard')
    }
  }, [user, authLoading, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido'
    }

    if (!formData.email) {
      newErrors.email = 'El email es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El email no es válido'
    }

    if (!formData.company.trim()) {
      newErrors.company = 'La empresa es requerida'
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida'
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden'
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
    setSuccess(false)

    try {
      const { error } = await signUp(
        formData.email,
        formData.password,
        formData.name,
        formData.company
      )

      if (error) {
        setErrors({
          email: error.message || 'Error al crear la cuenta. Intenta nuevamente.',
        })
        return
      }

      setSuccess(true)
      // Redirigir al dashboard después de un breve delay
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    } catch (error) {
      console.error('Signup error:', error)
      setErrors({
        email: 'Error al crear la cuenta. Intenta nuevamente.',
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
            Solicita acceso a IntroEngine
          </p>
        </div>

        {/* Signup Card */}
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Mensaje de éxito */}
            {success && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-sm text-green-800 dark:text-green-200">
                  <strong>¡Cuenta creada exitosamente!</strong> Redirigiendo al dashboard...
                </p>
              </div>
            )}

            {/* Name Input */}
            <Input
              label="Nombre completo"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Juan Pérez"
              required
              error={errors.name}
              autoComplete="name"
            />

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

            {/* Company Input */}
            <Input
              label="Empresa"
              type="text"
              name="company"
              value={formData.company}
              onChange={handleChange}
              placeholder="Nombre de tu empresa"
              required
              error={errors.company}
              autoComplete="organization"
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
              autoComplete="new-password"
              helperText="Mínimo 6 caracteres"
            />

            {/* Confirm Password Input */}
            <Input
              label="Confirmar contraseña"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              required
              error={errors.confirmPassword}
              autoComplete="new-password"
            />

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full"
            >
              Solicitar acceso
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
            ¿Ya tienes cuenta?{' '}
            <Link
              href="/login"
              className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
            >
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

