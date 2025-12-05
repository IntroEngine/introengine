import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'

interface PageProps {
  params: {
    id: string
  }
}

export default function CompanyDetailPage({ params }: PageProps) {
  // TODO: Fetch empresa desde API
  // const { data: company } = await fetch(`/api/companies/${params.id}`)
  
  // Mock data - en producción vendría de la API
  const company = {
    id: parseInt(params.id),
    nombre: 'TechCorp Solutions',
    dominio: 'techcorp.com',
    industria: 'Tecnología',
    size_bucket: '51-200',
    status: 'in_progress' as const,
    descripcion: 'Empresa líder en soluciones tecnológicas para empresas.',
    ubicacion: 'Madrid, España',
    fundacion: 2015,
  }

  if (!company) {
    notFound()
  }

  const statusLabels: Record<string, string> = {
    new: 'Nueva',
    in_progress: 'En proceso',
    won: 'Ganada',
    lost: 'Perdida',
  }

  const statusVariants: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
    new: 'info',
    in_progress: 'warning',
    won: 'success',
    lost: 'error',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/companies">
            <Button variant="ghost" size="sm" className="mb-4">
              ← Volver a empresas
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {company.nombre}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Detalle de la empresa
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant={statusVariants[company.status] || 'default'}>
            {statusLabels[company.status] || company.status}
          </Badge>
          <Button
            variant="secondary"
            onClick={() => {
              // TODO: Implementar edición
              console.log('Editar empresa:', company.id)
            }}
          >
            Editar
          </Button>
        </div>
      </div>

      {/* Información general */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Información básica" bordered>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Nombre
              </dt>
              <dd className="mt-1 text-sm text-foreground">{company.nombre}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Website
              </dt>
              <dd className="mt-1 text-sm">
                <a
                  href={`https://${company.dominio}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700 dark:text-primary-400"
                >
                  {company.dominio}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Industria
              </dt>
              <dd className="mt-1 text-sm text-foreground">{company.industria}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Tamaño
              </dt>
              <dd className="mt-1 text-sm text-foreground">{company.size_bucket} empleados</dd>
            </div>
          </dl>
        </Card>

        <Card title="Información adicional" bordered>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Ubicación
              </dt>
              <dd className="mt-1 text-sm text-foreground">{company.ubicacion}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Año de fundación
              </dt>
              <dd className="mt-1 text-sm text-foreground">{company.fundacion}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Descripción
              </dt>
              <dd className="mt-1 text-sm text-foreground">{company.descripcion}</dd>
            </div>
          </dl>
        </Card>
      </div>

      {/* TODO: Agregar secciones adicionales */}
      <Card title="Oportunidades relacionadas" bordered>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          TODO: Listar oportunidades relacionadas con esta empresa
        </p>
      </Card>

      <Card title="Contactos" bordered>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          TODO: Listar contactos asociados a esta empresa
        </p>
      </Card>
    </div>
  )
}

