import React from 'react'
import Link from 'next/link'
import Table from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'

interface Company {
  id: number
  nombre: string
  dominio: string
  industria: string
  size_bucket: string
  status: 'new' | 'in_progress' | 'won' | 'lost'
}

interface CompaniesTableProps {
  companies: Company[]
}

const CompaniesTable: React.FC<CompaniesTableProps> = ({ companies }) => {
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

  const tableHeaders = [
    {
      key: 'nombre',
      header: 'Nombre',
    },
    {
      key: 'dominio',
      header: 'Dominio / Web',
      render: (row: Company) => (
        <a
          href={row.dominio.startsWith('http') ? row.dominio : `https://${row.dominio}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
        >
          {row.dominio}
        </a>
      ),
    },
    {
      key: 'industria',
      header: 'Industria',
    },
    {
      key: 'size_bucket',
      header: 'Tamaño',
    },
    {
      key: 'status',
      header: 'Estado',
      render: (row: Company) => (
        <Badge variant={statusVariants[row.status] || 'default'}>
          {statusLabels[row.status] || row.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (row: Company) => (
        <div className="flex items-center space-x-2">
          <Link href={`/companies/${row.id}`}>
            <Button variant="ghost" size="sm">
              Ver detalle
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // TODO: Implementar edición
              console.log('Editar empresa:', row.id)
            }}
          >
            Editar
          </Button>
        </div>
      ),
    },
  ]

  return <Table headers={tableHeaders} rows={companies} />
}

export default CompaniesTable

