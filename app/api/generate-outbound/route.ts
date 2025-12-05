import { NextResponse } from 'next/server'
import { generateOutbound, Company, Role, BuyingSignal, OutboundResult } from '@/lib/outbound-generator'

/**
 * POST /api/generate-outbound
 * 
 * Genera mensajes outbound personalizados cuando NO existe un puente posible.
 * 
 * Body esperado:
 * {
 *   company_json: Company,
 *   role: Role | string,
 *   signals_json: BuyingSignal[]
 * }
 * 
 * Retorna:
 * {
 *   outbound: {
 *     short: string,
 *     long: string,
 *     cta: string,
 *     reason_now: string
 *   },
 *   score: {
 *     lead_potential_score: number
 *   }
 * }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    // Extraer datos del body
    const { company_json, role, signals_json } = body
    
    // Validar que los datos requeridos estén presentes
    if (!company_json) {
      return NextResponse.json(
        { error: 'company_json es requerido' },
        { status: 400 }
      )
    }
    
    if (!role) {
      return NextResponse.json(
        { error: 'role es requerido' },
        { status: 400 }
      )
    }
    
    // Validar y normalizar empresa
    const company: Company = {
      id: company_json.id || '',
      name: company_json.name || '',
      industry: company_json.industry || null,
      size_bucket: company_json.size_bucket || null,
      domain: company_json.domain || null,
      website: company_json.website || null
    }
    
    if (!company.name) {
      return NextResponse.json(
        { error: 'company_json debe tener al menos un nombre (name)' },
        { status: 400 }
      )
    }
    
    // Validar y normalizar rol
    let normalizedRole: Role
    if (typeof role === 'string') {
      normalizedRole = {
        title: role,
        seniority: null
      }
    } else {
      normalizedRole = {
        title: role.title || '',
        seniority: role.seniority || null
      }
    }
    
    if (!normalizedRole.title) {
      return NextResponse.json(
        { error: 'role debe tener al menos un título (title)' },
        { status: 400 }
      )
    }
    
    // Validar y normalizar señales
    let signals: BuyingSignal[] = []
    if (signals_json) {
      if (!Array.isArray(signals_json)) {
        return NextResponse.json(
          { error: 'signals_json debe ser un array' },
          { status: 400 }
        )
      }
      
      signals = signals_json.map((s: any) => ({
        type: s.type || 'manual_processes',
        description: s.description || null,
        strength: s.strength || 'medium'
      }))
    }
    
    // Generar outbound
    const result: OutboundResult = generateOutbound(company, normalizedRole, signals)
    
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
    console.error('Error inesperado en /api/generate-outbound:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor al generar outbound' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/generate-outbound
 * 
 * Endpoint informativo sobre el uso del generador de outbound
 */
export async function GET() {
  return NextResponse.json({
    message: 'Motor de outbound inteligente de IntroEngine',
    usage: {
      method: 'POST',
      endpoint: '/api/generate-outbound',
      body: {
        company_json: 'Objeto Company con id, name, industry, size_bucket, etc.',
        role: 'Objeto Role con title y seniority, o string con el título del rol',
        signals_json: 'Array de BuyingSignal con type, description, strength'
      },
      response: {
        outbound: {
          short: 'Mensaje corto de 2-3 líneas',
          long: 'Mensaje detallado de 4-6 líneas',
          cta: 'Call to action suave',
          reason_now: 'Razón por la cual es el momento adecuado'
        },
        score: {
          lead_potential_score: 'Score de 0-100 indicando potencial del lead'
        }
      }
    },
    buying_signal_types: {
      hiring: 'La empresa está contratando',
      growth: 'La empresa está creciendo',
      operational_chaos: 'Caos operativo detectado',
      hr_shortage: 'Falta de recursos en RRHH',
      expansion: 'La empresa se está expandiendo',
      compliance_issues: 'Problemas de cumplimiento',
      manual_processes: 'Procesos manuales detectados'
    },
    signal_strengths: ['low', 'medium', 'high'],
    pitch_base: 'Witar ayuda a empresas pequeñas a gestionar control horario, vacaciones y documentos laborales sin complicarse.'
  }, { status: 200 })
}
