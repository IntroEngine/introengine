'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Select from '@/components/ui/Select'

interface PageProps {
  params: {
    id: string
  }
}

export default function OpportunityDetailPage({ params }: PageProps) {
  // TODO: Fetch oportunidad desde API
  // const { data: opportunity } = await fetch(`/api/opportunities/${params.id}`)
  
  // Mock data - en producción vendría de la API
  const opportunity = {
    id: parseInt(params.id),
    empresa: 'TechCorp Solutions',
    empresa_url: 'https://techcorp.com',
    tipo: 'intro' as 'intro' | 'outbound',
    estado: 'suggested' as 'suggested' | 'intro_requested' | 'in_progress' | 'won' | 'lost',
    lead_potential_score: 95,
    industry_fit: 90,
    buying_signals: 95,
    intro_strength: 100,
    contacto_objetivo: {
      nombre: 'Juan Pérez',
      email: 'juan.perez@techcorp.com',
      rol: 'CEO',
    },
    contacto_puente: {
      nombre: 'María García',
      email: 'maria.garcia@innovatelab.io',
      rol: 'CTO',
      empresa: 'InnovateLab',
    },
    mensaje_intro: `Hola María,

¿Cómo estás? Espero que todo vaya bien.

Te escribo porque estoy buscando conectar con Juan Pérez, CEO de TechCorp Solutions. Veo que tienes una conexión con él y pensé que podrías ayudarme a presentarme.

Estamos trabajando en soluciones que creo que podrían ser muy relevantes para TechCorp. ¿Te parece que podrías hacer una introducción?

¡Gracias de antemano!`,
    mensaje_outbound: `Hola Juan,

Espero que este mensaje te encuentre bien.

Soy [Tu nombre] y trabajo en [Tu empresa]. Hemos estado ayudando a empresas como TechCorp a [beneficio clave] y pensé que podría ser relevante para vosotros.

¿Te parece bien si coordinamos una breve llamada para ver si tiene sentido explorar cómo podríamos trabajar juntos?

Saludos,`,
  }

  type EstadoType = 'suggested' | 'intro_requested' | 'in_progress' | 'won' | 'lost'
  const [estado, setEstado] = useState<EstadoType>(opportunity.estado)
  const [copied, setCopied] = useState(false)

  if (!opportunity) {
    notFound()
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

  const tipoLabels: Record<string, string> = {
    intro: 'Intro',
    outbound: 'Outbound',
  }

  const tipoVariants: Record<string, 'success' | 'info'> = {
    intro: 'success',
    outbound: 'info',
  }

  const estadoOptions = [
    { value: 'suggested', label: 'Sugerida' },
    { value: 'intro_requested', label: 'Intro pedida' },
    { value: 'in_progress', label: 'En proceso' },
    { value: 'won', label: 'Ganada' },
    { value: 'lost', label: 'Perdida' },
  ]

  const handleCopyMessage = () => {
    const mensaje = opportunity.tipo === 'intro' 
      ? opportunity.mensaje_intro 
      : opportunity.mensaje_outbound
    
    navigator.clipboard.writeText(mensaje)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleEstadoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newEstado = e.target.value as EstadoType
    setEstado(newEstado)
    
    // TODO: Conectar con API para actualizar estado
    // await fetch(`/api/opportunities/${params.id}`, {
    //   method: 'PATCH',
    //   body: JSON.stringify({ estado: newEstado }),
    // })
    console.log('Cambiar estado a:', newEstado)
  }

  const handleAction = (action: string) => {
    // TODO: Conectar con API para acciones
    // await fetch(`/api/opportunities/${params.id}/actions`, {
    //   method: 'POST',
    //   body: JSON.stringify({ action }),
    // })
    console.log('Acción:', action)
    alert(`TODO: Implementar acción "${action}" con API`)
  }

  const mensajeActual = opportunity.tipo === 'intro' 
    ? opportunity.mensaje_intro 
    : opportunity.mensaje_outbound

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/opportunities">
            <Button variant="ghost" size="sm" className="mb-4">
              ← Volver a oportunidades
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {opportunity.empresa}
          </h1>
          <div className="flex items-center space-x-3">
            <Badge variant={tipoVariants[opportunity.tipo] || 'default'}>
              {tipoLabels[opportunity.tipo] || opportunity.tipo}
            </Badge>
            <Badge variant={estadoVariants[opportunity.estado] || 'default'}>
              {estadoLabels[opportunity.estado] || opportunity.estado}
            </Badge>
          </div>
        </div>
      </div>

      {/* Información principal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Score breakdown */}
        <Card title="Score breakdown" bordered>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Industry Fit</div>
              <div className="text-2xl font-bold text-foreground">{opportunity.industry_fit}</div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Buying Signals</div>
              <div className="text-2xl font-bold text-foreground">{opportunity.buying_signals}</div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Intro Strength</div>
              <div className="text-2xl font-bold text-foreground">{opportunity.intro_strength}</div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Lead Potential</div>
              <div className="text-2xl font-bold text-primary-600">{opportunity.lead_potential_score}</div>
            </div>
          </div>
        </Card>

        {/* Contactos */}
        <Card title="Contactos" bordered>
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Contacto objetivo
              </div>
              <div className="text-foreground font-medium">{opportunity.contacto_objetivo.nombre}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{opportunity.contacto_objetivo.rol}</div>
              <a
                href={`mailto:${opportunity.contacto_objetivo.email}`}
                className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
              >
                {opportunity.contacto_objetivo.email}
              </a>
            </div>
            {opportunity.contacto_puente && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Contacto puente
                </div>
                <div className="text-foreground font-medium">{opportunity.contacto_puente.nombre}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {opportunity.contacto_puente.rol} en {opportunity.contacto_puente.empresa}
                </div>
                <a
                  href={`mailto:${opportunity.contacto_puente.email}`}
                  className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
                >
                  {opportunity.contacto_puente.email}
                </a>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Estado y acciones */}
      <Card title="Estado y acciones" bordered>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Cambiar estado
            </label>
            <Select
              name="estado"
              value={estado}
              onChange={handleEstadoChange}
              options={estadoOptions}
              className="max-w-xs"
            />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              TODO: Conectar cambio de estado con API
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {opportunity.tipo === 'intro' && opportunity.estado === 'suggested' && (
              <Button
                variant="primary"
                onClick={() => handleAction('marcar_intro_pedida')}
              >
                Marcar intro pedida
              </Button>
            )}
            {opportunity.estado === 'suggested' && (
              <Button
                variant="secondary"
                onClick={() => handleAction('marcar_en_progreso')}
              >
                Marcar en progreso
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Mensaje sugerido */}
      <Card 
        title={opportunity.tipo === 'intro' ? 'Mensaje para pedir intro' : 'Mensaje outbound sugerido'} 
        bordered
      >
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 whitespace-pre-wrap text-sm text-foreground font-mono">
            {mensajeActual}
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="primary"
              onClick={handleCopyMessage}
            >
              {copied ? '✓ Copiado' : 'Copiar mensaje'}
            </Button>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              El mensaje ha sido copiado al portapapeles
            </p>
          </div>
        </div>
      </Card>

      {/* Información adicional */}
      <Card title="Información adicional" bordered>
        <dl className="space-y-3">
          <div className="flex justify-between">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Empresa</dt>
            <dd className="text-sm text-foreground">
              <a
                href={opportunity.empresa_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 dark:text-primary-400"
              >
                {opportunity.empresa}
              </a>
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Score total</dt>
            <dd className="text-sm font-bold text-foreground">{opportunity.lead_potential_score}</dd>
          </div>
        </dl>
      </Card>
    </div>
  )
}

