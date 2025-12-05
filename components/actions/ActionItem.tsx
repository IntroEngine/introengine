'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'

interface ActionItemProps {
  id: number
  tipo: 'bridge' | 'prospect' | 'outbound'
  empresa: string
  contacto: string
  diasSinActividad: number
  mensajeSugerido: string
  oportunidadId: number
}

const ActionItem: React.FC<ActionItemProps> = ({
  tipo,
  empresa,
  contacto,
  diasSinActividad,
  mensajeSugerido,
  oportunidadId,
}) => {
  const [copied, setCopied] = useState(false)

  const tipoLabels: Record<string, string> = {
    bridge: 'Puente',
    prospect: 'Prospecto',
    outbound: 'Outbound',
  }

  const tipoVariants: Record<string, 'success' | 'warning' | 'info' | 'default'> = {
    bridge: 'info',
    prospect: 'success',
    outbound: 'warning',
  }

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(mensajeSugerido)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getDiasColor = (dias: number) => {
    if (dias >= 14) return 'text-error-600 dark:text-error-400'
    if (dias >= 7) return 'text-warning-600 dark:text-warning-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  return (
    <Card hover bordered className="mb-4">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        {/* Información principal */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant={tipoVariants[tipo] || 'default'}>
              {tipoLabels[tipo] || tipo}
            </Badge>
            <h3 className="text-lg font-semibold text-foreground">
              {empresa}
            </h3>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Contacto: </span>
                <span className="text-foreground font-medium">{contacto}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Días sin actividad: </span>
                <span className={`font-medium ${getDiasColor(diasSinActividad)}`}>
                  {diasSinActividad} días
                </span>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Mensaje sugerido:
              </p>
              <p className="text-sm text-foreground line-clamp-2">
                {mensajeSugerido}
              </p>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex flex-col gap-2 md:min-w-[200px]">
          <Button
            variant="primary"
            size="sm"
            onClick={handleCopyMessage}
            className="w-full md:w-auto"
          >
            {copied ? '✓ Copiado' : 'Copiar mensaje'}
          </Button>
          <Link href={`/opportunities/${oportunidadId}`}>
            <Button
              variant="secondary"
              size="sm"
              className="w-full md:w-auto"
            >
              Ir a oportunidad
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  )
}

export default ActionItem

