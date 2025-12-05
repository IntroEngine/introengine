'use client'

import React, { useState } from 'react'
import Button from '@/components/ui/Button'

interface CTASectionProps {
  title: string
  subtitle?: string
  showForm?: boolean
}

const CTASection: React.FC<CTASectionProps> = ({ 
  title, 
  subtitle,
  showForm = false 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    teamSize: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // TODO: Conectar con backend para envío del formulario
    console.log('Form data:', formData)
    
    setTimeout(() => {
      setIsSubmitting(false)
      alert('¡Gracias por tu interés! Te contactaremos pronto.')
      setFormData({ name: '', email: '', company: '', teamSize: '' })
    }, 1000)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <section className="py-20 bg-gradient-to-b from-background to-gray-50 dark:to-gray-900">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {title}
          </h2>
          {subtitle && (
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}
        </div>

        {showForm ? (
          <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                Nombre
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Tu nombre"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="tu@empresa.com"
              />
            </div>

            <div>
              <label htmlFor="company" className="block text-sm font-medium text-foreground mb-2">
                Empresa
              </label>
              <input
                type="text"
                id="company"
                name="company"
                required
                value={formData.company}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Nombre de tu empresa"
              />
            </div>

            <div>
              <label htmlFor="teamSize" className="block text-sm font-medium text-foreground mb-2">
                Tamaño de equipo
              </label>
              <select
                id="teamSize"
                name="teamSize"
                required
                value={formData.teamSize}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Selecciona una opción</option>
                <option value="1-5">1-5 personas</option>
                <option value="6-20">6-20 personas</option>
                <option value="21-50">21-50 personas</option>
                <option value="51-200">51-200 personas</option>
                <option value="200+">200+ personas</option>
              </select>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              className="w-full"
            >
              Solicitar acceso
            </Button>
          </form>
        ) : (
          <div className="text-center">
            <Button variant="primary" size="lg" className="mr-4 mb-4 md:mb-0">
              Solicitar acceso
            </Button>
            <Button variant="secondary" size="lg">
              Ver cómo funciona
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}

export default CTASection

