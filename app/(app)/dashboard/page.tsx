import React from 'react'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Table from '@/components/ui/Table'

export default function DashboardPage() {
  // TODO: Fetch KPIs desde API
  // const { data: kpis } = await fetch('/api/dashboard/kpis')
  const kpis = [
    { 
      label: 'Intros sugeridas esta semana', 
      value: '12', 
      change: '+3',
      description: 'vs semana anterior'
    },
    { 
      label: 'Intros pedidas', 
      value: '8', 
      change: '+2',
      description: 'esta semana'
    },
    { 
      label: 'Outbound sugerido', 
      value: '24', 
      change: '+5',
      description: 'empresas nuevas'
    },
    { 
      label: 'Reuniones ganadas (won)', 
      value: '3', 
      change: '+1',
      description: 'este mes'
    },
  ]

  // TODO: Fetch oportunidades destacadas desde API
  // const { data: opportunities } = await fetch('/api/dashboard/opportunities?limit=5&sort=lead_potential_score')
  const topOpportunities = [
    { 
      id: 1, 
      empresa: 'TechCorp Solutions', 
      tipo: 'intro', 
      score: 95,
      estado: 'Pendiente',
      lead_potential_score: 95
    },
    { 
      id: 2, 
      empresa: 'InnovateLab', 
      tipo: 'outbound', 
      score: 88,
      estado: 'En proceso',
      lead_potential_score: 88
    },
    { 
      id: 3, 
      empresa: 'StartupHub', 
      tipo: 'intro', 
      score: 85,
      estado: 'Pendiente',
      lead_potential_score: 85
    },
    { 
      id: 4, 
      empresa: 'DataFlow Inc', 
      tipo: 'outbound', 
      score: 82,
      estado: 'En proceso',
      lead_potential_score: 82
    },
    { 
      id: 5, 
      empresa: 'CloudScale', 
      tipo: 'intro', 
      score: 80,
      estado: 'Pendiente',
      lead_potential_score: 80
    },
  ]

  // TODO: Fetch acciones recomendadas desde API
  // const { data: actions } = await fetch('/api/dashboard/recommended-actions')
  const recommendedActions = [
    {
      id: 1,
      title: 'Seguir con 3 intros pendientes de alta prioridad',
      description: 'Tienes 3 intros con score superior a 90 que requieren seguimiento inmediato. Estas oportunidades tienen alta probabilidad de cierre.',
      actionType: 'oportunidades',
      actionUrl: '/opportunities',
    },
    {
      id: 2,
      title: 'Revisar 5 empresas nuevas sugeridas para outbound',
      description: 'Se detectaron 5 empresas con señales de compra activas que podrían ser buenas candidatas para outreach directo.',
      actionType: 'acciones-sugeridas',
      actionUrl: '/actions',
    },
    {
      id: 3,
      title: 'Actualizar estado de 2 oportunidades en proceso',
      description: 'Hay 2 oportunidades que llevan más de una semana sin actualización. Es momento de hacer seguimiento.',
      actionType: 'oportunidades',
      actionUrl: '/opportunities',
    },
    {
      id: 4,
      title: 'Pedir intro para TechCorp Solutions',
      description: 'TechCorp tiene un score de 95 y hay una conexión directa disponible en tu red. Esta es una oportunidad de alto valor.',
      actionType: 'acciones-sugeridas',
      actionUrl: '/actions',
    },
  ]

  // Configuración de columnas para la tabla de oportunidades
  const opportunityTableHeaders = [
    { 
      key: 'empresa', 
      header: 'Empresa' 
    },
    { 
      key: 'tipo', 
      header: 'Tipo',
      render: (row: typeof topOpportunities[0]) => {
        const tipoLabels: Record<string, string> = {
          'intro': 'Intro',
          'outbound': 'Outbound',
        }
        const tipoVariants: Record<string, 'success' | 'info'> = {
          'intro': 'success',
          'outbound': 'info',
        }
        return (
          <Badge variant={tipoVariants[row.tipo] || 'default'}>
            {tipoLabels[row.tipo] || row.tipo}
          </Badge>
        )
      }
    },
    { 
      key: 'score', 
      header: 'Score',
      render: (row: typeof topOpportunities[0]) => {
        const getScoreColor = (score: number) => {
          if (score >= 90) return 'text-success-600 dark:text-success-400'
          if (score >= 80) return 'text-warning-600 dark:text-warning-400'
          return 'text-gray-600 dark:text-gray-400'
        }
        return (
          <span className={`font-semibold ${getScoreColor(row.score)}`}>
            {row.score}
          </span>
        )
      }
    },
    { 
      key: 'estado', 
      header: 'Estado',
      render: (row: typeof topOpportunities[0]) => {
        const estadoVariants: Record<string, 'success' | 'warning' | 'info'> = {
          'Pendiente': 'warning',
          'En proceso': 'info',
          'Completado': 'success',
        }
        return (
          <Badge variant={estadoVariants[row.estado] || 'default'}>
            {row.estado}
          </Badge>
        )
      }
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Resumen general
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Vista general de salud de prospección
        </p>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => (
          <Card key={index} hover bordered>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                {kpi.label}
              </p>
              <div className="flex items-baseline justify-between">
                <p className="text-3xl font-bold text-foreground">
                  {kpi.value}
                </p>
                <div className="text-right">
                  <Badge variant="success" className="mb-1">
                    {kpi.change}
                  </Badge>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {kpi.description}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Oportunidades destacadas */}
      <Card title="Oportunidades destacadas" bordered>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Top 5 oportunidades ordenadas por lead potential score
        </p>
        <Table headers={opportunityTableHeaders} rows={topOpportunities} />
        <div className="mt-4 flex justify-end">
          <Link href="/opportunities">
            <Button variant="ghost" size="sm">
              Ver todas las oportunidades
            </Button>
          </Link>
        </div>
      </Card>

      {/* Acciones recomendadas */}
      <Card title="Acciones recomendadas" bordered>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Acciones prioritarias basadas en tu actividad y oportunidades
        </p>
        <div className="space-y-4">
          {recommendedActions.map((action) => (
            <div
              key={action.id}
              className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-2">
                  {action.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {action.description}
                </p>
              </div>
              <div className="ml-4">
                <Link href={action.actionUrl}>
                  <Button variant="primary" size="sm">
                    {action.actionType === 'oportunidades' 
                      ? 'Ir a oportunidades' 
                      : 'Ir a acciones sugeridas'}
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <Link href="/actions">
            <Button variant="ghost" size="sm">
              Ver todas las acciones sugeridas
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
