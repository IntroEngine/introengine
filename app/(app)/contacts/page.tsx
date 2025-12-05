'use client'

import React, { useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import ContactsTable from '@/components/contacts/ContactsTable'

interface Contact {
  id: number
  nombre: string
  email: string
  empresa: string
  role_title: string
  tipo: 'bridge' | 'target' | 'unknown'
  source: 'import' | 'manual' | 'linkedin'
}

export default function ContactsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    empresa: '',
    role_title: '',
    tipo: '',
    source: '',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // TODO: Fetch contactos desde API
  // const { data: contacts } = await fetch('/api/contacts')
  const [contacts, setContacts] = useState<Contact[]>([
    {
      id: 1,
      nombre: 'Juan Pérez',
      email: 'juan.perez@techcorp.com',
      empresa: 'TechCorp Solutions',
      role_title: 'CEO',
      tipo: 'target',
      source: 'linkedin',
    },
    {
      id: 2,
      nombre: 'María García',
      email: 'maria.garcia@innovatelab.io',
      empresa: 'InnovateLab',
      role_title: 'CTO',
      tipo: 'bridge',
      source: 'manual',
    },
    {
      id: 3,
      nombre: 'Carlos López',
      email: 'carlos.lopez@dataflow.com',
      empresa: 'DataFlow Inc',
      role_title: 'Head of Sales',
      tipo: 'target',
      source: 'import',
    },
    {
      id: 4,
      nombre: 'Ana Martínez',
      email: 'ana.martinez@cloudscale.net',
      empresa: 'CloudScale',
      role_title: 'VP of Marketing',
      tipo: 'bridge',
      source: 'linkedin',
    },
    {
      id: 5,
      nombre: 'Roberto Silva',
      email: 'roberto.silva@startuphub.io',
      empresa: 'StartupHub',
      role_title: 'Founder',
      tipo: 'target',
      source: 'manual',
    },
    {
      id: 6,
      nombre: 'Laura Fernández',
      email: 'laura.fernandez@techcorp.com',
      empresa: 'TechCorp Solutions',
      role_title: 'Product Manager',
      tipo: 'unknown',
      source: 'import',
    },
  ])

  const tipoOptions = [
    { value: 'bridge', label: 'Puente' },
    { value: 'target', label: 'Objetivo' },
    { value: 'unknown', label: 'Desconocido' },
  ]

  const sourceOptions = [
    { value: 'import', label: 'Importado' },
    { value: 'manual', label: 'Manual' },
    { value: 'linkedin', label: 'LinkedIn' },
  ]

  // TODO: Fetch empresas desde API para autocompletado
  // Por ahora usamos texto libre para MVP

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

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'El email no es válido'
    }

    if (!formData.tipo) {
      errors.tipo = 'El tipo es obligatorio'
    }

    if (!formData.source) {
      errors.source = 'El origen es obligatorio'
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
      // TODO: Conectar con API para crear contacto
      // const response = await fetch('/api/contacts', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData),
      // })
      // const newContact = await response.json()

      // Simular llamada a API
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const newContact: Contact = {
        id: contacts.length + 1,
        nombre: formData.nombre,
        email: formData.email || '',
        empresa: formData.empresa || 'N/A',
        role_title: formData.role_title || 'N/A',
        tipo: formData.tipo as 'bridge' | 'target' | 'unknown',
        source: formData.source as 'import' | 'manual' | 'linkedin',
      }

      console.log('Nuevo contacto creado:', newContact)
      
      // Agregar a la lista (en producción vendría del servidor)
      setContacts([...contacts, newContact])

      // Reset form y cerrar modal
      setFormData({
        nombre: '',
        email: '',
        empresa: '',
        role_title: '',
        tipo: '',
        source: '',
      })
      setIsModalOpen(false)
    } catch (error) {
      console.error('Error al crear contacto:', error)
      setFormErrors({
        nombre: 'Error al crear el contacto. Intenta nuevamente.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setFormData({
      nombre: '',
      email: '',
      empresa: '',
      role_title: '',
      tipo: '',
      source: '',
    })
    setFormErrors({})
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Contactos
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gestiona tus contactos puente y target
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
        >
          Añadir contacto
        </Button>
      </div>

      {/* Contacts Table */}
      <Card bordered>
        <ContactsTable contacts={contacts} />
      </Card>

      {/* Modal Añadir Contacto */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Añadir contacto"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre"
            name="nombre"
            type="text"
            value={formData.nombre}
            onChange={handleInputChange}
            placeholder="Nombre completo"
            required
            error={formErrors.nombre}
            autoComplete="name"
          />

          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="email@empresa.com"
            error={formErrors.email}
            autoComplete="email"
          />

          <Input
            label="Empresa"
            name="empresa"
            type="text"
            value={formData.empresa}
            onChange={handleInputChange}
            placeholder="Nombre de la empresa"
            helperText="Texto libre para MVP"
            autoComplete="organization"
          />

          <Input
            label="Rol"
            name="role_title"
            type="text"
            value={formData.role_title}
            onChange={handleInputChange}
            placeholder="Ej: CEO, CTO, Head of Sales"
            autoComplete="organization-title"
          />

          <Select
            label="Tipo"
            name="tipo"
            value={formData.tipo}
            onChange={handleInputChange}
            options={tipoOptions}
            required
            error={formErrors.tipo}
          />

          <Select
            label="Origen"
            name="source"
            value={formData.source}
            onChange={handleInputChange}
            options={sourceOptions}
            required
            error={formErrors.source}
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

