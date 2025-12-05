/**
 * Ejemplo de uso del Motor de Detección de Relaciones de IntroEngine
 * 
 * Este archivo muestra cómo usar el motor para analizar relaciones
 * entre contactos del usuario y contactos objetivo.
 */

import { analyzeRelationships, Contact, TargetContact, Company } from './relationship-detector'

// Ejemplo de datos de entrada
const exampleUserContacts: Contact[] = [
  {
    id: 'user-contact-1',
    full_name: 'Juan Pérez',
    email: 'juan.perez@example.com',
    company_id: 'company-1',
    company_name: 'TechCorp',
    role_title: 'Director de Ventas',
    seniority: 'director',
    previous_companies: ['company-2', 'company-3'],
    connections: ['target-contact-1', 'bridge-contact-1']
  },
  {
    id: 'bridge-contact-1',
    full_name: 'María García',
    email: 'maria.garcia@example.com',
    company_id: 'target-company-1',
    company_name: 'TargetCorp',
    role_title: 'VP de Marketing',
    seniority: 'vp',
    previous_companies: ['company-2'],
    connections: ['target-contact-1']
  }
]

const exampleTargetContacts: TargetContact[] = [
  {
    id: 'target-contact-1',
    full_name: 'Carlos Rodríguez',
    role_title: 'CEO',
    seniority: 'c-level',
    company_id: 'target-company-1',
    email: 'carlos.rodriguez@targetcorp.com',
    previous_companies: ['company-2'],
    connections: ['bridge-contact-1']
  },
  {
    id: 'target-contact-2',
    full_name: 'Ana Martínez',
    role_title: 'CTO',
    seniority: 'c-level',
    company_id: 'target-company-2',
    email: 'ana.martinez@othercorp.com',
    previous_companies: ['company-1']
  }
]

const exampleCompanies: Company[] = [
  {
    id: 'company-1',
    name: 'TechCorp',
    domain: 'techcorp.com',
    industry: 'Technology'
  },
  {
    id: 'target-company-1',
    name: 'TargetCorp',
    domain: 'targetcorp.com',
    industry: 'Technology'
  },
  {
    id: 'target-company-2',
    name: 'OtherCorp',
    domain: 'othercorp.com',
    industry: 'Finance'
  },
  {
    id: 'company-2',
    name: 'SharedCorp',
    domain: 'sharedcorp.com',
    industry: 'Technology'
  }
]

// Ejemplo de uso
export function exampleUsage() {
  const result = analyzeRelationships(
    exampleUserContacts,
    exampleTargetContacts,
    exampleCompanies
  )
  
  console.log('Oportunidades detectadas:', JSON.stringify(result, null, 2))
  
  return result
}

/**
 * Ejemplo de llamada a la API
 * 
 * POST /api/analyze-relationships
 * Content-Type: application/json
 * 
 * {
 *   "contacts_json": [...],
 *   "target_contacts_json": [...],
 *   "companies_json": [...]
 * }
 */
