/**
 * HubSpot Integration Service de IntroEngine
 * 
 * Capa de integración para sincronizar companies, contacts y deals
 * entre IntroEngine y HubSpot CRM.
 */

import { createClient } from '@/config/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

// ============================================================================
// CONSTANTES Y CONFIGURACIÓN
// ============================================================================

const HUBSPOT_API_BASE_URL = 'https://api.hubapi.com'
const HUBSPOT_COMPANIES_ENDPOINT = '/crm/v3/objects/companies'
const HUBSPOT_CONTACTS_ENDPOINT = '/crm/v3/objects/contacts'
const HUBSPOT_DEALS_ENDPOINT = '/crm/v3/objects/deals'
const HUBSPOT_SEARCH_ENDPOINT = '/crm/v3/objects/{objectType}/search'

// TODO: Definir pipeline ID real cuando esté configurado en HubSpot
const HUBSPOT_DEFAULT_PIPELINE = 'default'

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface CompanyRecord {
  id: string
  account_id: string
  name: string
  domain: string | null
  industry: string | null
  size_bucket: string | null
  country: string | null
  website: string | null
  hubspot_company_id: string | null
}

export interface ContactRecord {
  id: string
  account_id: string
  full_name: string
  email: string | null
  role_title: string | null
  seniority: string | null
  company_id: string | null
  hubspot_contact_id: string | null
}

export interface OpportunityRecord {
  id: string
  account_id: string
  company_id: string
  type: string | null // 'intro' | 'outbound'
  status: string | null
  target_contact_id: string | null
  bridge_contact_id: string | null
  hubspot_deal_id: string | null
  suggested_intro_message: string | null
  suggested_outbound_message: string | null
  last_action_at: string | null
}

export interface OpportunityWithContext {
  opportunity: OpportunityRecord
  company: CompanyRecord
  target_contact: ContactRecord | null
  bridge_contact: ContactRecord | null
}

export interface HubSpotCompanyPayload {
  properties: {
    name: string
    domain?: string
    industry?: string
    numberofemployees?: string
    country?: string
    website?: string
  }
}

export interface HubSpotContactPayload {
  properties: {
    email?: string
    firstname?: string
    lastname?: string
    jobtitle?: string
    company?: string
  }
  associations?: Array<{
    to: { id: string }
    types: Array<{ associationCategory: string; associationTypeId: number }>
  }>
}

export interface HubSpotDealPayload {
  properties: {
    dealname: string
    dealstage?: string
    pipeline?: string
    amount?: string
    closedate?: string
    dealtype?: string
  }
  associations?: Array<{
    to: { id: string }
    types: Array<{ associationCategory: string; associationTypeId: number }>
  }>
}

export interface HubSpotSearchResponse {
  results: Array<{
    id: string
    properties: Record<string, any>
  }>
}

// ============================================================================
// HELPERS DE CONFIGURACIÓN
// ============================================================================

/**
 * Obtiene la API key de HubSpot para una cuenta
 * 
 * TODO: Implementar lectura desde tabla de configuración por account
 * Por ahora, usar variable de entorno global o por account
 */
async function getHubSpotApiKeyForAccount(accountId: string): Promise<string> {
  // TODO: Leer desde tabla account_settings o similar
  // const supabase = getSupabaseClient()
  // const { data } = await supabase
  //   .from('account_settings')
  //   .select('hubspot_api_key')
  //   .eq('account_id', accountId)
  //   .single()
  
  // Por ahora, usar variable de entorno global
  const apiKey = process.env.HUBSPOT_API_KEY || process.env.HUBSPOT_PRIVATE_APP_TOKEN
  
  if (!apiKey) {
    throw new Error(`HubSpot API key not configured for account ${accountId}`)
  }
  
  return apiKey
}

// ============================================================================
// HELPERS DE ACCESO A DATOS (SUPABASE)
// ============================================================================

/**
 * Obtiene el cliente de Supabase
 */
function getSupabaseClient(): SupabaseClient {
  return createClient()
}

/**
 * Obtiene una oportunidad con su contexto completo
 */
async function getOpportunityWithContext(
  accountId: string,
  opportunityId: string
): Promise<OpportunityWithContext | null> {
  try {
    const supabase = getSupabaseClient()
    
    // 1. Obtener oportunidad
    const { data: opportunity, error: oppError } = await supabase
      .from('opportunities')
      .select('id, account_id, company_id, type, status, target_contact_id, bridge_contact_id, hubspot_deal_id, suggested_intro_message, suggested_outbound_message, last_action_at')
      .eq('id', opportunityId)
      .eq('account_id', accountId)
      .single()
    
    if (oppError || !opportunity) {
      console.error(`Error fetching opportunity ${opportunityId}:`, oppError)
      return null
    }
    
    // 2. Obtener company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, account_id, name, domain, industry, size_bucket, country, website, hubspot_company_id')
      .eq('id', opportunity.company_id)
      .eq('account_id', accountId)
      .single()
    
    if (companyError || !company) {
      console.error(`Error fetching company ${opportunity.company_id}:`, companyError)
      return null
    }
    
    // 3. Obtener target_contact si existe
    let targetContact: ContactRecord | null = null
    if (opportunity.target_contact_id) {
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .select('id, account_id, full_name, email, role_title, seniority, company_id, hubspot_contact_id')
        .eq('id', opportunity.target_contact_id)
        .eq('account_id', accountId)
        .single()
      
      if (!contactError && contact) {
        targetContact = {
          id: contact.id,
          account_id: contact.account_id,
          full_name: contact.full_name,
          email: contact.email,
          role_title: contact.role_title,
          seniority: contact.seniority,
          company_id: contact.company_id,
          hubspot_contact_id: contact.hubspot_contact_id
        }
      }
    }
    
    // 4. Obtener bridge_contact si existe
    let bridgeContact: ContactRecord | null = null
    if (opportunity.bridge_contact_id) {
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .select('id, account_id, full_name, email, role_title, seniority, company_id, hubspot_contact_id')
        .eq('id', opportunity.bridge_contact_id)
        .eq('account_id', accountId)
        .single()
      
      if (!contactError && contact) {
        bridgeContact = {
          id: contact.id,
          account_id: contact.account_id,
          full_name: contact.full_name,
          email: contact.email,
          role_title: contact.role_title,
          seniority: contact.seniority,
          company_id: contact.company_id,
          hubspot_contact_id: contact.hubspot_contact_id
        }
      }
    }
    
    return {
      opportunity: {
        id: opportunity.id,
        account_id: opportunity.account_id,
        company_id: opportunity.company_id,
        type: opportunity.type,
        status: opportunity.status,
        target_contact_id: opportunity.target_contact_id,
        bridge_contact_id: opportunity.bridge_contact_id,
        hubspot_deal_id: opportunity.hubspot_deal_id,
        suggested_intro_message: opportunity.suggested_intro_message,
        suggested_outbound_message: opportunity.suggested_outbound_message,
        last_action_at: opportunity.last_action_at
      },
      company: {
        id: company.id,
        account_id: company.account_id,
        name: company.name,
        domain: company.domain,
        industry: company.industry,
        size_bucket: company.size_bucket,
        country: company.country,
        website: company.website,
        hubspot_company_id: company.hubspot_company_id
      },
      target_contact: targetContact,
      bridge_contact: bridgeContact
    }
  } catch (error) {
    console.error(`Exception fetching opportunity context ${opportunityId}:`, error)
    return null
  }
}

/**
 * Actualiza hubspot_company_id en una company
 */
async function updateCompanyHubSpotId(
  companyId: string,
  hubspotCompanyId: string
): Promise<boolean> {
  try {
    const supabase = getSupabaseClient()
    
    const { error } = await supabase
      .from('companies')
      .update({ hubspot_company_id: hubspotCompanyId })
      .eq('id', companyId)
    
    if (error) {
      console.error(`Error updating hubspot_company_id for company ${companyId}:`, error)
      return false
    }
    
    return true
  } catch (error) {
    console.error(`Exception updating hubspot_company_id for company ${companyId}:`, error)
    return false
  }
}

/**
 * Actualiza hubspot_contact_id en un contact
 */
async function updateContactHubSpotId(
  contactId: string,
  hubspotContactId: string
): Promise<boolean> {
  try {
    const supabase = getSupabaseClient()
    
    const { error } = await supabase
      .from('contacts')
      .update({ hubspot_contact_id: hubspotContactId })
      .eq('id', contactId)
    
    if (error) {
      console.error(`Error updating hubspot_contact_id for contact ${contactId}:`, error)
      return false
    }
    
    return true
  } catch (error) {
    console.error(`Exception updating hubspot_contact_id for contact ${contactId}:`, error)
    return false
  }
}

/**
 * Actualiza hubspot_deal_id en una opportunity
 */
async function updateOpportunityHubSpotDealId(
  opportunityId: string,
  hubspotDealId: string
): Promise<boolean> {
  try {
    const supabase = getSupabaseClient()
    
    const { error } = await supabase
      .from('opportunities')
      .update({ hubspot_deal_id: hubspotDealId })
      .eq('id', opportunityId)
    
    if (error) {
      console.error(`Error updating hubspot_deal_id for opportunity ${opportunityId}:`, error)
      return false
    }
    
    return true
  } catch (error) {
    console.error(`Exception updating hubspot_deal_id for opportunity ${opportunityId}:`, error)
    return false
  }
}

// ============================================================================
// HELPERS DE HUBSPOT API
// ============================================================================

/**
 * Realiza una petición HTTP a HubSpot API
 */
async function hubspotApiRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PATCH' | 'PUT',
  apiKey: string,
  body?: any
): Promise<T> {
  const url = `${HUBSPOT_API_BASE_URL}${endpoint}`
  
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  }
  
  const options: RequestInit = {
    method,
    headers
  }
  
  if (body && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
    options.body = JSON.stringify(body)
  }
  
  try {
    const response = await fetch(url, options)
    
    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = `HubSpot API error: ${response.status} ${response.statusText}`
      
      try {
        const errorJson = JSON.parse(errorText)
        errorMessage += ` - ${JSON.stringify(errorJson)}`
      } catch {
        errorMessage += ` - ${errorText}`
      }
      
      // Manejar casos específicos
      if (response.status === 401) {
        throw new Error('HubSpot API authentication failed')
      }
      if (response.status === 429) {
        throw new Error('HubSpot API rate limit exceeded')
      }
      
      throw new Error(errorMessage)
    }
    
    const data = await response.json()
    return data as T
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error(`HubSpot API request failed: ${error}`)
  }
}

/**
 * Busca una company en HubSpot por dominio
 */
async function searchHubSpotCompanyByDomain(
  domain: string,
  apiKey: string
): Promise<string | null> {
  try {
    const searchEndpoint = HUBSPOT_SEARCH_ENDPOINT.replace('{objectType}', 'companies')
    
    const response = await hubspotApiRequest<HubSpotSearchResponse>(
      searchEndpoint,
      'POST',
      apiKey,
      {
        filterGroups: [
          {
            filters: [
              {
                propertyName: 'domain',
                operator: 'EQ',
                value: domain
              }
            ]
          }
        ],
        properties: ['name', 'domain'],
        limit: 1
      }
    )
    
    if (response.results && response.results.length > 0) {
      return response.results[0].id
    }
    
    return null
  } catch (error) {
    console.error(`Error searching HubSpot company by domain ${domain}:`, error)
    return null
  }
}

/**
 * Busca un contact en HubSpot por email
 */
async function searchHubSpotContactByEmail(
  email: string,
  apiKey: string
): Promise<string | null> {
  try {
    const searchEndpoint = HUBSPOT_SEARCH_ENDPOINT.replace('{objectType}', 'contacts')
    
    const response = await hubspotApiRequest<HubSpotSearchResponse>(
      searchEndpoint,
      'POST',
      apiKey,
      {
        filterGroups: [
          {
            filters: [
              {
                propertyName: 'email',
                operator: 'EQ',
                value: email
              }
            ]
          }
        ],
        properties: ['email', 'firstname', 'lastname'],
        limit: 1
      }
    )
    
    if (response.results && response.results.length > 0) {
      return response.results[0].id
    }
    
    return null
  } catch (error) {
    console.error(`Error searching HubSpot contact by email ${email}:`, error)
    return null
  }
}

/**
 * Mapea el status interno a etapa de HubSpot
 */
function mapOpportunityStatusToHubSpotStage(status: string | null): string {
  if (!status) {
    return 'appointmentscheduled' // Default
  }
  
  const statusLower = status.toLowerCase()
  
  // Mapeo de estados internos a etapas de HubSpot
  const statusMap: Record<string, string> = {
    'suggested': 'appointmentscheduled', // Prospecting
    'intro_requested': 'qualifiedtobuy', // Qualification
    'in_progress': 'presentationscheduled', // Presentation Scheduled
    'demo_scheduled': 'presentationscheduled',
    'won': 'closedwon', // Closed Won
    'lost': 'closedlost', // Closed Lost
    'outbound_sent': 'qualifiedtobuy'
  }
  
  // Buscar match exacto o parcial
  for (const [key, value] of Object.entries(statusMap)) {
    if (statusLower.includes(key) || statusLower === key) {
      return value
    }
  }
  
  // Default
  return 'appointmentscheduled'
}

/**
 * Convierte size_bucket a formato de HubSpot (numberofemployees)
 */
function mapSizeBucketToHubSpotEmployees(sizeBucket: string | null): string | undefined {
  if (!sizeBucket) {
    return undefined
  }
  
  const normalized = sizeBucket.toLowerCase()
  
  // Mapeo aproximado
  if (normalized.includes('startup') || normalized.includes('1-10')) {
    return '1-10'
  }
  if (normalized.includes('small') || normalized.includes('11-50')) {
    return '11-50'
  }
  if (normalized.includes('medium') || normalized.includes('51-200')) {
    return '51-200'
  }
  if (normalized.includes('large') || normalized.includes('201-1000')) {
    return '201-1000'
  }
  if (normalized.includes('enterprise') || normalized.includes('1001+')) {
    return '1001-5000'
  }
  
  return undefined
}

// ============================================================================
// FUNCIONES DE SINCRONIZACIÓN CON HUBSPOT
// ============================================================================

/**
 * Asegura que una company existe en HubSpot y retorna su ID
 */
async function ensureHubSpotCompany(
  accountId: string,
  company: CompanyRecord
): Promise<string> {
  const apiKey = await getHubSpotApiKeyForAccount(accountId)
  
  // Si ya tiene hubspot_company_id, intentar actualizar
  if (company.hubspot_company_id) {
    try {
      const payload: HubSpotCompanyPayload = {
        properties: {
          name: company.name
        }
      }
      
      if (company.domain) payload.properties.domain = company.domain
      if (company.industry) payload.properties.industry = company.industry
      if (company.size_bucket) {
        const employees = mapSizeBucketToHubSpotEmployees(company.size_bucket)
        if (employees) payload.properties.numberofemployees = employees
      }
      if (company.country) payload.properties.country = company.country
      if (company.website) payload.properties.website = company.website
      
      await hubspotApiRequest(
        `${HUBSPOT_COMPANIES_ENDPOINT}/${company.hubspot_company_id}`,
        'PATCH',
        apiKey,
        payload
      )
      
      return company.hubspot_company_id
    } catch (error) {
      console.warn(`Error updating HubSpot company ${company.hubspot_company_id}, will try to create new:`, error)
      // Continuar para crear uno nuevo o buscar por dominio
    }
  }
  
  // Buscar por dominio si existe
  if (company.domain) {
    const existingId = await searchHubSpotCompanyByDomain(company.domain, apiKey)
    if (existingId) {
      // Asociar el ID encontrado
      await updateCompanyHubSpotId(company.id, existingId)
      return existingId
    }
  }
  
  // Crear nueva company en HubSpot
  const payload: HubSpotCompanyPayload = {
    properties: {
      name: company.name
    }
  }
  
  if (company.domain) payload.properties.domain = company.domain
  if (company.industry) payload.properties.industry = company.industry
  if (company.size_bucket) {
    const employees = mapSizeBucketToHubSpotEmployees(company.size_bucket)
    if (employees) payload.properties.numberofemployees = employees
  }
  if (company.country) payload.properties.country = company.country
  if (company.website) payload.properties.website = company.website
  
  const response = await hubspotApiRequest<{ id: string }>(
    HUBSPOT_COMPANIES_ENDPOINT,
    'POST',
    apiKey,
    payload
  )
  
  const hubspotCompanyId = response.id
  
  // Guardar el ID en Supabase
  await updateCompanyHubSpotId(company.id, hubspotCompanyId)
  
  return hubspotCompanyId
}

/**
 * Asegura que un contact existe en HubSpot y retorna su ID
 */
async function ensureHubSpotContact(
  accountId: string,
  contact: ContactRecord,
  hubspotCompanyId?: string
): Promise<string> {
  const apiKey = await getHubSpotApiKeyForAccount(accountId)
  
  // Si ya tiene hubspot_contact_id, intentar actualizar
  if (contact.hubspot_contact_id) {
    try {
      const payload: HubSpotContactPayload = {
        properties: {}
      }
      
      // Parsear nombre
      const nameParts = contact.full_name.split(' ')
      if (nameParts.length > 0) {
        payload.properties.firstname = nameParts[0]
        if (nameParts.length > 1) {
          payload.properties.lastname = nameParts.slice(1).join(' ')
        }
      }
      
      if (contact.email) payload.properties.email = contact.email
      if (contact.role_title) payload.properties.jobtitle = contact.role_title
      
      await hubspotApiRequest(
        `${HUBSPOT_CONTACTS_ENDPOINT}/${contact.hubspot_contact_id}`,
        'PATCH',
        apiKey,
        payload
      )
      
      return contact.hubspot_contact_id
    } catch (error) {
      console.warn(`Error updating HubSpot contact ${contact.hubspot_contact_id}, will try to search/create:`, error)
    }
  }
  
  // Buscar por email si existe
  if (contact.email) {
    const existingId = await searchHubSpotContactByEmail(contact.email, apiKey)
    if (existingId) {
      // Asociar el ID encontrado
      await updateContactHubSpotId(contact.id, existingId)
      return existingId
    }
  }
  
  // Crear nuevo contact en HubSpot
  const payload: HubSpotContactPayload = {
    properties: {}
  }
  
  // Parsear nombre
  const nameParts = contact.full_name.split(' ')
  if (nameParts.length > 0) {
    payload.properties.firstname = nameParts[0]
    if (nameParts.length > 1) {
      payload.properties.lastname = nameParts.slice(1).join(' ')
    }
  }
  
  if (contact.email) payload.properties.email = contact.email
  if (contact.role_title) payload.properties.jobtitle = contact.role_title
  
  // Asociar con company si se proporciona
  if (hubspotCompanyId) {
    payload.associations = [
      {
        to: { id: hubspotCompanyId },
        types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 279 }] // Company to Contact
      }
    ]
  }
  
  const response = await hubspotApiRequest<{ id: string }>(
    HUBSPOT_CONTACTS_ENDPOINT,
    'POST',
    apiKey,
    payload
  )
  
  const hubspotContactId = response.id
  
  // Guardar el ID en Supabase
  await updateContactHubSpotId(contact.id, hubspotContactId)
  
  return hubspotContactId
}

/**
 * Crea o actualiza un deal en HubSpot
 */
async function createOrUpdateHubSpotDeal(
  accountId: string,
  opportunity: OpportunityRecord,
  hubspotCompanyId: string,
  hubspotTargetContactId: string | undefined,
  companyName: string
): Promise<string> {
  const apiKey = await getHubSpotApiKeyForAccount(accountId)
  
  const dealStage = mapOpportunityStatusToHubSpotStage(opportunity.status)
  const dealType = opportunity.type === 'intro' ? 'intro' : 'outbound'
  const dealName = `IntroEngine - ${companyName} - ${dealType}`
  
  const payload: HubSpotDealPayload = {
    properties: {
      dealname: dealName,
      dealstage: dealStage,
      pipeline: HUBSPOT_DEFAULT_PIPELINE,
      dealtype: dealType
    },
    associations: [
      {
        to: { id: hubspotCompanyId },
        types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 5 }] // Company to Deal
      }
    ]
  }
  
  // Asociar con contact si existe
  if (hubspotTargetContactId) {
    payload.associations!.push({
      to: { id: hubspotTargetContactId },
      types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 3 }] // Contact to Deal
    })
  }
  
  // Si ya tiene hubspot_deal_id, actualizar
  if (opportunity.hubspot_deal_id) {
    try {
      await hubspotApiRequest(
        `${HUBSPOT_DEALS_ENDPOINT}/${opportunity.hubspot_deal_id}`,
        'PATCH',
        apiKey,
        payload
      )
      
      return opportunity.hubspot_deal_id
    } catch (error) {
      console.warn(`Error updating HubSpot deal ${opportunity.hubspot_deal_id}, will create new:`, error)
    }
  }
  
  // Crear nuevo deal
  const response = await hubspotApiRequest<{ id: string }>(
    HUBSPOT_DEALS_ENDPOINT,
    'POST',
    apiKey,
    payload
  )
  
  const hubspotDealId = response.id
  
  // Guardar el ID en Supabase
  await updateOpportunityHubSpotDealId(opportunity.id, hubspotDealId)
  
  return hubspotDealId
}

// ============================================================================
// FUNCIONES PÚBLICAS PRINCIPALES
// ============================================================================

/**
 * Sincroniza una oportunidad completa a HubSpot
 */
export async function syncOpportunityToHubSpot(
  accountId: string,
  opportunityId: string
): Promise<void> {
  console.log(`[HubSpot Service] Syncing opportunity ${opportunityId} to HubSpot (account: ${accountId})`)
  
  try {
    // 1. Cargar oportunidad con contexto
    const context = await getOpportunityWithContext(accountId, opportunityId)
    if (!context) {
      console.error(`[HubSpot Service] Failed to load opportunity context for ${opportunityId}`)
      return
    }
    
    const { opportunity, company, target_contact } = context
    
    // 2. Asegurar que company existe en HubSpot
    const hubspotCompanyId = await ensureHubSpotCompany(accountId, company)
    
    // 3. Asegurar que target_contact existe en HubSpot (si aplica)
    let hubspotTargetContactId: string | undefined
    if (target_contact) {
      hubspotTargetContactId = await ensureHubSpotContact(accountId, target_contact, hubspotCompanyId)
    }
    
    // 4. Crear o actualizar deal en HubSpot
    await createOrUpdateHubSpotDeal(
      accountId,
      opportunity,
      hubspotCompanyId,
      hubspotTargetContactId,
      company.name
    )
    
    console.log(`[HubSpot Service] Successfully synced opportunity ${opportunityId} to HubSpot`)
  } catch (error) {
    console.error(`[HubSpot Service] Error syncing opportunity ${opportunityId} to HubSpot:`, error)
    // No re-lanzar el error para no romper el batch si se llama desde ahí
  }
}

/**
 * Sincroniza múltiples oportunidades a HubSpot (batch)
 */
export async function syncOpportunitiesBatchToHubSpot(
  accountId: string,
  opportunityIds: string[]
): Promise<{ processed: number; errors: number }> {
  console.log(`[HubSpot Service] Syncing ${opportunityIds.length} opportunities to HubSpot (account: ${accountId})`)
  
  let processed = 0
  let errors = 0
  
  for (const opportunityId of opportunityIds) {
    try {
      await syncOpportunityToHubSpot(accountId, opportunityId)
      processed++
    } catch (error) {
      console.error(`[HubSpot Service] Error syncing opportunity ${opportunityId}:`, error)
      errors++
      // Continuar con la siguiente
    }
  }
  
  console.log(
    `[HubSpot Service] Batch complete: ${processed} processed, ${errors} errors`
  )
  
  return { processed, errors }
}

/**
 * Sincroniza todas las oportunidades pendientes a HubSpot
 */
export async function syncAllPendingOpportunitiesToHubSpot(
  accountId: string
): Promise<{ processed: number; errors: number }> {
  console.log(`[HubSpot Service] Syncing all pending opportunities to HubSpot (account: ${accountId})`)
  
  try {
    const supabase = getSupabaseClient()
    
    // Buscar oportunidades sin hubspot_deal_id o que necesitan sync
    const { data: opportunities, error } = await supabase
      .from('opportunities')
      .select('id')
      .eq('account_id', accountId)
      .or('hubspot_deal_id.is.null,status.neq.won,status.neq.lost')
      .order('created_at', { ascending: false })
      .limit(500) // Limitar para no sobrecargar
    
    if (error) {
      console.error(`[HubSpot Service] Error fetching pending opportunities:`, error)
      return { processed: 0, errors: 1 }
    }
    
    if (!opportunities || opportunities.length === 0) {
      console.log(`[HubSpot Service] No pending opportunities found`)
      return { processed: 0, errors: 0 }
    }
    
    const opportunityIds = opportunities.map(o => o.id)
    
    return await syncOpportunitiesBatchToHubSpot(accountId, opportunityIds)
  } catch (error) {
    console.error(`[HubSpot Service] Fatal error syncing pending opportunities:`, error)
    return { processed: 0, errors: 1 }
  }
}

/**
 * Actualiza el estado de una opportunity desde HubSpot
 * 
 * Útil para webhooks o sincronización inversa
 */
export async function updateOpportunityStatusFromHubSpot(
  accountId: string,
  hubspotDealId: string,
  newStatus: string
): Promise<void> {
  console.log(`[HubSpot Service] Updating opportunity status from HubSpot deal ${hubspotDealId} (account: ${accountId})`)
  
  try {
    const supabase = getSupabaseClient()
    
    // Buscar opportunity por hubspot_deal_id
    const { data: opportunity, error } = await supabase
      .from('opportunities')
      .select('id, status')
      .eq('account_id', accountId)
      .eq('hubspot_deal_id', hubspotDealId)
      .single()
    
    if (error || !opportunity) {
      console.error(`[HubSpot Service] Opportunity not found for HubSpot deal ${hubspotDealId}`)
      return
    }
    
    // Mapear etapa de HubSpot a status interno
    // TODO: Implementar mapeo inverso más completo
    let internalStatus = newStatus.toLowerCase()
    
    const stageToStatusMap: Record<string, string> = {
      'closedwon': 'won',
      'closedlost': 'lost',
      'presentationscheduled': 'in_progress',
      'qualifiedtobuy': 'intro_requested',
      'appointmentscheduled': 'suggested'
    }
    
    for (const [stage, status] of Object.entries(stageToStatusMap)) {
      if (internalStatus.includes(stage)) {
        internalStatus = status
        break
      }
    }
    
    // Actualizar status y last_action_at
    const { error: updateError } = await supabase
      .from('opportunities')
      .update({
        status: internalStatus,
        last_action_at: new Date().toISOString()
      })
      .eq('id', opportunity.id)
    
    if (updateError) {
      console.error(`[HubSpot Service] Error updating opportunity ${opportunity.id}:`, updateError)
      return
    }
    
    console.log(`[HubSpot Service] Successfully updated opportunity ${opportunity.id} status to ${internalStatus}`)
  } catch (error) {
    console.error(`[HubSpot Service] Fatal error updating opportunity status from HubSpot:`, error)
    // No re-lanzar el error
  }
}

// ============================================================================
// EXPORT DEFAULT (opcional, para facilitar importación)
// ============================================================================

export default {
  syncOpportunityToHubSpot,
  syncOpportunitiesBatchToHubSpot,
  syncAllPendingOpportunitiesToHubSpot,
  updateOpportunityStatusFromHubSpot
}
