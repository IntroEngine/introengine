import { NextResponse } from 'next/server'
import { createClient } from '@/config/supabase'

// Helper para crear cliente de Supabase
function getSupabaseClient() {
  return createClient()
}

// Validar status permitidos
const VALID_STATUSES = ['intro_requested', 'in_progress', 'won', 'lost']

// GET /api/opportunities/[id]
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseClient()
    const opportunityId = params.id

    // 1) Obtener oportunidad
    const { data: opportunity, error: opportunityError } = await supabase
      .from('opportunities')
      .select('*')
      .eq('id', opportunityId)
      .single()

    if (opportunityError) {
      console.error('Error fetching opportunity from Supabase:', opportunityError)
      return NextResponse.json(
        { error: 'Opportunity not found' },
        { status: 404 }
      )
    }

    if (!opportunity) {
      return NextResponse.json(
        { error: 'Opportunity not found' },
        { status: 404 }
      )
    }

    // 2) Obtener company
    let company = null
    if (opportunity.company_id) {
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('id, name, industry, size_bucket, website')
        .eq('id', opportunity.company_id)
        .single()

      if (companyError) {
        console.warn('Error fetching company:', companyError)
      } else {
        company = companyData
      }
    }

    // 3) Obtener target_contact
    let targetContact = null
    if (opportunity.target_contact_id) {
      const { data: contactData, error: contactError } = await supabase
        .from('contacts')
        .select('id, full_name, email, role_title')
        .eq('id', opportunity.target_contact_id)
        .single()

      if (contactError) {
        console.warn('Error fetching target contact:', contactError)
      } else {
        targetContact = contactData
      }
    }

    // 4) Obtener bridge_contact (si existe)
    let bridgeContact = null
    if (opportunity.bridge_contact_id) {
      const { data: bridgeData, error: bridgeError } = await supabase
        .from('contacts')
        .select('id, full_name, email, role_title')
        .eq('id', opportunity.bridge_contact_id)
        .single()

      if (bridgeError) {
        console.warn('Error fetching bridge contact:', bridgeError)
      } else {
        bridgeContact = bridgeData
      }
    }

    // 5) Obtener scores
    let scoreBreakdown = null
    const { data: scoresData, error: scoresError } = await supabase
      .from('scores')
      .select('intro_strength_score, buying_signals_score, industry_fit_score, lead_potential_score')
      .eq('opportunity_id', opportunityId)
      .limit(1)
      .single()

    if (scoresError) {
      console.warn('Error fetching scores:', scoresError)
      // Si no hay scores, usar valores por defecto o null
      scoreBreakdown = {
        intro_strength_score: null,
        buying_signals_score: null,
        industry_fit_score: null,
        lead_potential_score: opportunity.lead_potential_score || null,
      }
    } else {
      scoreBreakdown = {
        intro_strength_score: scoresData?.intro_strength_score || null,
        buying_signals_score: scoresData?.buying_signals_score || null,
        industry_fit_score: scoresData?.industry_fit_score || null,
        lead_potential_score: scoresData?.lead_potential_score || opportunity.lead_potential_score || null,
      }
    }

    // Estructurar respuesta final
    const response = {
      opportunity: {
        id: opportunity.id,
        type: opportunity.type,
        status: opportunity.status,
        company: company
          ? {
              id: company.id,
              name: company.name,
              industry: company.industry,
              size_bucket: company.size_bucket,
              website: company.website,
            }
          : null,
        target_contact: targetContact
          ? {
              id: targetContact.id,
              full_name: targetContact.full_name,
              email: targetContact.email,
              role_title: targetContact.role_title,
            }
          : null,
        bridge_contact: bridgeContact
          ? {
              id: bridgeContact.id,
              full_name: bridgeContact.full_name,
              email: bridgeContact.email,
              role_title: bridgeContact.role_title,
            }
          : null,
        lead_potential_score: opportunity.lead_potential_score,
        score_breakdown: scoreBreakdown,
        suggested_intro_message: opportunity.suggested_intro_message || null,
        suggested_outbound_message: opportunity.suggested_outbound_message || null,
      },
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Unexpected error in GET /api/opportunities/[id]:', error)
    return NextResponse.json(
      { error: 'Failed to fetch opportunity' },
      { status: 500 }
    )
  }
}

// PUT /api/opportunities/[id]
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const { status: newStatus } = body

    // Validar que status esté en la lista permitida
    if (!newStatus || !VALID_STATUSES.includes(newStatus)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()
    const opportunityId = params.id

    // Actualizar oportunidad
    const { error } = await supabase
      .from('opportunities')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', opportunityId)

    if (error) {
      console.error('Error updating opportunity in Supabase:', error)
      return NextResponse.json(
        { error: 'Failed to update opportunity' },
        { status: 500 }
      )
    }

    // TODO: llamar a scoringEngine después del update
    // await scoringEngine.recalculateOpportunityScore(opportunityId)

    // TODO: llamar a hubspotService.syncOpportunityToHubSpot(params.id)
    // await hubspotService.syncOpportunityToHubSpot(opportunityId)

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error) {
    // Manejar errores de JSON parsing
    if (error instanceof SyntaxError || error instanceof TypeError) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    console.error('Unexpected error in PUT /api/opportunities/[id]:', error)
    return NextResponse.json(
      { error: 'Failed to update opportunity' },
      { status: 500 }
    )
  }
}

