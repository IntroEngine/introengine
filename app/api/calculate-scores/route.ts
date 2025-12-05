import { NextResponse } from 'next/server'
import { calculateCommercialScores, Company, Contact, Opportunity, ScoringResult } from '@/lib/commercial-scoring'

/**
 * POST /api/calculate-scores
 * 
 * Calcula 4 scores comerciales para evaluar el potencial de un lead.
 * 
 * Body esperado:
 * {
 *   company_json: Company,
 *   contacts_json: Contact[],
 *   opportunity_json: Opportunity
 * }
 * 
 * Retorna:
 * {
 *   scores: {
 *     industry_fit_score: number,
 *     buying_signal_score: number,
 *     intro_strength_score: number,
 *     lead_potential_score: number
 *   },
 *   explanation: string
 * }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    // Extraer datos del body
    const { company_json, contacts_json, opportunity_json } = body
    
    // Validar que los datos requeridos estén presentes
    if (!company_json) {
      return NextResponse.json(
        { error: 'company_json es requerido' },
        { status: 400 }
      )
    }
    
    if (!opportunity_json) {
      return NextResponse.json(
        { error: 'opportunity_json es requerido' },
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
    
    // Validar y normalizar contactos
    let contacts: Contact[] = []
    if (contacts_json) {
      if (!Array.isArray(contacts_json)) {
        return NextResponse.json(
          { error: 'contacts_json debe ser un array' },
          { status: 400 }
        )
      }
      
      contacts = contacts_json.map((c: any) => ({
        id: c.id || '',
        full_name: c.full_name || '',
        email: c.email || null,
        company_id: c.company_id || null,
        role_title: c.role_title || null,
        seniority: c.seniority || null,
        connections: c.connections || null
      }))
    }
    
    // Validar y normalizar oportunidad
    const opportunity: Opportunity = {
      id: opportunity_json.id || null,
      company_id: opportunity_json.company_id || company.id,
      target_contact_id: opportunity_json.target_contact_id || null,
      type: opportunity_json.type || null,
      bridge_contact_id: opportunity_json.bridge_contact_id || null,
      confidence: opportunity_json.confidence !== undefined ? opportunity_json.confidence : null,
      buying_signals: opportunity_json.buying_signals || null
    }
    
    // Validar que opportunity tenga company_id
    if (!opportunity.company_id) {
      return NextResponse.json(
        { error: 'opportunity_json debe tener company_id' },
        { status: 400 }
      )
    }
    
    // Calcular scores
    const result: ScoringResult = calculateCommercialScores(
      company,
      contacts,
      opportunity
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
    console.error('Error inesperado en /api/calculate-scores:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor al calcular scores' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/calculate-scores
 * 
 * Endpoint informativo sobre el uso del sistema de scoring
 */
export async function GET() {
  return NextResponse.json({
    message: 'Sistema de scoring comercial avanzado de IntroEngine',
    usage: {
      method: 'POST',
      endpoint: '/api/calculate-scores',
      body: {
        company_json: 'Objeto Company con id, name, industry, size_bucket, etc.',
        contacts_json: 'Array de Contact (opcional, necesario para intro_strength_score)',
        opportunity_json: 'Objeto Opportunity con company_id, type, bridge_contact_id, confidence, buying_signals'
      },
      response: {
        scores: {
          industry_fit_score: 'Score 0-100: Qué tan bien encaja la empresa con SaaS de RRHH para pymes',
          buying_signal_score: 'Score 0-100: Señales de intención de compra',
          intro_strength_score: 'Score 0-100: Calidad del puente entre usuario y objetivo',
          lead_potential_score: 'Score 0-100: Valor total del lead (combinación ponderada)'
        },
        explanation: 'Explicación breve de 2-3 líneas sobre el scoring'
      }
    },
    scoring_details: {
      industry_fit_score: {
        factors: [
          'Tamaño de empresa (startup/small = mejor)',
          'Industria (retail, servicios, manufactura = mejor)',
          'Necesidad de control horario'
        ]
      },
      buying_signal_score: {
        factors: [
          'Señales de contratación',
          'Crecimiento del equipo',
          'Dolores operativos',
          'Caos administrativo',
          'Ausencia de RRHH interno',
          'Procesos manuales'
        ],
        weights: {
          'hr_shortage': 'Alto (30 puntos)',
          'hiring': 'Alto (25 puntos)',
          'compliance_issues': 'Alto (25 puntos)',
          'operational_chaos': 'Medio (20 puntos)',
          'manual_processes': 'Medio (20 puntos)',
          'growth': 'Medio (15 puntos)',
          'expansion': 'Medio (15 puntos)'
        }
      },
      intro_strength_score: {
        factors: [
          'Tipo de ruta (direct > second_level > inferred)',
          'Confianza de la ruta',
          'Relevancia del rol del puente (RRHH/CEO = mejor)',
          'Cercanía del puente (conexiones compartidas)'
        ]
      },
      lead_potential_score: {
        formula: 'industry_fit (30%) + buying_signal (40%) + intro_strength (30%)',
        interpretation: {
          '70-100': 'Alto potencial - Priorizar seguimiento',
          '50-69': 'Potencial moderado - Considerar si hay capacidad',
          '0-49': 'Potencial limitado - Evaluar si vale la pena'
        }
      }
    }
  }, { status: 200 })
}
