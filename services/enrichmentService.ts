/**
 * Enrichment Service de IntroEngine
 * 
 * Servicio para enriquecer datos de empresas y contactos usando APIs externas:
 * - Clearbit: Enriquecimiento de empresas por dominio
 * - Apollo: Enriquecimiento de contactos y empresas
 * 
 * Variables de entorno requeridas:
 * - CLEARBIT_API_KEY (opcional)
 * - APOLLO_API_KEY (opcional)
 */

import { createClient } from '@/config/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface EnrichmentResult {
  success: boolean
  provider: 'clearbit' | 'apollo' | 'manual'
  data: Record<string, any>
  errors?: string[]
}

export interface CompanyEnrichmentData {
  name?: string
  domain?: string
  website?: string
  industry?: string
  size_bucket?: string
  employee_count?: number
  country?: string
  city?: string
  description?: string
  founded_year?: number
  revenue?: string
  technologies?: string[]
  linkedin_url?: string
  twitter_url?: string
  facebook_url?: string
  logo?: string
  tags?: string[]
  metadata?: Record<string, any>
}

export interface ContactEnrichmentData {
  full_name?: string
  email?: string
  role_title?: string
  seniority?: string
  linkedin_url?: string
  company_name?: string
  company_domain?: string
  location?: string
  phone?: string
  twitter_url?: string
  github_url?: string
  bio?: string
  previous_companies?: string[]
  previous_roles?: string[]
  metadata?: Record<string, any>
}

// ============================================================================
// HELPERS DE ACCESO A DATOS
// ============================================================================

function getSupabaseClient(): SupabaseClient {
  return createClient()
}

// ============================================================================
// INTEGRACIÓN CON CLEARBIT
// ============================================================================

/**
 * Enriquece una empresa usando Clearbit
 */
async function enrichCompanyWithClearbit(
  domain: string
): Promise<CompanyEnrichmentData | null> {
  const apiKey = process.env.CLEARBIT_API_KEY
  
  if (!apiKey) {
    console.warn('[Enrichment] CLEARBIT_API_KEY not configured, skipping Clearbit enrichment')
    return null
  }
  
  try {
    const response = await fetch(`https://company.clearbit.com/v2/companies/find?domain=${encodeURIComponent(domain)}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      }
    })
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log(`[Enrichment] Clearbit: Company not found for domain ${domain}`)
        return null
      }
      if (response.status === 429) {
        console.warn('[Enrichment] Clearbit: Rate limit exceeded')
        return null
      }
      throw new Error(`Clearbit API error: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    
    // Mapear datos de Clearbit a nuestro formato
    const enrichment: CompanyEnrichmentData = {
      name: data.name,
      domain: data.domain,
      website: data.domain ? `https://${data.domain}` : undefined,
      industry: data.category?.industry || data.industry,
      size_bucket: mapEmployeeCountToBucket(data.metrics?.employees),
      employee_count: data.metrics?.employees,
      country: data.geo?.country,
      city: data.geo?.city,
      description: data.description,
      founded_year: data.foundedYear,
      revenue: data.metrics?.annualRevenue ? `$${data.metrics.annualRevenue}` : undefined,
      technologies: data.tech || [],
      linkedin_url: data.linkedin?.handle ? `https://linkedin.com/company/${data.linkedin.handle}` : undefined,
      twitter_url: data.twitter?.handle ? `https://twitter.com/${data.twitter.handle}` : undefined,
      facebook_url: data.facebook?.handle ? `https://facebook.com/${data.facebook.handle}` : undefined,
      logo: data.logo,
      tags: data.tags || [],
      metadata: {
        clearbit_id: data.id,
        clearbit_updated: data.updated
      }
    }
    
    return enrichment
  } catch (error) {
    console.error(`[Enrichment] Error enriching company with Clearbit (domain: ${domain}):`, error)
    return null
  }
}

/**
 * Mapea número de empleados a bucket de tamaño
 */
function mapEmployeeCountToBucket(employeeCount?: number): string | undefined {
  if (!employeeCount) return undefined
  
  if (employeeCount <= 10) return '1-10'
  if (employeeCount <= 50) return '11-50'
  if (employeeCount <= 200) return '51-200'
  if (employeeCount <= 500) return '201-500'
  if (employeeCount <= 1000) return '501-1000'
  return '1000+'
}

// ============================================================================
// INTEGRACIÓN CON APOLLO
// ============================================================================

/**
 * Enriquece una empresa usando Apollo
 */
async function enrichCompanyWithApollo(
  domain: string
): Promise<CompanyEnrichmentData | null> {
  const apiKey = process.env.APOLLO_API_KEY
  
  if (!apiKey) {
    console.warn('[Enrichment] APOLLO_API_KEY not configured, skipping Apollo enrichment')
    return null
  }
  
  try {
    // Apollo API v1: Search for organization
    const response = await fetch('https://api.apollo.io/v1/organizations/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify({
        api_key: apiKey,
        q_organization_domains: domain,
        per_page: 1
      })
    })
    
    if (!response.ok) {
      if (response.status === 429) {
        console.warn('[Enrichment] Apollo: Rate limit exceeded')
        return null
      }
      throw new Error(`Apollo API error: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    
    if (!data.organizations || data.organizations.length === 0) {
      console.log(`[Enrichment] Apollo: Company not found for domain ${domain}`)
      return null
    }
    
    const org = data.organizations[0]
    
    // Mapear datos de Apollo a nuestro formato
    const enrichment: CompanyEnrichmentData = {
      name: org.name,
      domain: org.website_url ? new URL(org.website_url).hostname.replace('www.', '') : domain,
      website: org.website_url,
      industry: org.industry,
      size_bucket: mapEmployeeCountToBucket(org.estimated_num_employees),
      employee_count: org.estimated_num_employees,
      country: org.primary_phone?.number ? undefined : org.organization_raw?.address_country,
      city: org.organization_raw?.address_locality,
      description: org.organization_raw?.description,
      founded_year: org.founded_year,
      revenue: org.estimated_annual_revenue,
      linkedin_url: org.linkedin_url,
      twitter_url: org.twitter_url,
      metadata: {
        apollo_id: org.id,
        apollo_updated: new Date().toISOString()
      }
    }
    
    return enrichment
  } catch (error) {
    console.error(`[Enrichment] Error enriching company with Apollo (domain: ${domain}):`, error)
    return null
  }
}

/**
 * Enriquece un contacto usando Apollo
 */
async function enrichContactWithApollo(
  email?: string,
  firstName?: string,
  lastName?: string,
  companyDomain?: string
): Promise<ContactEnrichmentData | null> {
  const apiKey = process.env.APOLLO_API_KEY
  
  if (!apiKey) {
    console.warn('[Enrichment] APOLLO_API_KEY not configured, skipping Apollo enrichment')
    return null
  }
  
  try {
    // Apollo API v1: Search for person
    const searchParams: any = {
      api_key: apiKey,
      per_page: 1
    }
    
    if (email) {
      searchParams.q_emails = email
    } else if (firstName && lastName && companyDomain) {
      searchParams.q_keywords = `${firstName} ${lastName}`
      searchParams.q_organization_domains = companyDomain
    } else {
      console.warn('[Enrichment] Apollo: Insufficient data to search for contact')
      return null
    }
    
    const response = await fetch('https://api.apollo.io/v1/people/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify(searchParams)
    })
    
    if (!response.ok) {
      if (response.status === 429) {
        console.warn('[Enrichment] Apollo: Rate limit exceeded')
        return null
      }
      throw new Error(`Apollo API error: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    
    if (!data.people || data.people.length === 0) {
      console.log(`[Enrichment] Apollo: Contact not found`)
      return null
    }
    
    const person = data.people[0]
    
    // Mapear datos de Apollo a nuestro formato
    const enrichment: ContactEnrichmentData = {
      full_name: `${person.first_name || ''} ${person.last_name || ''}`.trim(),
      email: person.email,
      role_title: person.title,
      seniority: mapTitleToSeniority(person.title),
      linkedin_url: person.linkedin_url,
      company_name: person.organization?.name,
      company_domain: person.organization?.website_url 
        ? new URL(person.organization.website_url).hostname.replace('www.', '')
        : undefined,
      location: person.city_state || person.location,
      phone: person.phone_numbers?.[0]?.raw_number,
      twitter_url: person.twitter_url,
      github_url: person.github_url,
      bio: person.bio,
      previous_companies: person.previous_companies?.map((c: any) => c.name) || [],
      previous_roles: person.previous_companies?.map((c: any) => c.title) || [],
      metadata: {
        apollo_id: person.id,
        apollo_updated: new Date().toISOString()
      }
    }
    
    return enrichment
  } catch (error) {
    console.error(`[Enrichment] Error enriching contact with Apollo:`, error)
    return null
  }
}

/**
 * Mapea título a nivel de seniority
 */
function mapTitleToSeniority(title?: string): string | undefined {
  if (!title) return undefined
  
  const lowerTitle = title.toLowerCase()
  
  if (lowerTitle.includes('ceo') || lowerTitle.includes('founder') || lowerTitle.includes('owner')) {
    return 'owner'
  }
  if (lowerTitle.includes('c-') || lowerTitle.includes('chief')) {
    return 'c-level'
  }
  if (lowerTitle.includes('director') || lowerTitle.includes('head of')) {
    return 'director'
  }
  if (lowerTitle.includes('manager') || lowerTitle.includes('lead')) {
    return 'manager'
  }
  return 'staff'
}

// ============================================================================
// FUNCIONES DE ENRIQUECIMIENTO
// ============================================================================

/**
 * Enriquece una empresa usando todas las APIs disponibles
 */
export async function enrichCompany(
  accountId: string,
  companyId: string,
  options?: { force?: boolean; providers?: ('clearbit' | 'apollo')[] }
): Promise<EnrichmentResult> {
  console.log(`[Enrichment] Enriching company ${companyId} (account: ${accountId})`)
  
  try {
    const supabase = getSupabaseClient()
    
    // 1. Obtener empresa
    const { data: company, error: fetchError } = await supabase
      .from('companies')
      .select('id, name, domain, website, enrichment_status, enrichment_data')
      .eq('id', companyId)
      .eq('account_id', accountId)
      .single()
    
    if (fetchError || !company) {
      return {
        success: false,
        provider: 'manual',
        data: {},
        errors: [`Company not found: ${companyId}`]
      }
    }
    
    // 2. Verificar si ya está enriquecida (a menos que force=true)
    if (!options?.force && company.enrichment_status === 'completed' && company.enrichment_data) {
      console.log(`[Enrichment] Company ${companyId} already enriched, skipping`)
      return {
        success: true,
        provider: 'manual',
        data: company.enrichment_data as Record<string, any>
      }
    }
    
    // 3. Obtener dominio
    const domain = company.domain || (company.website ? extractDomain(company.website) : null)
    
    if (!domain) {
      return {
        success: false,
        provider: 'manual',
        data: {},
        errors: ['No domain available for enrichment']
      }
    }
    
    // 4. Actualizar status a 'in_progress'
    await supabase
      .from('companies')
      .update({ enrichment_status: 'in_progress' })
      .eq('id', companyId)
    
    // 5. Intentar enriquecimiento con cada proveedor
    const providers = options?.providers || ['clearbit', 'apollo']
    const errors: string[] = []
    let enrichmentData: CompanyEnrichmentData | null = null
    let usedProvider: 'clearbit' | 'apollo' | 'manual' = 'manual'
    
    // Intentar Clearbit primero
    if (providers.includes('clearbit')) {
      enrichmentData = await enrichCompanyWithClearbit(domain)
      if (enrichmentData) {
        usedProvider = 'clearbit'
      } else {
        errors.push('Clearbit: No data found')
      }
    }
    
    // Si Clearbit falló, intentar Apollo
    if (!enrichmentData && providers.includes('apollo')) {
      enrichmentData = await enrichCompanyWithApollo(domain)
      if (enrichmentData) {
        usedProvider = 'apollo'
      } else {
        errors.push('Apollo: No data found')
      }
    }
    
    // 6. Si obtuvimos datos, actualizar la empresa
    if (enrichmentData) {
      // Combinar datos existentes con nuevos
      const existingData = (company.enrichment_data as Record<string, any>) || {}
      const mergedData = {
        ...existingData,
        ...enrichmentData,
        last_enriched_at: new Date().toISOString(),
        provider: usedProvider
      }
      
      // Actualizar campos específicos si están disponibles
      const updateData: any = {
        enrichment_status: 'completed',
        enrichment_data: mergedData
      }
      
      // Actualizar campos si están vacíos
      if (!company.name && enrichmentData.name) updateData.name = enrichmentData.name
      if (!company.domain && enrichmentData.domain) updateData.domain = enrichmentData.domain
      if (!company.website && enrichmentData.website) updateData.website = enrichmentData.website
      if (!company.industry && enrichmentData.industry) updateData.industry = enrichmentData.industry
      if (!company.size_bucket && enrichmentData.size_bucket) updateData.size_bucket = enrichmentData.size_bucket
      if (!company.country && enrichmentData.country) updateData.country = enrichmentData.country
      
      const { error: updateError } = await supabase
        .from('companies')
        .update(updateData)
        .eq('id', companyId)
      
      if (updateError) {
        errors.push(`Failed to update company: ${updateError.message}`)
        return {
          success: false,
          provider: usedProvider,
          data: enrichmentData,
          errors
        }
      }
      
      console.log(`[Enrichment] Successfully enriched company ${companyId} using ${usedProvider}`)
      
      // Registrar en activity logs
      try {
        const { logEnrichmentCompleted } = await import('./activityLogger')
        await logEnrichmentCompleted(accountId, 'company', companyId, usedProvider, true, {
          fields_updated: Object.keys(updateData).filter(k => k !== 'enrichment_status' && k !== 'enrichment_data')
        })
      } catch (logError) {
        // No fallar si el logging falla
        console.warn(`[Enrichment] Failed to log enrichment activity:`, logError)
      }
      
      return {
        success: true,
        provider: usedProvider,
        data: enrichmentData
      }
    } else {
      // Marcar como fallido
      await supabase
        .from('companies')
        .update({ enrichment_status: 'failed' })
        .eq('id', companyId)
      
      return {
        success: false,
        provider: 'manual',
        data: {},
        errors: errors.length > 0 ? errors : ['No enrichment data available from any provider']
      }
    }
  } catch (error) {
    console.error(`[Enrichment] Error enriching company ${companyId}:`, error)
    
    // Marcar como fallido
    const supabase = getSupabaseClient()
    await supabase
      .from('companies')
      .update({ enrichment_status: 'failed' })
      .eq('id', companyId)
    
    return {
      success: false,
      provider: 'manual',
      data: {},
      errors: [error instanceof Error ? error.message : 'Unknown error']
    }
  }
}

/**
 * Enriquece un contacto usando todas las APIs disponibles
 */
export async function enrichContact(
  accountId: string,
  contactId: string,
  options?: { force?: boolean; providers?: ('apollo')[] }
): Promise<EnrichmentResult> {
  console.log(`[Enrichment] Enriching contact ${contactId} (account: ${accountId})`)
  
  try {
    const supabase = getSupabaseClient()
    
    // 1. Obtener contacto
    const { data: contact, error: fetchError } = await supabase
      .from('contacts')
      .select('id, full_name, email, company_id, enrichment_status, enrichment_data, companies(domain, name)')
      .eq('id', contactId)
      .eq('account_id', accountId)
      .single()
    
    if (fetchError || !contact) {
      return {
        success: false,
        provider: 'manual',
        data: {},
        errors: [`Contact not found: ${contactId}`]
      }
    }
    
    // 2. Verificar si ya está enriquecido (a menos que force=true)
    if (!options?.force && contact.enrichment_status === 'completed' && contact.enrichment_data) {
      console.log(`[Enrichment] Contact ${contactId} already enriched, skipping`)
      return {
        success: true,
        provider: 'manual',
        data: contact.enrichment_data as Record<string, any>
      }
    }
    
    // 3. Extraer información para búsqueda
    const email = contact.email || undefined
    const company = Array.isArray(contact.companies) ? contact.companies[0] : contact.companies
    const companyDomain = company?.domain || undefined
    const nameParts = contact.full_name?.split(' ') || []
    const firstName = nameParts[0] || undefined
    const lastName = nameParts.slice(1).join(' ') || undefined
    
    if (!email && (!firstName || !lastName || !companyDomain)) {
      return {
        success: false,
        provider: 'manual',
        data: {},
        errors: ['Insufficient data for enrichment (need email or name+company)']
      }
    }
    
    // 4. Actualizar status a 'in_progress'
    await supabase
      .from('contacts')
      .update({ enrichment_status: 'in_progress' })
      .eq('id', contactId)
    
    // 5. Intentar enriquecimiento con Apollo
    const providers = options?.providers || ['apollo']
    const errors: string[] = []
    let enrichmentData: ContactEnrichmentData | null = null
    let usedProvider: 'apollo' | 'manual' = 'manual'
    
    if (providers.includes('apollo')) {
      enrichmentData = await enrichContactWithApollo(email, firstName, lastName, companyDomain)
      if (enrichmentData) {
        usedProvider = 'apollo'
      } else {
        errors.push('Apollo: No data found')
      }
    }
    
    // 6. Si obtuvimos datos, actualizar el contacto
    if (enrichmentData) {
      // Combinar datos existentes con nuevos
      const existingData = (contact.enrichment_data as Record<string, any>) || {}
      const mergedData = {
        ...existingData,
        ...enrichmentData,
        last_enriched_at: new Date().toISOString(),
        provider: usedProvider
      }
      
      // Actualizar campos específicos si están disponibles
      const updateData: any = {
        enrichment_status: 'completed',
        enrichment_data: mergedData
      }
      
      // Actualizar campos si están vacíos
      if (!contact.email && enrichmentData.email) updateData.email = enrichmentData.email
      if (!contact.role_title && enrichmentData.role_title) updateData.role_title = enrichmentData.role_title
      if (!contact.seniority && enrichmentData.seniority) updateData.seniority = enrichmentData.seniority
      if (!contact.linkedin_url && enrichmentData.linkedin_url) updateData.linkedin_url = enrichmentData.linkedin_url
      
      const { error: updateError } = await supabase
        .from('contacts')
        .update(updateData)
        .eq('id', contactId)
      
      if (updateError) {
        errors.push(`Failed to update contact: ${updateError.message}`)
        return {
          success: false,
          provider: usedProvider,
          data: enrichmentData,
          errors
        }
      }
      
      console.log(`[Enrichment] Successfully enriched contact ${contactId} using ${usedProvider}`)
      
      // Registrar en activity logs
      try {
        const { logEnrichmentCompleted } = await import('./activityLogger')
        await logEnrichmentCompleted(accountId, 'contact', contactId, usedProvider, true, {
          fields_updated: Object.keys(updateData).filter(k => k !== 'enrichment_status' && k !== 'enrichment_data')
        })
      } catch (logError) {
        // No fallar si el logging falla
        console.warn(`[Enrichment] Failed to log enrichment activity:`, logError)
      }
      
      return {
        success: true,
        provider: usedProvider,
        data: enrichmentData
      }
    } else {
      // Marcar como fallido
      await supabase
        .from('contacts')
        .update({ enrichment_status: 'failed' })
        .eq('id', contactId)
      
      return {
        success: false,
        provider: 'manual',
        data: {},
        errors: errors.length > 0 ? errors : ['No enrichment data available from any provider']
      }
    }
  } catch (error) {
    console.error(`[Enrichment] Error enriching contact ${contactId}:`, error)
    
    // Marcar como fallido
    const supabase = getSupabaseClient()
    await supabase
      .from('contacts')
      .update({ enrichment_status: 'failed' })
      .eq('id', contactId)
    
    return {
      success: false,
      provider: 'manual',
      data: {},
      errors: [error instanceof Error ? error.message : 'Unknown error']
    }
  }
}

/**
 * Enriquece todas las empresas pendientes de una cuenta
 */
export async function enrichPendingCompanies(
  accountId: string,
  limit?: number
): Promise<{ processed: number; errors: number }> {
  console.log(`[Enrichment] Enriching pending companies for account ${accountId}`)
  
  try {
    const supabase = getSupabaseClient()
    
    // Obtener empresas pendientes
    let query = supabase
      .from('companies')
      .select('id')
      .eq('account_id', accountId)
      .eq('enrichment_status', 'pending')
      .order('created_at', { ascending: false })
    
    if (limit) {
      query = query.limit(limit)
    }
    
    const { data: companies, error } = await query
    
    if (error) {
      console.error(`[Enrichment] Error fetching pending companies:`, error)
      return { processed: 0, errors: 1 }
    }
    
    if (!companies || companies.length === 0) {
      console.log(`[Enrichment] No pending companies found`)
      return { processed: 0, errors: 0 }
    }
    
    let processed = 0
    let errors = 0
    
    for (const company of companies) {
      try {
        const result = await enrichCompany(accountId, company.id)
        if (result.success) {
          processed++
        } else {
          errors++
        }
      } catch (error) {
        console.error(`[Enrichment] Error enriching company ${company.id}:`, error)
        errors++
      }
    }
    
    console.log(`[Enrichment] Account ${accountId}: ${processed} processed, ${errors} errors`)
    
    return { processed, errors }
  } catch (error) {
    console.error(`[Enrichment] Fatal error enriching companies for account ${accountId}:`, error)
    return { processed: 0, errors: 1 }
  }
}

/**
 * Enriquece todos los contactos pendientes de una cuenta
 */
export async function enrichPendingContacts(
  accountId: string,
  limit?: number
): Promise<{ processed: number; errors: number }> {
  console.log(`[Enrichment] Enriching pending contacts for account ${accountId}`)
  
  try {
    const supabase = getSupabaseClient()
    
    // Obtener contactos pendientes
    let query = supabase
      .from('contacts')
      .select('id')
      .eq('account_id', accountId)
      .eq('enrichment_status', 'pending')
      .order('created_at', { ascending: false })
    
    if (limit) {
      query = query.limit(limit)
    }
    
    const { data: contacts, error } = await query
    
    if (error) {
      console.error(`[Enrichment] Error fetching pending contacts:`, error)
      return { processed: 0, errors: 1 }
    }
    
    if (!contacts || contacts.length === 0) {
      console.log(`[Enrichment] No pending contacts found`)
      return { processed: 0, errors: 0 }
    }
    
    let processed = 0
    let errors = 0
    
    for (const contact of contacts) {
      try {
        const result = await enrichContact(accountId, contact.id)
        if (result.success) {
          processed++
        } else {
          errors++
        }
      } catch (error) {
        console.error(`[Enrichment] Error enriching contact ${contact.id}:`, error)
        errors++
      }
    }
    
    console.log(`[Enrichment] Account ${accountId}: ${processed} processed, ${errors} errors`)
    
    return { processed, errors }
  } catch (error) {
    console.error(`[Enrichment] Fatal error enriching contacts for account ${accountId}:`, error)
    return { processed: 0, errors: 1 }
  }
}

/**
 * Enriquece todos los datos pendientes de una cuenta (empresas y contactos)
 */
export async function enrichAccountData(
  accountId: string,
  options?: { companiesLimit?: number; contactsLimit?: number }
): Promise<{ companies: { processed: number; errors: number }; contacts: { processed: number; errors: number } }> {
  console.log(`[Enrichment] Enriching all data for account ${accountId}`)
  
  const [companiesResult, contactsResult] = await Promise.all([
    enrichPendingCompanies(accountId, options?.companiesLimit),
    enrichPendingContacts(accountId, options?.contactsLimit)
  ])
  
  return {
    companies: companiesResult,
    contacts: contactsResult
  }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Extrae el dominio de una URL
 */
function extractDomain(url: string): string | null {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`)
    return urlObj.hostname.replace('www.', '')
  } catch {
    return null
  }
}

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default {
  enrichCompany,
  enrichContact,
  enrichPendingCompanies,
  enrichPendingContacts,
  enrichAccountData
}
