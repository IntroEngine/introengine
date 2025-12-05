/**
 * Relationship Engine de IntroEngine
 * 
 * Motor principal para detectar oportunidades de intro (referidos) entre
 * contactos del usuario (bridge contacts) y contactos objetivo (target contacts).
 * 
 * Soporta 3 tipos de rutas:
 * - DIRECT: el usuario conoce directamente a alguien que puede presentar
 * - SECOND_LEVEL: el usuario conoce a alguien que conoce al target
 * - INFERRED: la IA infiere relación probable basada en datos
 */

import { createClient } from '@/config/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export type RouteType = 'direct' | 'second_level' | 'inferred'

export interface BridgeContact {
  id: string
  full_name: string
  email: string | null
  company_id: string | null
  company_name: string | null
  role_title: string | null
  seniority: string | null
  previous_companies: string[] | null
  previous_roles: string[] | null
  linkedin_url: string | null
  type: string | null
}

export interface TargetContact {
  id: string
  full_name: string
  email: string | null
  company_id: string | null
  company_name: string | null
  role_title: string | null
  seniority: string | null
  previous_companies: string[] | null
  previous_roles: string[] | null
  linkedin_url: string | null
}

export interface Company {
  id: string
  name: string
  domain: string | null
  industry: string | null
  size_bucket: string | null
  country: string | null
  website: string | null
  status: string | null
}

export interface Relationship {
  contact_id_1: string
  contact_id_2: string
  relationship_type: string
  strength: number | null
  notes: string | null
}

export interface RelationshipContext {
  company: {
    id: string
    name: string
    industry: string | null
    size_bucket: string | null
    country: string | null
  }
  bridge_contacts: Array<{
    id: string
    full_name: string
    email: string | null
    role_title: string | null
    seniority: string | null
    company_name: string | null
    previous_companies: string[] | null
  }>
  target_candidates: Array<{
    id: string
    full_name: string
    email: string | null
    role_title: string | null
    seniority: string | null
    company_name: string | null
    previous_companies: string[] | null
  }>
  known_relationships: Array<{
    contact_id_1: string
    contact_id_2: string
    relationship_type: string
    strength: number | null
  }>
}

export interface BridgeContactAI {
  id: string
  full_name: string
}

export interface BestRouteAI {
  type: RouteType
  bridge_contact: BridgeContactAI | null
  confidence: number
  why: string
}

export interface IntroOpportunityAI {
  company_id: string
  target: {
    id: string
    full_name: string
    role_title: string
    seniority: string
  }
  best_route: BestRouteAI
  suggested_intro_message: string
  score: {
    intro_strength_score: number
  }
}

export interface IntroOpportunitiesAIResponse {
  opportunities: IntroOpportunityAI[]
}

export interface ExistingOpportunity {
  id: string
  company_id: string
  target_contact_id: string | null
  bridge_contact_id: string | null
  type: string
  status: string
}

// ============================================================================
// HELPERS DE ACCESO A DATOS
// ============================================================================

/**
 * Obtiene el cliente de Supabase
 */
function getSupabaseClient(): SupabaseClient {
  return createClient()
}

/**
 * Obtiene una company con su contexto completo
 */
async function getCompanyWithContext(
  accountId: string,
  companyId: string
): Promise<Company | null> {
  try {
    const supabase = getSupabaseClient()
    
    const { data, error } = await supabase
      .from('companies')
      .select('id, name, domain, industry, size_bucket, country, website, status')
      .eq('id', companyId)
      .eq('account_id', accountId)
      .single()
    
    if (error) {
      console.error(`Error fetching company ${companyId}:`, error)
      return null
    }
    
    return data as Company
  } catch (error) {
    console.error(`Exception fetching company ${companyId}:`, error)
    return null
  }
}

/**
 * Obtiene todos los contactos del account
 */
async function getAccountContacts(accountId: string): Promise<BridgeContact[]> {
  try {
    const supabase = getSupabaseClient()
    
    const { data, error } = await supabase
      .from('contacts')
      .select('id, full_name, email, company_id, company_name, role_title, seniority, previous_companies, previous_roles, linkedin_url, type')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error(`Error fetching contacts for account ${accountId}:`, error)
      return []
    }
    
    return (data || []).map(contact => ({
      id: contact.id,
      full_name: contact.full_name,
      email: contact.email,
      company_id: contact.company_id,
      company_name: contact.company_name || null,
      role_title: contact.role_title,
      seniority: contact.seniority,
      previous_companies: contact.previous_companies || null,
      previous_roles: contact.previous_roles || null,
      linkedin_url: contact.linkedin_url,
      type: contact.type
    }))
  } catch (error) {
    console.error(`Exception fetching contacts for account ${accountId}:`, error)
    return []
  }
}

/**
 * Obtiene las relaciones conocidas entre contactos
 */
async function getKnownRelationships(
  accountId: string,
  contactIds: string[]
): Promise<Relationship[]> {
  if (contactIds.length === 0) {
    return []
  }
  
  try {
    const supabase = getSupabaseClient()
    
    // Buscar relaciones donde alguno de los contactos esté involucrado
    const { data, error } = await supabase
      .from('contact_relationships')
      .select('contact_id_1, contact_id_2, relationship_type, strength, notes')
      .eq('account_id', accountId)
      .in('contact_id_1', contactIds)
      .or(`contact_id_2.in.(${contactIds.join(',')})`)
    
    if (error) {
      console.error(`Error fetching relationships for account ${accountId}:`, error)
      return []
    }
    
    return (data || []).map(rel => ({
      contact_id_1: rel.contact_id_1,
      contact_id_2: rel.contact_id_2,
      relationship_type: rel.relationship_type,
      strength: rel.strength,
      notes: rel.notes
    }))
  } catch (error) {
    console.error(`Exception fetching relationships for account ${accountId}:`, error)
    return []
  }
}

/**
 * Obtiene oportunidades existentes para una company
 */
async function getExistingOpportunitiesForCompany(
  accountId: string,
  companyId: string
): Promise<ExistingOpportunity[]> {
  try {
    const supabase = getSupabaseClient()
    
    const { data, error } = await supabase
      .from('opportunities')
      .select('id, company_id, target_contact_id, bridge_contact_id, type, status')
      .eq('account_id', accountId)
      .eq('company_id', companyId)
      .eq('type', 'intro')
    
    if (error) {
      console.error(`Error fetching existing opportunities for company ${companyId}:`, error)
      return []
    }
    
    return (data || []).map(opp => ({
      id: opp.id,
      company_id: opp.company_id,
      target_contact_id: opp.target_contact_id,
      bridge_contact_id: opp.bridge_contact_id,
      type: opp.type,
      status: opp.status
    }))
  } catch (error) {
    console.error(`Exception fetching existing opportunities for company ${companyId}:`, error)
    return []
  }
}

/**
 * Separa contactos en bridge contacts y target candidates
 */
function separateContacts(
  allContacts: BridgeContact[],
  companyId: string
): {
  bridgeContacts: BridgeContact[]
  targetCandidates: TargetContact[]
} {
  const bridgeContacts: BridgeContact[] = []
  const targetCandidates: TargetContact[] = []
  
  for (const contact of allContacts) {
    // Si el contacto está asociado a la company objetivo, es un target candidate
    if (contact.company_id === companyId) {
      targetCandidates.push({
        id: contact.id,
        full_name: contact.full_name,
        email: contact.email,
        company_id: contact.company_id,
        company_name: contact.company_name,
        role_title: contact.role_title,
        seniority: contact.seniority,
        previous_companies: contact.previous_companies,
        previous_roles: contact.previous_roles,
        linkedin_url: contact.linkedin_url
      })
    } else {
      // Si es tipo "bridge" o sin tipo pero pertenece al account, es un bridge contact
      if (contact.type === 'bridge' || contact.type === null || contact.type === '') {
        bridgeContacts.push(contact)
      }
    }
  }
  
  return { bridgeContacts, targetCandidates }
}

/**
 * Construye el contexto JSON para pasar a OpenAI
 */
function buildRelationshipContext(
  company: Company,
  bridgeContacts: BridgeContact[],
  targetCandidates: TargetContact[],
  relationships: Relationship[]
): RelationshipContext {
  return {
    company: {
      id: company.id,
      name: company.name,
      industry: company.industry,
      size_bucket: company.size_bucket,
      country: company.country
    },
    bridge_contacts: bridgeContacts.map(bc => ({
      id: bc.id,
      full_name: bc.full_name,
      email: bc.email,
      role_title: bc.role_title,
      seniority: bc.seniority,
      company_name: bc.company_name,
      previous_companies: bc.previous_companies || []
    })),
    target_candidates: targetCandidates.map(tc => ({
      id: tc.id,
      full_name: tc.full_name,
      email: tc.email,
      role_title: tc.role_title,
      seniority: tc.seniority,
      company_name: tc.company_name,
      previous_companies: tc.previous_companies || []
    })),
    known_relationships: relationships.map(rel => ({
      contact_id_1: rel.contact_id_1,
      contact_id_2: rel.contact_id_2,
      relationship_type: rel.relationship_type,
      strength: rel.strength
    }))
  }
}

// ============================================================================
// INTEGRACIÓN CON OPENAI
// ============================================================================

/**
 * Llama a OpenAI para analizar relaciones y generar oportunidades
 * 
 * Usa el helper de OpenAI desde services/ai/openai-helper
 */
async function callRelationshipEngineAI(
  context: RelationshipContext
): Promise<IntroOpportunitiesAIResponse> {
  // TODO: Importar y usar el helper real cuando esté implementado
  // import { callRelationshipEngineAI as callOpenAI } from './ai/openai-helper'
  // return await callOpenAI(context)
  
  try {
    // Por ahora, usar implementación temporal
    // Esto debe ser reemplazado con la llamada real a OpenAI
    console.warn('TODO: Implementar llamada real a OpenAI usando services/ai/openai-helper')
    
    // Retornar estructura vacía temporalmente
    return { opportunities: [] }
  } catch (error) {
    console.error('Error calling OpenAI for relationship analysis:', error)
    throw error
  }
}

/**
 * Parsea y valida la respuesta de OpenAI
 */
function parseAndValidateAIResponse(
  response: any
): IntroOpportunitiesAIResponse | null {
  try {
    // Validar estructura básica
    if (!response || typeof response !== 'object') {
      console.error('Invalid AI response: not an object')
      return null
    }
    
    if (!Array.isArray(response.opportunities)) {
      console.error('Invalid AI response: opportunities is not an array')
      return null
    }
    
    // Validar cada oportunidad
    const validOpportunities: IntroOpportunityAI[] = []
    
    for (const opp of response.opportunities) {
      // Validaciones básicas
      if (!opp.company_id || !opp.target || !opp.best_route || !opp.score) {
        console.warn('Skipping invalid opportunity:', opp)
        continue
      }
      
      if (!opp.target.id || !opp.target.full_name) {
        console.warn('Skipping opportunity with invalid target:', opp)
        continue
      }
      
      if (!['direct', 'second_level', 'inferred'].includes(opp.best_route.type)) {
        console.warn('Skipping opportunity with invalid route type:', opp)
        continue
      }
      
      if (typeof opp.best_route.confidence !== 'number' || 
          opp.best_route.confidence < 0 || opp.best_route.confidence > 100) {
        console.warn('Skipping opportunity with invalid confidence:', opp)
        continue
      }
      
      if (typeof opp.score.intro_strength_score !== 'number' ||
          opp.score.intro_strength_score < 0 || opp.score.intro_strength_score > 100) {
        console.warn('Skipping opportunity with invalid score:', opp)
        continue
      }
      
      // Filtrar por umbrales mínimos
      if (opp.best_route.confidence >= 30 && opp.score.intro_strength_score >= 30) {
        validOpportunities.push(opp)
      }
    }
    
    return { opportunities: validOpportunities }
  } catch (error) {
    console.error('Error parsing AI response:', error)
    return null
  }
}

// ============================================================================
// PERSISTENCIA EN SUPABASE
// ============================================================================

/**
 * Crea o actualiza una oportunidad en Supabase
 */
async function upsertOpportunity(
  accountId: string,
  opportunity: IntroOpportunityAI,
  existingOpportunities: ExistingOpportunity[]
): Promise<string | null> {
  try {
    const supabase = getSupabaseClient()
    
    // Buscar si ya existe una oportunidad para esta combinación
    const existing = existingOpportunities.find(
      eo => eo.target_contact_id === opportunity.target.id &&
            eo.bridge_contact_id === opportunity.best_route.bridge_contact?.id
    )
    
    const opportunityData = {
      account_id: accountId,
      company_id: opportunity.company_id,
      target_contact_id: opportunity.target.id,
      bridge_contact_id: opportunity.best_route.bridge_contact?.id || null,
      type: 'intro',
      status: 'suggested',
      suggested_intro_message: opportunity.suggested_intro_message,
      route_type: opportunity.best_route.type,
      route_confidence: opportunity.best_route.confidence,
      route_explanation: opportunity.best_route.why,
      updated_at: new Date().toISOString()
    }
    
    if (existing) {
      // Actualizar oportunidad existente
      const { data, error } = await supabase
        .from('opportunities')
        .update(opportunityData)
        .eq('id', existing.id)
        .select('id')
        .single()
      
      if (error) {
        console.error(`Error updating opportunity ${existing.id}:`, error)
        return null
      }
      
      return data.id
    } else {
      // Crear nueva oportunidad
      const { data, error } = await supabase
        .from('opportunities')
        .insert({
          ...opportunityData,
          created_at: new Date().toISOString()
        })
        .select('id')
        .single()
      
      if (error) {
        console.error('Error creating opportunity:', error)
        return null
      }
      
      return data.id
    }
  } catch (error) {
    console.error('Exception upserting opportunity:', error)
    return null
  }
}

/**
 * Crea o actualiza el score asociado a una oportunidad
 */
async function upsertOpportunityScore(
  opportunityId: string,
  score: { intro_strength_score: number }
): Promise<boolean> {
  try {
    const supabase = getSupabaseClient()
    
    // Buscar si ya existe un score para esta oportunidad
    const { data: existingScore } = await supabase
      .from('scores')
      .select('id')
      .eq('opportunity_id', opportunityId)
      .single()
    
    const scoreData = {
      opportunity_id: opportunityId,
      intro_strength_score: score.intro_strength_score,
      updated_at: new Date().toISOString()
    }
    
    if (existingScore) {
      // Actualizar score existente
      const { error } = await supabase
        .from('scores')
        .update(scoreData)
        .eq('id', existingScore.id)
      
      if (error) {
        console.error(`Error updating score for opportunity ${opportunityId}:`, error)
        return false
      }
    } else {
      // Crear nuevo score
      const { error } = await supabase
        .from('scores')
        .insert({
          ...scoreData,
          created_at: new Date().toISOString()
        })
      
      if (error) {
        console.error(`Error creating score for opportunity ${opportunityId}:`, error)
        return false
      }
    }
    
    return true
  } catch (error) {
    console.error(`Exception upserting score for opportunity ${opportunityId}:`, error)
    return false
  }
}

/**
 * Persiste las oportunidades generadas por la IA en Supabase
 */
async function upsertIntroOpportunitiesFromAI(
  accountId: string,
  companyId: string,
  aiResult: IntroOpportunitiesAIResponse,
  existingOpportunities: ExistingOpportunity[]
): Promise<{ created: number; updated: number; errors: number }> {
  let created = 0
  let updated = 0
  let errors = 0
  
  for (const opportunity of aiResult.opportunities) {
    try {
      // Validar que la company_id coincida
      if (opportunity.company_id !== companyId) {
        console.warn(`Skipping opportunity with mismatched company_id: ${opportunity.company_id} vs ${companyId}`)
        errors++
        continue
      }
      
      // Upsert oportunidad
      const opportunityId = await upsertOpportunity(accountId, opportunity, existingOpportunities)
      
      if (!opportunityId) {
        errors++
        continue
      }
      
      // Determinar si fue creación o actualización
      const existing = existingOpportunities.find(
        eo => eo.target_contact_id === opportunity.target.id &&
              eo.bridge_contact_id === opportunity.best_route.bridge_contact?.id
      )
      
      if (existing) {
        updated++
      } else {
        created++
      }
      
      // Upsert score
      const scoreSuccess = await upsertOpportunityScore(opportunityId, opportunity.score)
      
      if (!scoreSuccess) {
        console.warn(`Failed to upsert score for opportunity ${opportunityId}`)
        // No contamos esto como error fatal, la oportunidad ya está creada
      }
    } catch (error) {
      console.error(`Error processing opportunity for target ${opportunity.target.id}:`, error)
      errors++
    }
  }
  
  return { created, updated, errors }
}

// ============================================================================
// FUNCIONES PÚBLICAS PRINCIPALES
// ============================================================================

/**
 * Encuentra oportunidades de intro para una empresa específica
 */
export async function findIntroOpportunitiesForCompany(
  accountId: string,
  companyId: string
): Promise<void> {
  console.log(`[Relationship Engine] Finding intro opportunities for company ${companyId} (account: ${accountId})`)
  
  try {
    // 1. Leer datos desde Supabase
    const company = await getCompanyWithContext(accountId, companyId)
    if (!company) {
      console.error(`Company ${companyId} not found or not accessible`)
      return
    }
    
    const allContacts = await getAccountContacts(accountId)
    if (allContacts.length === 0) {
      console.warn(`No contacts found for account ${accountId}`)
      return
    }
    
    // 2. Separar contactos
    const { bridgeContacts, targetCandidates } = separateContacts(allContacts, companyId)
    
    if (bridgeContacts.length === 0) {
      console.warn(`No bridge contacts found for account ${accountId}`)
      return
    }
    
    if (targetCandidates.length === 0) {
      console.warn(`No target candidates found for company ${companyId}`)
      // TODO: Aquí se podría implementar lógica para identificar targets potenciales
      // basándose en datos externos o inferencias de la IA
      return
    }
    
    // 3. Obtener relaciones conocidas
    const allContactIds = [...bridgeContacts, ...targetCandidates].map(c => c.id)
    const relationships = await getKnownRelationships(accountId, allContactIds)
    
    // 4. Obtener oportunidades existentes
    const existingOpportunities = await getExistingOpportunitiesForCompany(accountId, companyId)
    
    // 5. Construir contexto para OpenAI
    const context = buildRelationshipContext(
      company,
      bridgeContacts,
      targetCandidates,
      relationships
    )
    
    // 6. Llamar a OpenAI
    let aiResponse: IntroOpportunitiesAIResponse
    try {
      aiResponse = await callRelationshipEngineAI(context)
    } catch (error) {
      console.error(`Error calling OpenAI for company ${companyId}:`, error)
      return
    }
    
    // 7. Parsear y validar respuesta
    const validatedResponse = parseAndValidateAIResponse(aiResponse)
    if (!validatedResponse || validatedResponse.opportunities.length === 0) {
      console.warn(`No valid opportunities found for company ${companyId}`)
      return
    }
    
    // 8. Persistir resultados
    const result = await upsertIntroOpportunitiesFromAI(
      accountId,
      companyId,
      validatedResponse,
      existingOpportunities
    )
    
    console.log(
      `[Relationship Engine] Processed company ${companyId}: ` +
      `${result.created} created, ${result.updated} updated, ${result.errors} errors`
    )
  } catch (error) {
    console.error(`[Relationship Engine] Fatal error processing company ${companyId}:`, error)
    // No re-lanzar el error para no romper el batch si se llama desde ahí
  }
}

/**
 * Encuentra oportunidades de intro para múltiples empresas (batch)
 */
export async function findIntroOpportunitiesForCompanies(
  accountId: string,
  companyIds: string[]
): Promise<{ processed: number; errors: number }> {
  console.log(`[Relationship Engine] Processing ${companyIds.length} companies for account ${accountId}`)
  
  let processed = 0
  let errors = 0
  
  for (const companyId of companyIds) {
    try {
      await findIntroOpportunitiesForCompany(accountId, companyId)
      processed++
    } catch (error) {
      console.error(`Error processing company ${companyId}:`, error)
      errors++
      // Continuar con la siguiente empresa
    }
  }
  
  console.log(
    `[Relationship Engine] Batch complete: ${processed} processed, ${errors} errors`
  )
  
  return { processed, errors }
}

/**
 * Recalcula oportunidades de intro para todas las empresas activas de una cuenta
 */
export async function recalculateIntroOpportunitiesForAccount(
  accountId: string
): Promise<{ processed: number; errors: number }> {
  console.log(`[Relationship Engine] Recalculating opportunities for account ${accountId}`)
  
  try {
    const supabase = getSupabaseClient()
    
    // Obtener todas las empresas activas del account
    const { data: companies, error } = await supabase
      .from('companies')
      .select('id')
      .eq('account_id', accountId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error(`Error fetching companies for account ${accountId}:`, error)
      return { processed: 0, errors: 1 }
    }
    
    if (!companies || companies.length === 0) {
      console.warn(`No active companies found for account ${accountId}`)
      return { processed: 0, errors: 0 }
    }
    
    const companyIds = companies.map(c => c.id)
    
    return await findIntroOpportunitiesForCompanies(accountId, companyIds)
  } catch (error) {
    console.error(`Fatal error recalculating opportunities for account ${accountId}:`, error)
    return { processed: 0, errors: 1 }
  }
}

// ============================================================================
// EXPORT DEFAULT (opcional, para facilitar importación)
// ============================================================================

export default {
  findIntroOpportunitiesForCompany,
  findIntroOpportunitiesForCompanies,
  recalculateIntroOpportunitiesForAccount
}
