import React from 'react'
import Link from 'next/link'
import Table from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'

interface Opportunity {
  id: number
  empresa: string
  tipo: 'intro' | 'outbound'
  lead_potential_score: number
  estado: 'suggested' | 'intro_requested' | 'in_progress' | 'won' | 'lost'
  tiene_puente: boolean
}

interface OpportunitiesTableProps {
  opportunities: Opportunity[]
}

const OpportunitiesTable: React.FC<OpportunitiesTableProps> = ({ opportunities }) => {
  const tipoLabels: Record<string, string> = {
    intro: 'Intro',
    outbound: 'Outbound',
  }

  const tipoVariants: Record<string, 'success' | 'info'> = {
    intro: 'success',
    outbound: 'info',
  }

  const estadoLabels: Record<string, string> = {
    suggested: 'Sugerida',
    intro_requested: 'Intro pedida',
    in_progress: 'En proceso',
    won: 'Ganada',
    lost: 'Perdida',
  }

  const estadoVariants: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
    suggested: 'info',
    intro_requested: 'warning',
    in_progress: 'warning',
    won: 'success',
    lost: 'error',
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-success-600 dark:text-success-400 font-bold'
    if (score >= 80) return 'text-warning-600 dark:text-warning-400 font-semibold'
    if (score >= 70) return 'text-gray-700 dark:text-gray-300'
    return 'text-gray-500 dark:text-gray-400'
  }

  const tableHeaders = [
    {
      key: 'empresa',
      header: 'Empresa',
      render: (row: Opportunity) => (
        <Link
          href={`/opportunities/${row.id}`}
          className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
        >
          {row.empresa}
        </Link>
      ),
    },
    {
      key: 'tipo',
      header: 'Tipo',
      render: (row: Opportunity) => (
        <Badge variant={tipoVariants[row.tipo] || 'default'}>
          {tipoLabels[row.tipo] || row.tipo}
        </Badge>
      ),
    },
    {
      key: 'lead_potential_score',
      header: 'Score',
      render: (row: Opportunity) => (
        <span className={getScoreColor(row.lead_potential_score)}>
          {row.lead_potential_score}
        </span>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (row: Opportunity) => (
        <Badge variant={estadoVariants[row.estado] || 'default'}>
          {estadoLabels[row.estado] || row.estado}
        </Badge>
      ),
    },
    {
      key: 'tiene_puente',
      header: 'Tiene puente',
      render: (row: Opportunity) => (
        <div className="flex items-center">
          {row.tiene_puente ? (
            <>
              <svg className="w-5 h-5 text-success-600 dark:text-success-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm text-gray-600 dark:text-gray-400">Sí</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5 text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="text-sm text-gray-500 dark:text-gray-400">No</span>
            </>
          )}
        </div>
      ),
    },
  ]

  return <Table headers={tableHeaders} rows={opportunities} />
}

export default OpportunitiesTable

