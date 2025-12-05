'use client'

import React, { useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import CompaniesTable from '@/components/companies/CompaniesTable'
import Badge from '@/components/ui/Badge'

interface Company {
  id: number
  nombre: string
  dominio: string
  industria: string
  size_bucket: string
  status: 'new' | 'in_progress' | 'won' | 'lost'
}

export default function CompaniesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    website: '',
    industria: '',
    size_bucket: '',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // TODO: Fetch empresas desde API
  // const { data: companies } = await fetch('/api/companies')
  const [companies, setCompanies] = useState<Company[]>([
    {
      id: 1,
      nombre: 'TechCorp Solutions',
      dominio: 'techcorp.com',
      industria: 'Tecnología',
      size_bucket: '51-200',
      status: 'in_progress',
    },
    {
      id: 2,
      nombre: 'InnovateLab',
      dominio: 'innovatelab.io',
      industria: 'Software',
      size_bucket: '11-50',
      status: 'new',
    },
    {
      id: 3,
      nombre: 'DataFlow Inc',
      dominio: 'dataflow.com',
      industria: 'Analytics',
      size_bucket: '201-500',
      status: 'won',
    },
    {
      id: 4,
      nombre: 'CloudScale',
      dominio: 'cloudscale.net',
      industria: 'Cloud Services',
      size_bucket: '51-200',
      status: 'in_progress',
    },
    {
      id: 5,
      nombre: 'StartupHub',
      dominio: 'startuphub.io',
      industria: 'Consultoría',
      size_bucket: '1-10',
      status: 'new',
    },
  ])

  const industryOptions = [
    { value: 'Tecnología', label: 'Tecnología' },
    { value: 'Software', label: 'Software' },
    { value: 'Analytics', label: 'Analytics' },
    { value: 'Cloud Services', label: 'Cloud Services' },
    { value: 'Consultoría', label: 'Consultoría' },
    { value: 'Fintech', label: 'Fintech' },
    { value: 'Healthcare', label: 'Healthcare' },
    { value: 'E-commerce', label: 'E-commerce' },
    { value: 'Otro', label: 'Otro' },
  ]

  const sizeOptions = [
    { value: '1-10', label: '1-10 empleados' },
    { value: '11-50', label: '11-50 empleados' },
    { value: '51-200', label: '51-200 empleados' },
    { value: '201-500', label: '201-500 empleados' },
    { value: '501-1000', label: '501-1000 empleados' },
    { value: '1000+', label: '1000+ empleados' },
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.nombre.trim()) {
      errors.nombre = 'El nombre es obligatorio'
    }

    if (formData.website && !/^https?:\/\/.+\..+/.test(formData.website) && !/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}$/.test(formData.website)) {
      errors.website = 'Ingresa un dominio válido (ej: ejemplo.com)'
    }

    if (!formData.industria) {
      errors.industria = 'La industria es obligatoria'
    }

    if (!formData.size_bucket) {
      errors.size_bucket = 'El tamaño es obligatorio'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      // TODO: Conectar con API para crear empresa
      // const response = await fetch('/api/companies', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData),
      // })
      // const newCompany = await response.json()

      // Simular llamada a API
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const website = formData.website.startsWith('http') 
        ? formData.website 
        : formData.website 
          ? `https://${formData.website}` 
          : ''

      const newCompany: Company = {
        id: companies.length + 1,
        nombre: formData.nombre,
        dominio: formData.website || 'N/A',
        industria: formData.industria,
        size_bucket: formData.size_bucket,
        status: 'new',
      }

      console.log('Nueva empresa creada:', newCompany)
      
      // Agregar a la lista (en producción vendría del servidor)
      setCompanies([...companies, newCompany])

      // Reset form y cerrar modal
      setFormData({
        nombre: '',
        website: '',
        industria: '',
        size_bucket: '',
      })
      setIsModalOpen(false)
    } catch (error) {
      console.error('Error al crear empresa:', error)
      setFormErrors({
        nombre: 'Error al crear la empresa. Intenta nuevamente.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setFormData({
      nombre: '',
      website: '',
      industria: '',
      size_bucket: '',
    })
    setFormErrors({})
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Empresas objetivo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gestiona tus empresas objetivo y su estado
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
        >
          Añadir empresa
        </Button>
      </div>

      {/* Companies Table */}
      <Card bordered>
        <CompaniesTable companies={companies} />
      </Card>

      {/* Modal Añadir Empresa */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Añadir empresa"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleInputChange}
            placeholder="Nombre de la empresa"
            required
            error={formErrors.nombre}
          />

          <Input
            label="Website"
            name="website"
            type="text"
            value={formData.website}
            onChange={handleInputChange}
            placeholder="ejemplo.com"
            error={formErrors.website}
            helperText="Puedes ingresar solo el dominio (ejemplo.com) o URL completa"
          />

          <Select
            label="Industria"
            name="industria"
            value={formData.industria}
            onChange={handleInputChange}
            options={industryOptions}
            required
            error={formErrors.industria}
          />

          <Select
            label="Tamaño"
            name="size_bucket"
            value={formData.size_bucket}
            onChange={handleInputChange}
            options={sizeOptions}
            required
            error={formErrors.size_bucket}
          />

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseModal}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
            >
              Guardar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

