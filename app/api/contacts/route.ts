import { NextResponse } from 'next/server'
import { createClient } from '@/config/supabase'
import { getAccountId } from '@/lib/auth'

// Tipo para la respuesta de Contact
type ContactDTO = {
  id: string
  full_name: string
  email: string | null
  company_id: string | null
  company_name?: string | null
  role_title: string | null
  type: string | null
  source: string | null
}

// Helper para crear cliente de Supabase
function getSupabaseClient() {
  return createClient()
}

// Helper para enriquecer contactos con nombres de empresas
async function enrichContactsWithCompanyNames(
  contacts: any[],
  supabase: ReturnType<typeof getSupabaseClient>
): Promise<ContactDTO[]> {
  // Extraer company_ids únicos
  const companyIds = contacts
    .map((c) => c.company_id)
    .filter((id): id is string => id !== null && id !== undefined)

  if (companyIds.length === 0) {
    // Si no hay company_ids, devolver contactos sin company_name
    return contacts.map((contact) => ({
      id: contact.id,
      full_name: contact.full_name,
      email: contact.email,
      company_id: contact.company_id,
      company_name: null,
      role_title: contact.role_title,
      type: contact.type,
      source: contact.source,
    }))
  }

  // Consultar empresas
  const { data: companies, error } = await supabase
    .from('companies')
    .select('id, name')
    .in('id', companyIds)

  if (error) {
    console.warn('Error fetching companies for contacts:', error)
    // Continuar sin company_name si falla
  }

  // Crear mapa de company_id -> company_name
  const companyMap = new Map<string, string>()
  ;(companies || []).forEach((company) => {
    companyMap.set(company.id, company.name)
  })

  // Mapear contactos con company_name
  return contacts.map((contact) => ({
    id: contact.id,
    full_name: contact.full_name,
    email: contact.email,
    company_id: contact.company_id,
    company_name: contact.company_id ? companyMap.get(contact.company_id) || null : null,
    role_title: contact.role_title,
    type: contact.type,
    source: contact.source,
  }))
}

// GET /api/contacts
export async function GET(req: Request) {
  try {
    // Obtener account_id del usuario autenticado
    const accountId = await getAccountId()
    
    if (!accountId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = getSupabaseClient()

    // Consultar contactos del account actual
    const { data, error } = await supabase
      .from('contacts')
      .select('id, full_name, email, company_id, role_title, type, source')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching contacts from Supabase:', error)
      return NextResponse.json(
        { error: 'Failed to fetch contacts' },
        { status: 500 }
      )
    }

    // Enriquecer con nombres de empresas
    // TODO: Optimizar con un JOIN real cuando Supabase lo soporte mejor
    const contacts: ContactDTO[] = await enrichContactsWithCompanyNames(
      data || [],
      supabase
    )

    return NextResponse.json({ contacts }, { status: 200 })
  } catch (error) {
    console.error('Unexpected error in GET /api/contacts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    )
  }
}

// POST /api/contacts
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      full_name,
      email,
      company_id,
      role_title,
      type,
      source,
    } = body

    // Validar que full_name sea obligatorio
    if (!full_name || typeof full_name !== 'string' || full_name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Full name is required' },
        { status: 400 }
      )
    }

    // Obtener account_id del usuario autenticado
    const accountId = await getAccountId()
    
    if (!accountId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = getSupabaseClient()

    // Preparar datos para insertar
    const insertData: any = {
      account_id: accountId,
      full_name: full_name.trim(),
      email: email?.trim() || null,
      company_id: company_id || null,
      role_title: role_title?.trim() || null,
      type: type || null,
      source: source || 'manual',
    }

    // Insertar nuevo contacto
    const { data, error } = await supabase
      .from('contacts')
      .insert(insertData)
      .select('id, full_name, email, company_id, role_title, type, source')
      .single()

    if (error) {
      console.error('Error creating contact in Supabase:', error)
      return NextResponse.json(
        { error: 'Failed to create contact' },
        { status: 500 }
      )
    }

    // Enriquecer con company_name si tiene company_id
    let contact: ContactDTO = {
      id: data.id,
      full_name: data.full_name,
      email: data.email,
      company_id: data.company_id,
      company_name: null,
      role_title: data.role_title,
      type: data.type,
      source: data.source,
    }

    // Si tiene company_id, obtener el nombre de la empresa
    if (data.company_id) {
      const { data: company } = await supabase
        .from('companies')
        .select('name')
        .eq('id', data.company_id)
        .single()

      if (company) {
        contact.company_name = company.name
      }
    }

    return NextResponse.json({ contact }, { status: 201 })
  } catch (error) {
    // Manejar errores de JSON parsing
    if (error instanceof SyntaxError || error instanceof TypeError) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    console.error('Unexpected error in POST /api/contacts:', error)
    return NextResponse.json(
      { error: 'Failed to create contact' },
      { status: 500 }
    )
  }
}

