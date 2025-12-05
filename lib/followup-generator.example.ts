/**
 * Ejemplo de uso del Motor de Follow-ups de IntroEngine
 * 
 * Este archivo muestra cómo usar el generador para crear mensajes
 * de seguimiento suaves, educados y efectivos.
 */

import { generateFollowups, Opportunity } from './followup-generator'

// Ejemplo 1: Follow-up puente (3 días sin respuesta)
const exampleOpportunity1: Opportunity = {
  id: 'opp-1',
  company_id: 'company-1',
  company_name: 'RetailStore',
  target_contact_id: 'target-1',
  target_contact_name: 'Carlos Rodríguez',
  target_contact_role: 'CEO',
  bridge_contact_id: 'bridge-1',
  bridge_contact_name: 'María García',
  bridge_contact_role: 'Directora de RRHH',
  type: 'second_level',
  has_intro_request: true
}

// Ejemplo 2: Follow-up prospecto (7 días sin respuesta)
const exampleOpportunity2: Opportunity = {
  id: 'opp-2',
  company_id: 'company-2',
  company_name: 'TechStartup',
  target_contact_id: 'target-2',
  target_contact_name: 'Ana Martínez',
  target_contact_role: 'CTO',
  bridge_contact_id: null,
  type: 'direct',
  has_previous_conversation: true,
  status: 'in_progress'
}

// Ejemplo 3: Follow-up outbound frío (14 días sin respuesta)
const exampleOpportunity3: Opportunity = {
  id: 'opp-3',
  company_id: 'company-3',
  company_name: 'ServiciosPro',
  target_contact_id: 'target-3',
  target_contact_name: 'Juan Pérez',
  target_contact_role: 'Director de Operaciones',
  bridge_contact_id: null,
  type: null,
  is_cold_outbound: true
}

// Ejemplos de uso
export function example1() {
  const result = generateFollowups(exampleOpportunity1, 3)
  
  console.log('=== Ejemplo 1: Follow-up puente (3 días) ===')
  console.log('Bridge Contact:', result.followups.bridge_contact)
  console.log('\nProspect:', result.followups.prospect)
  console.log('\nOutbound:', result.followups.outbound)
  
  return result
}

export function example2() {
  const result = generateFollowups(exampleOpportunity2, 7)
  
  console.log('=== Ejemplo 2: Follow-up prospecto (7 días) ===')
  console.log('Bridge Contact:', result.followups.bridge_contact)
  console.log('\nProspect:', result.followups.prospect)
  console.log('\nOutbound:', result.followups.outbound)
  
  return result
}

export function example3() {
  const result = generateFollowups(exampleOpportunity3, 14)
  
  console.log('=== Ejemplo 3: Follow-up outbound frío (14 días) ===')
  console.log('Bridge Contact:', result.followups.bridge_contact)
  console.log('\nProspect:', result.followups.prospect)
  console.log('\nOutbound:', result.followups.outbound)
  
  return result
}

export function example4() {
  // Ejemplo con 30+ días (re-engagement)
  const result = generateFollowups(exampleOpportunity2, 35)
  
  console.log('=== Ejemplo 4: Re-engagement (35 días) ===')
  console.log('Bridge Contact:', result.followups.bridge_contact)
  console.log('\nProspect:', result.followups.prospect)
  console.log('\nOutbound:', result.followups.outbound)
  
  return result
}

/**
 * Ejemplo de llamada a la API
 * 
 * POST /api/generate-followups
 * Content-Type: application/json
 * 
 * {
 *   "opportunity_json": {
 *     "id": "opp-1",
 *     "company_id": "company-1",
 *     "company_name": "RetailStore",
 *     "target_contact_id": "target-1",
 *     "target_contact_name": "Carlos Rodríguez",
 *     "target_contact_role": "CEO",
 *     "bridge_contact_id": "bridge-1",
 *     "bridge_contact_name": "María García",
 *     "bridge_contact_role": "Directora de RRHH",
 *     "type": "second_level",
 *     "has_intro_request": true
 *   },
 *   "days_waiting": 7
 * }
 */
