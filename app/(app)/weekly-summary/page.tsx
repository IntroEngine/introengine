'use client'

import React, { useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'

interface WeeklyAdvisorResult {
  intros_generadas: number
  intros_pedidas: number
  respuestas: number
  outbound_pendiente: number
  ganadas: number
  perdidas: number
  insights: string[]
  acciones_recomendadas: {
    accion: string
    oportunidades_relacionadas?: number[]
  }[]
}

export default function WeeklySummaryPage() {
  const [isRegenerating, setIsRegenerating] = useState(false)

  // TODO: Fetch resumen semanal desde API
  // const { data: weeklySummary } = await fetch('/api/weekly-summary')
  // O desde Weekly Advisor Engine:
  // const { data: weeklySummary } = await fetch('/api/weekly-advisor/generate')
  
  const weeklySummary: WeeklyAdvisorResult = {
    intros_generadas: 12,
    intros_pedidas: 8,
    respuestas: 5,
    outbound_pendiente: 24,
    ganadas: 3,
    perdidas: 1,
    insights: [
      'Esta semana generaste 12 intros nuevas, un 20% más que la semana anterior. El motor detectó más conexiones en tu red.',
      'Tienes 8 intros pedidas pendientes de respuesta. Es momento de hacer seguimiento a las que llevan más de 5 días.',
      'Tu tasa de respuesta es del 62.5%, por encima del promedio. Sigue con el mismo enfoque en tus mensajes.',
      'Hay 24 empresas en outbound pendiente con score superior a 70. Prioriza las que tienen buying signals activos.',
      'Ganaste 3 oportunidades esta semana. El ratio de ganadas vs perdidas es 3:1, muy positivo.',
    ],
    acciones_recomendadas: [
      {
        accion: 'Seguir con las 3 intros pendientes de alta prioridad (score >90). Estas tienen mayor probabilidad de cierre.',
        oportunidades_relacionadas: [1, 3, 5],
      },
      {
        accion: 'Priorizar outbound para 5 empresas con buying signals activos detectados esta semana.',
        oportunidades_relacionadas: [2, 4, 6, 7, 8],
      },
      {
        accion: 'Hacer seguimiento a las 2 oportunidades que llevan más de 10 días sin actualización.',
        oportunidades_relacionadas: [9, 10],
      },
      {
        accion: 'Revisar y actualizar el estado de las oportunidades que están en "intro pedida" hace más de una semana.',
        oportunidades_relacionadas: [11, 12],
      },
    ],
  }

  const handleRegenerate = async () => {
    setIsRegenerating(true)
    
    // TODO: Conectar con API para regenerar resumen
    // await fetch('/api/weekly-advisor/generate', { method: 'POST' })
    
    // Simular llamada
    await new Promise((resolve) => setTimeout(resolve, 2000))
    
    console.log('Regenerar resumen semanal')
    alert('TODO: Conectar con API para regenerar resumen')
    
    setIsRegenerating(false)
  }

  const metrics = [
    {
      label: 'Intros generadas',
      value: weeklySummary.intros_generadas,
      variant: 'info' as const,
      description: 'Esta semana',
    },
    {
      label: 'Intros pedidas',
      value: weeklySummary.intros_pedidas,
      variant: 'warning' as const,
      description: 'Pendientes',
    },
    {
      label: 'Respuestas',
      value: weeklySummary.respuestas,
      variant: 'success' as const,
      description: `${Math.round((weeklySummary.respuestas / weeklySummary.intros_pedidas) * 100)}% tasa`,
    },
    {
      label: 'Outbound pendiente',
      value: weeklySummary.outbound_pendiente,
      variant: 'default' as const,
      description: 'Empresas',
    },
    {
      label: 'Ganadas',
      value: weeklySummary.ganadas,
      variant: 'success' as const,
      description: 'Esta semana',
    },
    {
      label: 'Perdidas',
      value: weeklySummary.perdidas,
      variant: 'error' as const,
      description: 'Esta semana',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Resumen semanal
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Análisis generado por el Weekly Advisor Engine
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={handleRegenerate}
          isLoading={isRegenerating}
        >
          Regenerar resumen
        </Button>
      </div>

      {/* Resumen numérico */}
      <Card title="Resumen numérico" bordered>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {metrics.map((metric, index) => (
            <div key={index} className="text-center">
              <div className="mb-2">
                <Badge variant={metric.variant} className="mb-2">
                  {metric.label}
                </Badge>
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">
                {metric.value}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {metric.description}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Insights */}
      <Card title="Insights" bordered>
        <ul className="space-y-3">
          {weeklySummary.insights.map((insight, index) => (
            <li key={index} className="flex items-start">
              <span className="flex-shrink-0 w-2 h-2 rounded-full bg-primary-600 mt-2 mr-3"></span>
              <p className="text-foreground">{insight}</p>
            </li>
          ))}
        </ul>
      </Card>

      {/* Acciones recomendadas */}
      <Card title="Acciones recomendadas" bordered>
        <ol className="space-y-4">
          {weeklySummary.acciones_recomendadas.map((accion, index) => (
            <li key={index} className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-semibold text-sm flex items-center justify-center mr-3 mt-0.5">
                    {index + 1}
                  </span>
                  <p className="text-foreground font-medium">
                    {accion.accion}
                  </p>
                </div>
                {accion.oportunidades_relacionadas && accion.oportunidades_relacionadas.length > 0 && (
                  <div className="ml-9 mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // TODO: Navegar a oportunidades filtradas
                        // router.push(`/opportunities?ids=${accion.oportunidades_relacionadas.join(',')}`)
                        console.log('Ver oportunidades relacionadas:', accion.oportunidades_relacionadas)
                        alert(`TODO: Ver ${accion.oportunidades_relacionadas.length} oportunidades relacionadas`)
                      }}
                    >
                      Ver oportunidades relacionadas ({accion.oportunidades_relacionadas.length})
                    </Button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      </Card>

      {/* Info adicional */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <strong>Nota:</strong> Este resumen es generado automáticamente por el Weekly Advisor Engine basándose en tu actividad de la semana. 
          Los datos se actualizan cada lunes o cuando regeneras el resumen manualmente.
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
          TODO: Conectar con Weekly Advisor Engine real para generar resúmenes dinámicos basados en datos reales.
        </p>
      </div>
    </div>
  )
}

