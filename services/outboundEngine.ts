/**
 * Outbound Engine de IntroEngine
 * 
 * Motor para generar oportunidades de outbound inteligente cuando NO existe
 * un puente (intro) viable. Genera mensajes personalizados por empresa + rol objetivo + señales de compra.
 */

import { createClient } from '@/config/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

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

export interface BuyingSignal {
  type: 'hiring' | 'growth' | 'operational_chaos' | 'hr_shortage' | 'expansion' | 'compliance_issues' | 'manual_processes'
  description: string | null
  strength: 'low' | 'medium' | 'high'
}

export interface OutboundContext {
  company: {
    id: string
    name: string
    industry: string | null
    size_bucket: string | null
    country: string | null
    domain: string | null
  }
  target_role: string
  buying_signals: BuyingSignal[]
  has_intro_opportunities: boolean
  metadata: {
    intro_opportunities_count: number
    last_intro_activity: string | null
  }
}

export interface OutboundAIResponse {
  outbound: {
    short: string
    long: string
    cta: string
    reason_now: string
  }
  score: {
    lead_potential_score: number
  }
}

export interface ExistingOutboundOpportunity {
  id: string
  company_id: string
  target_contact_id: string | null
  status: string
  suggested_outbound_message: string | null
  last_action_at: string | null
}

export interface ExistingIntroOpportunity {
  id: string
  company_id: string
  status: string
  created_at: string
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
 * Obtiene una company con su información completa
 */
async function getCompany(accountId: string, companyId: string): Promise<Company | null> {
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
 * Obtiene contactos asociados a una empresa
 */
async function getCompanyContacts(accountId: string, companyId: string): Promise<any[]> {
  try {
    const supabase = getSupabaseClient()
    
    const { data, error } = await supabase
      .from('contacts')
      .select('id, full_name, role_title, seniority')
      .eq('account_id', accountId)
      .eq('company_id', companyId)
    
    if (error) {
      console.error(`Error fetching contacts for company ${companyId}:`, error)
      return []
    }
    
    return data || []
  } catch (error) {
    console.error(`Exception fetching contacts for company ${companyId}:`, error)
    return []
  }
}

/**
 * Verifica si hay oportunidades de intro existentes para una empresa
 */
async function getExistingIntroOpportunities(
  accountId: string,
  companyId: string
): Promise<ExistingIntroOpportunity[]> {
  try {
    const supabase = getSupabaseClient()
    
    const { data, error } = await supabase
      .from('opportunities')
      .select('id, company_id, status, created_at')
      .eq('account_id', accountId)
      .eq('company_id', companyId)
      .eq('type', 'intro')
      .in('status', ['suggested', 'intro_requested', 'in_progress'])
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error(`Error fetching intro opportunities for company ${companyId}:`, error)
      return []
    }
    
    return (data || []).map(opp => ({
      id: opp.id,
      company_id: opp.company_id,
      status: opp.status,
      created_at: opp.created_at
    }))
  } catch (error) {
    console.error(`Exception fetching intro opportunities for company ${companyId}:`, error)
    return []
  }
}

/**
 * Obtiene oportunidad outbound existente para una empresa
 */
async function getExistingOutboundOpportunity(
  accountId: string,
  companyId: string
): Promise<ExistingOutboundOpportunity | null> {
  try {
    const supabase = getSupabaseClient()
    
    const { data, error } = await supabase
      .from('opportunities')
      .select('id, company_id, target_contact_id, status, suggested_outbound_message, last_action_at')
      .eq('account_id', accountId)
      .eq('company_id', companyId)
      .eq('type', 'outbound')
      .in('status', ['suggested', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    
    if (error) {
      console.error(`Error fetching outbound opportunity for company ${companyId}:`, error)
      return null
    }
    
    if (!data) {
      return null
    }
    
    return {
      id: data.id,
      company_id: data.company_id,
      target_contact_id: data.target_contact_id,
      status: data.status,
      suggested_outbound_message: data.suggested_outbound_message,
      last_action_at: data.last_action_at
    }
  } catch (error) {
    console.error(`Exception fetching outbound opportunity for company ${companyId}:`, error)
    return null
  }
}

/**
 * Determina el rol objetivo estándar para una empresa
 * 
 * Lógica simple: para pymes (startup/small) → CEO/Owner/Operations
 * Para empresas medianas → puede ser RRHH o Operations
 * TODO: Mejorar esta lógica con más reglas de negocio
 */
function getDefaultTargetRoleForCompany(company: Company): string {
  const sizeBucket = company.size_bucket?.toLowerCase() || ''
  const industry = company.industry?.toLowerCase() || ''
  
  // Para startups y pequeñas empresas, el decisor suele ser CEO/Owner
  if (sizeBucket.includes('startup') || sizeBucket.includes('small') || sizeBucket.includes('pequeña')) {
    // Si es industria de servicios/retail, puede ser Operations
    if (industry.includes('retail') || industry.includes('servicios') || industry.includes('comercio')) {
      return 'Director de Operaciones'
    }
    return 'CEO'
  }
  
  // Para empresas medianas, puede ser RRHH o Operations
  if (sizeBucket.includes('medium') || sizeBucket.includes('mediana')) {
    // Si la industria sugiere necesidad de RRHH
    if (industry.includes('retail') || industry.includes('servicios') || industry.includes('manufactura')) {
      return 'Responsable de RRHH'
    }
    return 'Director de Operaciones'
  }
  
  // Default para empresas grandes
  return 'Responsable de RRHH'
}

/**
 * Lee señales de compra para una empresa
 * 
 * TODO: Implementar lectura desde tabla de buying_signals cuando esté disponible
 * Por ahora, simula señales básicas basadas en datos de la empresa
 */
async function getBuyingSignalsForCompany(
  accountId: string,
  companyId: string
): Promise<BuyingSignal[]> {
  // TODO: Leer desde tabla buying_signals cuando esté disponible
  // Por ahora, retornar array vacío o señales simuladas
  
  try {
    // Placeholder: en el futuro leer desde tabla buying_signals
    // const supabase = getSupabaseClient()
    // const { data } = await supabase
    //   .from('buying_signals')
    //   .select('*')
    //   .eq('account_id', accountId)
    //   .eq('company_id', companyId)
    //   .eq('status', 'active')
    
    // Por ahora, retornar array vacío
    return []
  } catch (error) {
    console.error(`Exception fetching buying signals for company ${companyId}:`, error)
    return []
  }
}

/**
 * Construye el contexto para la IA de outbound
 */
async function buildOutboundContextForCompany(
  accountId: string,
  companyId: string
): Promise<OutboundContext | null> {
  try {
    // 1. Leer company
    const company = await getCompany(accountId, companyId)
    if (!company) {
      return null
    }
    
    // 2. Determinar rol objetivo
    const targetRole = getDefaultTargetRoleForCompany(company)
    
    // 3. Leer señales de compra
    const buyingSignals = await getBuyingSignalsForCompany(accountId, companyId)
    
    // 4. Leer oportunidades de intro existentes
    const introOpportunities = await getExistingIntroOpportunities(accountId, companyId)
    const hasIntroOpportunities = introOpportunities.length > 0
    const lastIntroActivity = introOpportunities.length > 0 
      ? introOpportunities[0].created_at 
      : null
    
    return {
      company: {
        id: company.id,
        name: company.name,
        industry: company.industry,
        size_bucket: company.size_bucket,
        country: company.country,
        domain: company.domain
      },
      target_role: targetRole,
      buying_signals: buyingSignals,
      has_intro_opportunities: hasIntroOpportunities,
      metadata: {
        intro_opportunities_count: introOpportunities.length,
        last_intro_activity: lastIntroActivity
      }
    }
  } catch (error) {
    console.error(`Exception building outbound context for company ${companyId}:`, error)
    return null
  }
}

// ============================================================================
// INTEGRACIÓN CON OPENAI
// ============================================================================

/**
 * Llama a OpenAI para generar mensaje outbound personalizado
 * 
 * Usa el helper de OpenAI desde services/ai/openai-helper
 */
async function callOutboundEngineAI(
  context: OutboundContext
): Promise<OutboundAIResponse> {
  try {
    // Importar y usar el helper real de OpenAI
    const { callOutboundEngineAI } = await import('./ai/openai-helper')
    
    // El contexto ya está en el formato correcto
    return await callOutboundEngineAI(context)
  } catch (error) {
    console.error('Error calling OpenAI for outbound generation:', error)
    throw error
  }
}

/**
 * Valida la respuesta de OpenAI
 */
function validateOutboundAIResponse(response: OutboundAIResponse): boolean {
  if (!response.outbound) {
    console.error('Invalid AI response: missing outbound')
    return false
  }
  
  if (!response.outbound.short && !response.outbound.long) {
    console.error('Invalid AI response: missing outbound message')
    return false
  }
  
  if (typeof response.score?.lead_potential_score !== 'number' ||
      response.score.lead_potential_score < 0 ||
      response.score.lead_potential_score > 100) {
    console.error('Invalid AI response: invalid lead_potential_score')
    return false
  }
  
  return true
}

// ============================================================================
// PERSISTENCIA EN SUPABASE
// ============================================================================

/**
 * Crea o actualiza una oportunidad outbound en Supabase
 */
async function upsertOutboundOpportunity(
  accountId: string,
  companyId: string,
  outboundAIResponse: OutboundAIResponse,
  outboundContext: OutboundContext,
  existingOpportunity: ExistingOutboundOpportunity | null
): Promise<string | null> {
  try {
    const supabase = getSupabaseClient()
    
    // Usar versión long del mensaje (más completa)
    const suggestedMessage = outboundAIResponse.outbound.long || outboundAIResponse.outbound.short
    
    const opportunityData = {
      account_id: accountId,
      company_id: companyId,
      type: 'outbound',
      status: 'suggested',
      target_contact_id: null, // Puede quedar null si no conocemos el decisor específico
      suggested_outbound_message: suggestedMessage,
      outbound_short: outboundAIResponse.outbound.short,
      outbound_long: outboundAIResponse.outbound.long,
      outbound_cta: outboundAIResponse.outbound.cta,
      outbound_reason_now: outboundAIResponse.outbound.reason_now,
      target_role: outboundContext.target_role,
      last_action_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    if (existingOpportunity) {
      // Actualizar oportunidad existente
      const { data, error } = await supabase
        .from('opportunities')
        .update(opportunityData)
        .eq('id', existingOpportunity.id)
        .select('id')
        .single()
      
      if (error) {
        console.error(`Error updating outbound opportunity ${existingOpportunity.id}:`, error)
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
        console.error('Error creating outbound opportunity:', error)
        return null
      }
      
      return data.id
    }
  } catch (error) {
    console.error('Exception upserting outbound opportunity:', error)
    return null
  }
}

/**
 * Crea o actualiza el score asociado a una oportunidad outbound
 */
async function upsertOutboundOpportunityScore(
  opportunityId: string,
  score: { lead_potential_score: number }
): Promise<boolean> {
  try {
    const supabase = getSupabaseClient()
    
    // Buscar si ya existe un score para esta oportunidad
    const { data: existingScore } = await supabase
      .from('scores')
      .select('id')
      .eq('opportunity_id', opportunityId)
      .maybeSingle()
    
    const scoreData = {
      opportunity_id: opportunityId,
      lead_potential_score: score.lead_potential_score,
      industry_fit_score: null, // TODO: Calcular si es necesario
      buying_signal_score: null, // TODO: Calcular si es necesario
      intro_strength_score: null, // No aplica para outbound
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

// ============================================================================
// FUNCIONES PÚBLICAS PRINCIPALES
// ============================================================================

/**
 * Crea una oportunidad outbound para una empresa específica
 */
export async function createOutboundOpportunityForCompany(
  accountId: string,
  companyId: string
): Promise<void> {
  console.log(`[Outbound Engine] Creating outbound opportunity for company ${companyId} (account: ${accountId})`)
  
  try {
    // 1. Verificar si ya existe una outbound reciente
    const existingOutbound = await getExistingOutboundOpportunity(accountId, companyId)
    if (existingOutbound) {
      const lastActionDate = existingOutbound.last_action_at 
        ? new Date(existingOutbound.last_action_at)
        : null
      const daysSinceLastAction = lastActionDate
        ? Math.floor((Date.now() - lastActionDate.getTime()) / (1000 * 60 * 60 * 24))
        : null
      
      // Si hay una outbound reciente (menos de 7 días), no crear otra
      if (daysSinceLastAction !== null && daysSinceLastAction < 7) {
        console.log(`[Outbound Engine] Skipping company ${companyId}: recent outbound exists (${daysSinceLastAction} days ago)`)
        return
      }
    }
    
    // 2. Verificar oportunidades de intro existentes
    const introOpportunities = await getExistingIntroOpportunities(accountId, companyId)
    
    // 3. Si hay intros viables, evaluar si aún así hacer outbound
    // Por ahora, si hay intros activas, no crear outbound (regla simple)
    // TODO: Mejorar esta lógica con scoring más sofisticado
    if (introOpportunities.length > 0) {
      console.log(`[Outbound Engine] Company ${companyId} has ${introOpportunities.length} intro opportunities. Skipping outbound.`)
      // Opcional: podríamos crear outbound si el scoring justifica, pero por ahora skip
      return
    }
    
    // 4. Construir contexto para IA
    const outboundContext = await buildOutboundContextForCompany(accountId, companyId)
    if (!outboundContext) {
      console.error(`[Outbound Engine] Failed to build context for company ${companyId}`)
      return
    }
    
    // 5. Llamar a OpenAI
    let aiResponse: OutboundAIResponse
    try {
      aiResponse = await callOutboundEngineAI(outboundContext)
    } catch (error) {
      console.error(`[Outbound Engine] Error calling OpenAI for company ${companyId}:`, error)
      return
    }
    
    // 6. Validar respuesta
    if (!validateOutboundAIResponse(aiResponse)) {
      console.error(`[Outbound Engine] Invalid AI response for company ${companyId}`)
      return
    }
    
    // 7. Persistir en Supabase
    const opportunityId = await upsertOutboundOpportunity(
      accountId,
      companyId,
      aiResponse,
      outboundContext,
      existingOutbound
    )
    
    if (!opportunityId) {
      console.error(`[Outbound Engine] Failed to persist opportunity for company ${companyId}`)
      return
    }
    
    // 8. Persistir score
    const scoreSuccess = await upsertOutboundOpportunityScore(opportunityId, aiResponse.score)
    if (!scoreSuccess) {
      console.warn(`[Outbound Engine] Failed to persist score for opportunity ${opportunityId}`)
    }
    
    console.log(`[Outbound Engine] Successfully created outbound opportunity ${opportunityId} for company ${companyId}`)
  } catch (error) {
    console.error(`[Outbound Engine] Fatal error processing company ${companyId}:`, error)
    // No re-lanzar el error para no romper el batch si se llama desde ahí
  }
}

/**
 * Crea oportunidades outbound para múltiples empresas (batch)
 */
export async function createOutboundOpportunitiesForCompanies(
  accountId: string,
  companyIds: string[]
): Promise<{ processed: number; errors: number }> {
  console.log(`[Outbound Engine] Processing ${companyIds.length} companies for account ${accountId}`)
  
  let processed = 0
  let errors = 0
  
  for (const companyId of companyIds) {
    try {
      await createOutboundOpportunityForCompany(accountId, companyId)
      processed++
    } catch (error) {
      console.error(`[Outbound Engine] Error processing company ${companyId}:`, error)
      errors++
      // Continuar con la siguiente empresa
    }
  }
  
  console.log(
    `[Outbound Engine] Batch complete: ${processed} processed, ${errors} errors`
  )
  
  return { processed, errors }
}

/**
 * Genera automáticamente oportunidades outbound para una cuenta
 * 
 * Pensado para usarse en un cron job. Encuentra empresas con alto potencial
 * y sin oportunidades activas recientes.
 */
export async function autoGenerateOutboundForAccount(
  accountId: string
): Promise<{ processed: number; errors: number }> {
  console.log(`[Outbound Engine] Auto-generating outbound opportunities for account ${accountId}`)
  
  try {
    const supabase = getSupabaseClient()
    
    // 1. Encontrar empresas del account con criterios mínimos
    // Por ahora, buscar empresas activas sin oportunidades recientes
    // TODO: Integrar con scoring para filtrar por industry_fit_score o buying_signal_score
    
    const { data: companies, error } = await supabase
      .from('companies')
      .select('id')
      .eq('account_id', accountId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(100) // Limitar para no sobrecargar
    
    if (error) {
      console.error(`[Outbound Engine] Error fetching companies for account ${accountId}:`, error)
      return { processed: 0, errors: 1 }
    }
    
    if (!companies || companies.length === 0) {
      console.warn(`[Outbound Engine] No active companies found for account ${accountId}`)
      return { processed: 0, errors: 0 }
    }
    
    // 2. Filtrar empresas que no tienen oportunidades activas recientes
    const companyIdsToProcess: string[] = []
    
    for (const company of companies) {
      // Verificar si tiene oportunidades activas (intro o outbound)
      const { data: activeOpportunities } = await supabase
        .from('opportunities')
        .select('id')
        .eq('account_id', accountId)
        .eq('company_id', company.id)
        .in('status', ['suggested', 'intro_requested', 'in_progress'])
        .limit(1)
      
      // Si no tiene oportunidades activas, agregar a la lista
      if (!activeOpportunities || activeOpportunities.length === 0) {
        companyIdsToProcess.push(company.id)
      }
    }
    
    if (companyIdsToProcess.length === 0) {
      console.log(`[Outbound Engine] No companies need outbound generation for account ${accountId}`)
      return { processed: 0, errors: 0 }
    }
    
    console.log(`[Outbound Engine] Found ${companyIdsToProcess.length} companies to process`)
    
    // 3. Procesar empresas
    return await createOutboundOpportunitiesForCompanies(accountId, companyIdsToProcess)
  } catch (error) {
    console.error(`[Outbound Engine] Fatal error auto-generating for account ${accountId}:`, error)
    return { processed: 0, errors: 1 }
  }
}

// ============================================================================
// EXPORT DEFAULT (opcional, para facilitar importación)
// ============================================================================

export default {
  createOutboundOpportunityForCompany,
  createOutboundOpportunitiesForCompanies,
  autoGenerateOutboundForAccount
}
