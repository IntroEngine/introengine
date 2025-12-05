'use client'

import React, { useState, useMemo } from 'react'
import Card from '@/components/ui/Card'
import Select from '@/components/ui/Select'
import OpportunitiesTable from '@/components/opportunities/OpportunitiesTable'

interface Opportunity {
  id: number
  empresa: string
  tipo: 'intro' | 'outbound'
  lead_potential_score: number
  estado: 'suggested' | 'intro_requested' | 'in_progress' | 'won' | 'lost'
  tiene_puente: boolean
}

export default function OpportunitiesPage() {
  const [filters, setFilters] = useState({
    tipo: 'all',
    estado: 'all',
    scoreMinimo: '0',
  })

  // TODO: Fetch oportunidades desde API
  // const { data: opportunities } = await fetch('/api/opportunities')
  const allOpportunities: Opportunity[] = [
    {
      id: 1,
      empresa: 'TechCorp Solutions',
      tipo: 'intro',
      lead_potential_score: 95,
      estado: 'suggested',
      tiene_puente: true,
    },
    {
      id: 2,
      empresa: 'InnovateLab',
      tipo: 'outbound',
      lead_potential_score: 88,
      estado: 'intro_requested',
      tiene_puente: false,
    },
    {
      id: 3,
      empresa: 'DataFlow Inc',
      tipo: 'intro',
      lead_potential_score: 85,
      estado: 'in_progress',
      tiene_puente: true,
    },
    {
      id: 4,
      empresa: 'CloudScale',
      tipo: 'outbound',
      lead_potential_score: 82,
      estado: 'suggested',
      tiene_puente: false,
    },
    {
      id: 5,
      empresa: 'StartupHub',
      tipo: 'intro',
      lead_potential_score: 80,
      estado: 'won',
      tiene_puente: true,
    },
    {
      id: 6,
      empresa: 'Analytics Pro',
      tipo: 'outbound',
      lead_potential_score: 75,
      estado: 'suggested',
      tiene_puente: false,
    },
    {
      id: 7,
      empresa: 'Digital Solutions',
      tipo: 'intro',
      lead_potential_score: 72,
      estado: 'lost',
      tiene_puente: true,
    },
    {
      id: 8,
      empresa: 'TechStart',
      tipo: 'outbound',
      lead_potential_score: 68,
      estado: 'in_progress',
      tiene_puente: false,
    },
  ]

  const tipoOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'intro', label: 'Intro' },
    { value: 'outbound', label: 'Outbound' },
  ]

  const estadoOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'suggested', label: 'Sugerida' },
    { value: 'intro_requested', label: 'Intro pedida' },
    { value: 'in_progress', label: 'En proceso' },
    { value: 'won', label: 'Ganada' },
    { value: 'lost', label: 'Perdida' },
  ]

  const scoreOptions = [
    { value: '0', label: 'Sin mínimo' },
    { value: '50', label: '50+' },
    { value: '70', label: '70+' },
    { value: '85', label: '85+' },
  ]

  const filteredOpportunities = useMemo(() => {
    return allOpportunities.filter((opp) => {
      if (filters.tipo !== 'all' && opp.tipo !== filters.tipo) {
        return false
      }
      if (filters.estado !== 'all' && opp.estado !== filters.estado) {
        return false
      }
      if (parseInt(filters.scoreMinimo) > opp.lead_potential_score) {
        return false
      }
      return true
    })
  }, [filters])

  const handleFilterChange = (name: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Oportunidades
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gestiona y prioriza tus oportunidades de negocio
        </p>
      </div>

      {/* Filtros */}
      <Card title="Filtros" bordered>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Tipo"
            name="tipo"
            value={filters.tipo}
            onChange={(e) => handleFilterChange('tipo', e.target.value)}
            options={tipoOptions}
          />

          <Select
            label="Estado"
            name="estado"
            value={filters.estado}
            onChange={(e) => handleFilterChange('estado', e.target.value)}
            options={estadoOptions}
          />

          <Select
            label="Score mínimo"
            name="scoreMinimo"
            value={filters.scoreMinimo}
            onChange={(e) => handleFilterChange('scoreMinimo', e.target.value)}
            options={scoreOptions}
          />
        </div>
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          Mostrando {filteredOpportunities.length} de {allOpportunities.length} oportunidades
        </div>
      </Card>

      {/* Tabla de oportunidades */}
      <Card bordered>
        <OpportunitiesTable opportunities={filteredOpportunities} />
      </Card>
    </div>
  )
}

