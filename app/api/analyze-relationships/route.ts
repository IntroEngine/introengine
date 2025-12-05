import { NextResponse } from 'next/server'
import { analyzeRelationships, Contact, TargetContact, Company, AnalysisResult } from '@/lib/relationship-detector'

/**
 * POST /api/analyze-relationships
 * 
 * Analiza relaciones entre contactos del usuario y contactos objetivo.
 * 
 * Body esperado:
 * {
 *   contacts_json: Contact[],
 *   target_contacts_json: TargetContact[],
 *   companies_json: Company[]
 * }
 * 
 * Retorna:
 * {
 *   opportunities: Opportunity[]
 * }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    // Extraer datos del body
    const { contacts_json, target_contacts_json, companies_json } = body
    
    // Validar que los datos requeridos estén presentes
    if (!contacts_json || !Array.isArray(contacts_json)) {
      return NextResponse.json(
        { error: 'contacts_json es requerido y debe ser un array' },
        { status: 400 }
      )
    }
    
    if (!target_contacts_json || !Array.isArray(target_contacts_json)) {
      return NextResponse.json(
        { error: 'target_contacts_json es requerido y debe ser un array' },
        { status: 400 }
      )
    }
    
    if (!companies_json || !Array.isArray(companies_json)) {
      return NextResponse.json(
        { error: 'companies_json es requerido y debe ser un array' },
        { status: 400 }
      )
    }
    
    // Validar estructura mínima de contactos
    const userContacts: Contact[] = contacts_json.map((c: any) => ({
      id: c.id || '',
      full_name: c.full_name || '',
      email: c.email || null,
      company_id: c.company_id || null,
      company_name: c.company_name || null,
      role_title: c.role_title || null,
      seniority: c.seniority || null,
      previous_companies: c.previous_companies || null,
      previous_roles: c.previous_roles || null,
      linkedin_url: c.linkedin_url || null,
      connections: c.connections || null,
      interactions: c.interactions || null
    }))
    
    // Validar estructura mínima de contactos objetivo
    const targetContacts: TargetContact[] = target_contacts_json.map((t: any) => {
      if (!t.id || !t.full_name || !t.role_title || !t.seniority || !t.company_id) {
        throw new Error('Los contactos objetivo deben tener: id, full_name, role_title, seniority, company_id')
      }
      return {
        id: t.id,
        full_name: t.full_name,
        role_title: t.role_title,
        seniority: t.seniority,
        company_id: t.company_id,
        email: t.email || null,
        previous_companies: t.previous_companies || null,
        previous_roles: t.previous_roles || null,
        linkedin_url: t.linkedin_url || null,
        connections: t.connections || null
      }
    })
    
    // Validar estructura mínima de empresas
    const companies: Company[] = companies_json.map((c: any) => ({
      id: c.id || '',
      name: c.name || '',
      domain: c.domain || null,
      industry: c.industry || null
    }))
    
    // Ejecutar análisis
    const result: AnalysisResult = analyzeRelationships(
      userContacts,
      targetContacts,
      companies
    )
    
    // Retornar resultado en formato JSON estricto
    return NextResponse.json(result, { status: 200 })
    
  } catch (error) {
    // Manejar errores de validación
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    // Manejar errores de JSON parsing
    if (error instanceof SyntaxError || error instanceof TypeError) {
      return NextResponse.json(
        { error: 'Invalid request body. Se espera JSON válido.' },
        { status: 400 }
      )
    }
    
    // Manejar otros errores
    console.error('Error inesperado en /api/analyze-relationships:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor al analizar relaciones' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/analyze-relationships
 * 
 * Endpoint informativo sobre el uso del motor de detección
 */
export async function GET() {
  return NextResponse.json({
    message: 'Motor de detección de relaciones de IntroEngine',
    usage: {
      method: 'POST',
      endpoint: '/api/analyze-relationships',
      body: {
        contacts_json: 'Array de contactos del usuario',
        target_contacts_json: 'Array de contactos objetivo',
        companies_json: 'Array de empresas'
      },
      response: {
        opportunities: 'Array de oportunidades detectadas con rutas de conexión'
      }
    },
    route_types: {
      direct: 'El usuario conoce directamente al contacto objetivo',
      second_level: 'El usuario conoce a alguien que conoce al objetivo',
      inferred: 'La IA deduce relación probable basada en patrones'
    }
  }, { status: 200 })
}
