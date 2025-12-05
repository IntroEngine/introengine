/**
 * Ejemplo de uso del Sistema de Scoring Comercial de IntroEngine
 * 
 * Este archivo muestra cómo usar el sistema para calcular scores
 * comerciales y evaluar el potencial de leads.
 */

import { calculateCommercialScores, Company, Contact, Opportunity } from './commercial-scoring'

// Ejemplo 1: Lead de alto potencial
const exampleCompany1: Company = {
  id: 'company-1',
  name: 'RetailStore',
  industry: 'Retail',
  size_bucket: 'small',
  domain: 'retailstore.com'
}

const exampleContacts1: Contact[] = [
  {
    id: 'bridge-1',
    full_name: 'María García',
    email: 'maria@retailstore.com',
    company_id: 'company-1',
    role_title: 'Directora de RRHH',
    seniority: 'director',
    connections: ['target-1', 'user-1', 'contact-2', 'contact-3', 'contact-4', 'contact-5']
  }
]

const exampleOpportunity1: Opportunity = {
  id: 'opp-1',
  company_id: 'company-1',
  target_contact_id: 'target-1',
  type: 'second_level',
  bridge_contact_id: 'bridge-1',
  confidence: 85,
  buying_signals: [
    {
      type: 'hiring',
      description: 'Publicaron 5 ofertas de trabajo',
      strength: 'high'
    },
    {
      type: 'hr_shortage',
      description: 'Solo tienen 1 persona en RRHH para 25 empleados',
      strength: 'high'
    },
    {
      type: 'manual_processes',
      description: 'Usan Excel para control horario',
      strength: 'medium'
    }
  ]
}

// Ejemplo 2: Lead con potencial moderado
const exampleCompany2: Company = {
  id: 'company-2',
  name: 'TechStartup',
  industry: 'Technology',
  size_bucket: 'startup',
  domain: 'techstartup.com'
}

const exampleContacts2: Contact[] = [
  {
    id: 'bridge-2',
    full_name: 'Juan Pérez',
    email: 'juan@techstartup.com',
    company_id: 'company-2',
    role_title: 'CEO',
    seniority: 'c-level',
    connections: ['target-2']
  }
]

const exampleOpportunity2: Opportunity = {
  id: 'opp-2',
  company_id: 'company-2',
  target_contact_id: 'target-2',
  type: 'second_level',
  bridge_contact_id: 'bridge-2',
  confidence: 70,
  buying_signals: [
    {
      type: 'growth',
      description: 'Crecieron 30% este año',
      strength: 'medium'
    }
  ]
}

// Ejemplo 3: Lead con potencial limitado (sin puente)
const exampleCompany3: Company = {
  id: 'company-3',
  name: 'BigCorp',
  industry: 'Finance',
  size_bucket: 'large',
  domain: 'bigcorp.com'
}

const exampleContacts3: Contact[] = []

const exampleOpportunity3: Opportunity = {
  id: 'opp-3',
  company_id: 'company-3',
  target_contact_id: 'target-3',
  type: 'inferred',
  bridge_contact_id: null,
  confidence: 35,
  buying_signals: []
}

// Ejemplos de uso
export function example1() {
  const result = calculateCommercialScores(
    exampleCompany1,
    exampleContacts1,
    exampleOpportunity1
  )
  
  console.log('=== Ejemplo 1: Lead de alto potencial ===')
  console.log('Industry Fit Score:', result.scores.industry_fit_score)
  console.log('Buying Signal Score:', result.scores.buying_signal_score)
  console.log('Intro Strength Score:', result.scores.intro_strength_score)
  console.log('Lead Potential Score:', result.scores.lead_potential_score)
  console.log('\nExplicación:', result.explanation)
  
  return result
}

export function example2() {
  const result = calculateCommercialScores(
    exampleCompany2,
    exampleContacts2,
    exampleOpportunity2
  )
  
  console.log('=== Ejemplo 2: Lead con potencial moderado ===')
  console.log('Industry Fit Score:', result.scores.industry_fit_score)
  console.log('Buying Signal Score:', result.scores.buying_signal_score)
  console.log('Intro Strength Score:', result.scores.intro_strength_score)
  console.log('Lead Potential Score:', result.scores.lead_potential_score)
  console.log('\nExplicación:', result.explanation)
  
  return result
}

export function example3() {
  const result = calculateCommercialScores(
    exampleCompany3,
    exampleContacts3,
    exampleOpportunity3
  )
  
  console.log('=== Ejemplo 3: Lead con potencial limitado ===')
  console.log('Industry Fit Score:', result.scores.industry_fit_score)
  console.log('Buying Signal Score:', result.scores.buying_signal_score)
  console.log('Intro Strength Score:', result.scores.intro_strength_score)
  console.log('Lead Potential Score:', result.scores.lead_potential_score)
  console.log('\nExplicación:', result.explanation)
  
  return result
}

/**
 * Ejemplo de llamada a la API
 * 
 * POST /api/calculate-scores
 * Content-Type: application/json
 * 
 * {
 *   "company_json": {
 *     "id": "company-1",
 *     "name": "RetailStore",
 *     "industry": "Retail",
 *     "size_bucket": "small",
 *     "domain": "retailstore.com"
 *   },
 *   "contacts_json": [
 *     {
 *       "id": "bridge-1",
 *       "full_name": "María García",
 *       "role_title": "Directora de RRHH",
 *       "seniority": "director",
 *       "connections": ["target-1"]
 *     }
 *   ],
 *   "opportunity_json": {
 *     "id": "opp-1",
 *     "company_id": "company-1",
 *     "target_contact_id": "target-1",
 *     "type": "second_level",
 *     "bridge_contact_id": "bridge-1",
 *     "confidence": 85,
 *     "buying_signals": [
 *       {
 *         "type": "hiring",
 *         "description": "Publicaron 5 ofertas de trabajo",
 *         "strength": "high"
 *       },
 *       {
 *         "type": "hr_shortage",
 *         "description": "Solo tienen 1 persona en RRHH",
 *         "strength": "high"
 *       }
 *     ]
 *   }
 * }
 */
