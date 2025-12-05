/**
 * Ejemplo de uso del Motor de Outbound Inteligente de IntroEngine
 * 
 * Este archivo muestra cómo usar el generador para crear mensajes
 * outbound personalizados cuando NO existe un puente posible.
 */

import { generateOutbound, Company, Role, BuyingSignal } from './outbound-generator'

// Ejemplo 1: Empresa pequeña con señal de contratación
const exampleCompany1: Company = {
  id: 'company-1',
  name: 'TechStartup',
  industry: 'Technology',
  size_bucket: 'small',
  domain: 'techstartup.com'
}

const exampleRole1: Role = {
  title: 'CEO',
  seniority: 'c-level'
}

const exampleSignals1: BuyingSignal[] = [
  {
    type: 'hiring',
    description: 'Publicaron 3 ofertas de trabajo en LinkedIn',
    strength: 'high'
  },
  {
    type: 'growth',
    description: 'Aumentaron el equipo en 50% este año',
    strength: 'medium'
  }
]

// Ejemplo 2: Empresa con problemas operativos
const exampleCompany2: Company = {
  id: 'company-2',
  name: 'RetailCo',
  industry: 'Retail',
  size_bucket: 'small',
  domain: 'retailco.com'
}

const exampleRole2: Role = {
  title: 'Responsable de RRHH',
  seniority: 'manager'
}

const exampleSignals2: BuyingSignal[] = [
  {
    type: 'operational_chaos',
    description: 'Múltiples quejas sobre gestión de horarios',
    strength: 'high'
  },
  {
    type: 'manual_processes',
    description: 'Usan hojas de cálculo para control horario',
    strength: 'medium'
  },
  {
    type: 'hr_shortage',
    description: 'Solo tienen 1 persona en RRHH para 30 empleados',
    strength: 'high'
  }
]

// Ejemplo 3: Empresa sin señales específicas
const exampleCompany3: Company = {
  id: 'company-3',
  name: 'ServiciosPro',
  industry: 'Servicios',
  size_bucket: 'startup',
  domain: 'serviciospro.com'
}

const exampleRole3: Role = {
  title: 'Director de Operaciones',
  seniority: 'director'
}

const exampleSignals3: BuyingSignal[] = []

// Ejemplos de uso
export function example1() {
  const result = generateOutbound(exampleCompany1, exampleRole1, exampleSignals1)
  
  console.log('=== Ejemplo 1: CEO con señal de contratación ===')
  console.log('Short:', result.outbound.short)
  console.log('\nLong:', result.outbound.long)
  console.log('\nCTA:', result.outbound.cta)
  console.log('\nReason Now:', result.outbound.reason_now)
  console.log('\nLead Potential Score:', result.score.lead_potential_score)
  
  return result
}

export function example2() {
  const result = generateOutbound(exampleCompany2, exampleRole2, exampleSignals2)
  
  console.log('=== Ejemplo 2: RRHH con problemas operativos ===')
  console.log('Short:', result.outbound.short)
  console.log('\nLong:', result.outbound.long)
  console.log('\nCTA:', result.outbound.cta)
  console.log('\nReason Now:', result.outbound.reason_now)
  console.log('\nLead Potential Score:', result.score.lead_potential_score)
  
  return result
}

export function example3() {
  const result = generateOutbound(exampleCompany3, exampleRole3, exampleSignals3)
  
  console.log('=== Ejemplo 3: Sin señales específicas ===')
  console.log('Short:', result.outbound.short)
  console.log('\nLong:', result.outbound.long)
  console.log('\nCTA:', result.outbound.cta)
  console.log('\nReason Now:', result.outbound.reason_now)
  console.log('\nLead Potential Score:', result.score.lead_potential_score)
  
  return result
}

/**
 * Ejemplo de llamada a la API
 * 
 * POST /api/generate-outbound
 * Content-Type: application/json
 * 
 * {
 *   "company_json": {
 *     "id": "company-1",
 *     "name": "TechStartup",
 *     "industry": "Technology",
 *     "size_bucket": "small",
 *     "domain": "techstartup.com"
 *   },
 *   "role": {
 *     "title": "CEO",
 *     "seniority": "c-level"
 *   },
 *   "signals_json": [
 *     {
 *       "type": "hiring",
 *       "description": "Publicaron 3 ofertas de trabajo",
 *       "strength": "high"
 *     }
 *   ]
 * }
 * 
 * O con role como string:
 * {
 *   "company_json": {...},
 *   "role": "CEO",
 *   "signals_json": [...]
 * }
 */
