import React from 'react'
import Table from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'

interface Contact {
  id: number
  nombre: string
  email: string
  empresa: string
  role_title: string
  tipo: 'bridge' | 'target' | 'unknown'
  source: 'import' | 'manual' | 'linkedin'
}

interface ContactsTableProps {
  contacts: Contact[]
}

const ContactsTable: React.FC<ContactsTableProps> = ({ contacts }) => {
  const tipoLabels: Record<string, string> = {
    bridge: 'Puente',
    target: 'Objetivo',
    unknown: 'Desconocido',
  }

  const tipoVariants: Record<string, 'success' | 'warning' | 'info' | 'default'> = {
    bridge: 'info',
    target: 'success',
    unknown: 'default',
  }

  const sourceLabels: Record<string, string> = {
    import: 'Importado',
    manual: 'Manual',
    linkedin: 'LinkedIn',
  }

  const tableHeaders = [
    {
      key: 'nombre',
      header: 'Nombre',
    },
    {
      key: 'email',
      header: 'Email',
      render: (row: Contact) => (
        <a
          href={`mailto:${row.email}`}
          className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
        >
          {row.email}
        </a>
      ),
    },
    {
      key: 'empresa',
      header: 'Empresa',
    },
    {
      key: 'role_title',
      header: 'Rol',
    },
    {
      key: 'tipo',
      header: 'Tipo',
      render: (row: Contact) => (
        <Badge variant={tipoVariants[row.tipo] || 'default'}>
          {tipoLabels[row.tipo] || row.tipo}
        </Badge>
      ),
    },
    {
      key: 'source',
      header: 'Origen',
      render: (row: Contact) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {sourceLabels[row.source] || row.source}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (row: Contact) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // TODO: Implementar ver detalle
              console.log('Ver contacto:', row.id)
            }}
          >
            Ver
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // TODO: Implementar edición
              console.log('Editar contacto:', row.id)
            }}
          >
            Editar
          </Button>
        </div>
      ),
    },
  ]

  return <Table headers={tableHeaders} rows={contacts} />
}

export default ContactsTable

