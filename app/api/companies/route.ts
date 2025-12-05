import { NextResponse } from 'next/server'
import { createClient } from '@/config/supabase'

// TODO: Obtener account_id desde el token de autenticación en lugar de hardcodearlo
// Para MVP, usar un account_id fijo
const ACCOUNT_ID = '00000000-0000-0000-0000-000000000000' // TODO: Reemplazar con account_id real desde auth

// Tipo para la respuesta de Company
type CompanyDTO = {
  id: string
  name: string
  website: string | null
  industry: string | null
  size_bucket: string | null
  status: string
  domain: string | null
}

// Helper para extraer dominio de una URL
function extractDomain(website: string | null | undefined): string | null {
  if (!website) return null

  try {
    // Si ya es un dominio sin protocolo (ej: "example.com")
    if (!website.includes('://') && !website.startsWith('www.')) {
      return website.split('/')[0].toLowerCase()
    }

    // Si tiene protocolo, extraer el hostname
    const url = website.startsWith('http') ? new URL(website) : new URL(`https://${website}`)
    let domain = url.hostname

    // Remover www. si existe
    if (domain.startsWith('www.')) {
      domain = domain.substring(4)
    }

    return domain.toLowerCase()
  } catch (error) {
    // Si falla el parseo, intentar extraer dominio simple
    // TODO: Mejorar parseo de dominio para casos edge
    const match = website.match(/(?:https?:\/\/)?(?:www\.)?([^\/]+)/i)
    return match ? match[1].toLowerCase() : null
  }
}

// Helper para crear cliente de Supabase
function getSupabaseClient() {
  return createClient()
}

// GET /api/companies
export async function GET(req: Request) {
  try {
    const supabase = getSupabaseClient()

    // Consultar empresas del account actual
    const { data, error } = await supabase
      .from('companies')
      .select('id, name, website, domain, industry, size_bucket, status')
      .eq('account_id', ACCOUNT_ID)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching companies from Supabase:', error)
      return NextResponse.json(
        { error: 'Failed to fetch companies' },
        { status: 500 }
      )
    }

    // Mapear a CompanyDTO
    const companies: CompanyDTO[] = (data || []).map((company) => ({
      id: company.id,
      name: company.name,
      website: company.website,
      industry: company.industry,
      size_bucket: company.size_bucket,
      status: company.status || 'new',
      domain: company.domain,
    }))

    return NextResponse.json({ companies }, { status: 200 })
  } catch (error) {
    console.error('Unexpected error in GET /api/companies:', error)
    return NextResponse.json(
      { error: 'Failed to fetch companies' },
      { status: 500 }
    )
  }
}

// POST /api/companies
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, website, industry, size_bucket, status } = body

    // Validar que name sea obligatorio
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    // Usar 'new' como status por defecto si no viene
    const companyStatus = status || 'new'

    // Extraer dominio de website si es posible
    const domain = extractDomain(website)

    const supabase = getSupabaseClient()

    // Insertar nueva empresa
    const { data, error } = await supabase
      .from('companies')
      .insert({
        account_id: ACCOUNT_ID,
        name: name.trim(),
        website: website?.trim() || null,
        domain: domain,
        industry: industry?.trim() || null,
        size_bucket: size_bucket || null,
        status: companyStatus,
      })
      .select('id, name, website, domain, industry, size_bucket, status')
      .single()

    if (error) {
      console.error('Error creating company in Supabase:', error)
      return NextResponse.json(
        { error: 'Failed to create company' },
        { status: 500 }
      )
    }

    // Mapear a CompanyDTO
    const company: CompanyDTO = {
      id: data.id,
      name: data.name,
      website: data.website,
      industry: data.industry,
      size_bucket: data.size_bucket,
      status: data.status || 'new',
      domain: data.domain,
    }

    return NextResponse.json({ company }, { status: 201 })
  } catch (error) {
    // Manejar errores de JSON parsing
    if (error instanceof SyntaxError || error instanceof TypeError) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    console.error('Unexpected error in POST /api/companies:', error)
    return NextResponse.json(
      { error: 'Failed to create company' },
      { status: 500 }
    )
  }
}

