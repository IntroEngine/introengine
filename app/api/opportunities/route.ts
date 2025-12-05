import { NextResponse } from 'next/server'
import { createClient } from '@/config/supabase'

// TODO: Obtener account_id desde el token de autenticación en lugar de hardcodearlo
// Para MVP, usar un account_id fijo
const ACCOUNT_ID = '00000000-0000-0000-0000-000000000000' // TODO: REEMPLAZAR_POR_ACCOUNT_REAL desde auth

// Helper para crear cliente de Supabase
function getSupabaseClient() {
  return createClient()
}

// GET /api/opportunities
export async function GET(req: Request) {
  try {
    const supabase = getSupabaseClient()

    // Consultar oportunidades del account actual
    const { data: opportunities, error } = await supabase
      .from('opportunities')
      .select('id, company_id, type, status, lead_potential_score, bridge_contact_id')
      .eq('account_id', ACCOUNT_ID)
      .order('lead_potential_score', { ascending: false, nullsFirst: false })

    if (error) {
      console.error('Error fetching opportunities from Supabase:', error)
      return NextResponse.json(
        { error: 'Failed to fetch opportunities' },
        { status: 500 }
      )
    }

    if (!opportunities || opportunities.length === 0) {
      return NextResponse.json({ opportunities: [] }, { status: 200 })
    }

    // Extraer company_ids únicos
    const companyIds = opportunities
      .map((opp) => opp.company_id)
      .filter((id): id is string => id !== null && id !== undefined)

    // Hacer segundo fetch manual a companies para mapear company_name
    let companyMap = new Map<string, string>()
    if (companyIds.length > 0) {
      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select('id, name')
        .in('id', companyIds)

      if (companiesError) {
        console.warn('Error fetching companies for opportunities:', companiesError)
        // Continuar sin company_name si falla
      } else {
        companies?.forEach((company) => {
          companyMap.set(company.id, company.name)
        })
      }
    }

    // Mapear oportunidades con company_name y has_bridge
    const enrichedOpportunities = opportunities.map((opp) => ({
      id: opp.id,
      company_id: opp.company_id,
      company_name: opp.company_id ? companyMap.get(opp.company_id) || null : null,
      type: opp.type,
      status: opp.status,
      lead_potential_score: opp.lead_potential_score,
      has_bridge: opp.bridge_contact_id !== null && opp.bridge_contact_id !== undefined,
    }))

    return NextResponse.json({ opportunities: enrichedOpportunities }, { status: 200 })
  } catch (error) {
    console.error('Unexpected error in GET /api/opportunities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch opportunities' },
      { status: 500 }
    )
  }
}

