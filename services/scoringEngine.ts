/**
 * Scoring Engine de IntroEngine
 * 
 * Motor para calcular y mantener 4 scores clave para cada oportunidad comercial:
 * - industry_fit_score (0-100)
 * - buying_signal_score (0-100)
 * - intro_strength_score (0-100)
 * - lead_potential_score (0-100)
 */

import { createClient } from '@/config/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface Company {
  id: string
  name: string
  industry: string | null
  size_bucket: string | null
  country: string | null
  domain: string | null
  website: string | null
  status: string | null
}

export interface Opportunity {
  id: string
  account_id: string
  company_id: string
  type: string | null
  status: string | null
  target_contact_id: string | null
  bridge_contact_id: string | null
  route_type: string | null
  route_confidence: number | null
}

export interface Contact {
  id: string
  full_name: string
  role_title: string | null
  seniority: string | null
  email: string | null
}

export interface Relationship {
  type: 'direct' | 'second_level' | 'inferred' | null
  strength: number | null // 1-5
}

export interface BuyingSignals {
  hiring: boolean
  growth: boolean
  operational_chaos: boolean
  hr_shortage: boolean
  expansion: boolean
  compliance_issues: boolean
  manual_processes: boolean
}

export interface ScoringContext {
  company: {
    id: string
    name: string
    industry: string | null
    size_bucket: string | null
    country: string | null
    domain: string | null
  }
  opportunity: {
    id: string
    type: string | null // 'intro' | 'outbound'
    status: string | null
  }
  target_contact: {
    id: string
    full_name: string
    role_title: string | null
    seniority: string | null
  } | null
  bridge_contact: {
    id: string
    full_name: string
    role_title: string | null
    seniority: string | null
  } | null
  relationship: Relationship
  buying_signals: BuyingSignals
}

export interface ScoringAIResponse {
  scores: {
    industry_fit_score: number
    buying_signal_score: number
    intro_strength_score: number
    lead_potential_score: number
  }
  explanation: string
}

export interface ScoringResult {
  scores: {
    industry_fit_score: number
    buying_signal_score: number
    intro_strength_score: number
    lead_potential_score: number
  }
  explanation: string
}

export interface ExistingScore {
  id: string
  opportunity_id: string
  industry_fit_score: number | null
  buying_signal_score: number | null
  intro_strength_score: number | null
  lead_potential_score: number | null
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
 * Obtiene una oportunidad con su información completa
 */
async function getOpportunity(
  accountId: string,
  opportunityId: string
): Promise<Opportunity | null> {
  try {
    const supabase = getSupabaseClient()
    
    const { data, error } = await supabase
      .from('opportunities')
      .select('id, account_id, company_id, type, status, target_contact_id, bridge_contact_id, route_type, route_confidence')
      .eq('id', opportunityId)
      .eq('account_id', accountId)
      .single()
    
    if (error) {
      console.error(`Error fetching opportunity ${opportunityId}:`, error)
      return null
    }
    
    return data as Opportunity
  } catch (error) {
    console.error(`Exception fetching opportunity ${opportunityId}:`, error)
    return null
  }
}

/**
 * Obtiene una company con su información
 */
async function getCompany(accountId: string, companyId: string): Promise<Company | null> {
  try {
    const supabase = getSupabaseClient()
    
    const { data, error } = await supabase
      .from('companies')
      .select('id, name, industry, size_bucket, country, domain, website, status')
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
 * Obtiene un contacto por ID
 */
async function getContact(accountId: string, contactId: string): Promise<Contact | null> {
  try {
    const supabase = getSupabaseClient()
    
    const { data, error } = await supabase
      .from('contacts')
      .select('id, full_name, role_title, seniority, email')
      .eq('id', contactId)
      .eq('account_id', accountId)
      .single()
    
    if (error) {
      console.error(`Error fetching contact ${contactId}:`, error)
      return null
    }
    
    return {
      id: data.id,
      full_name: data.full_name,
      role_title: data.role_title,
      seniority: data.seniority,
      email: data.email
    }
  } catch (error) {
    console.error(`Exception fetching contact ${contactId}:`, error)
    return null
  }
}

/**
 * Obtiene señales de compra para una empresa desde la tabla buying_signals
 */
async function getBuyingSignalsForCompany(
  accountId: string,
  companyId: string
): Promise<BuyingSignals> {
  try {
    const supabase = getSupabaseClient()
    
    const { data, error } = await supabase
      .from('buying_signals')
      .select('signal_type, confidence')
      .eq('account_id', accountId)
      .eq('company_id', companyId)
      .eq('status', 'active')
    
    if (error) {
      console.error(`Error fetching buying signals for company ${companyId}:`, error)
      return {
        hiring: false,
        growth: false,
        operational_chaos: false,
        hr_shortage: false,
        expansion: false,
        compliance_issues: false,
        manual_processes: false
      }
    }
    
    // Inicializar todas las señales en false
    const signals: BuyingSignals = {
      hiring: false,
      growth: false,
      operational_chaos: false,
      hr_shortage: false,
      expansion: false,
      compliance_issues: false,
      manual_processes: false
    }
    
    // Mapear señales activas (solo considerar si confidence >= 30)
    if (data) {
      for (const signal of data) {
        if (signal.confidence >= 30) {
          const signalType = signal.signal_type as keyof BuyingSignals
          if (signalType in signals) {
            signals[signalType] = true
          }
        }
      }
    }
    
    return signals
  } catch (error) {
    console.error(`Exception fetching buying signals for company ${companyId}:`, error)
    return {
      hiring: false,
      growth: false,
      operational_chaos: false,
      hr_shortage: false,
      expansion: false,
      compliance_issues: false,
      manual_processes: false
    }
  }
}

/**
 * Construye el contexto de scoring para una oportunidad
 */
async function buildScoringContext(
  accountId: string,
  opportunity: Opportunity
): Promise<ScoringContext | null> {
  try {
    // 1. Obtener company
    const company = await getCompany(accountId, opportunity.company_id)
    if (!company) {
      return null
    }
    
    // 2. Obtener target_contact si existe
    let targetContact: Contact | null = null
    if (opportunity.target_contact_id) {
      targetContact = await getContact(accountId, opportunity.target_contact_id)
    }
    
    // 3. Obtener bridge_contact si existe
    let bridgeContact: Contact | null = null
    if (opportunity.bridge_contact_id) {
      bridgeContact = await getContact(accountId, opportunity.bridge_contact_id)
    }
    
    // 4. Construir relationship desde opportunity
    const relationship: Relationship = {
      type: opportunity.route_type as 'direct' | 'second_level' | 'inferred' | null,
      strength: opportunity.route_confidence 
        ? Math.min(5, Math.max(1, Math.round(opportunity.route_confidence / 20))) // Convertir 0-100 a 1-5
        : null
    }
    
    // 5. Obtener buying signals
    const buyingSignals = await getBuyingSignalsForCompany(accountId, opportunity.company_id)
    
    return {
      company: {
        id: company.id,
        name: company.name,
        industry: company.industry,
        size_bucket: company.size_bucket,
        country: company.country,
        domain: company.domain
      },
      opportunity: {
        id: opportunity.id,
        type: opportunity.type,
        status: opportunity.status
      },
      target_contact: targetContact ? {
        id: targetContact.id,
        full_name: targetContact.full_name,
        role_title: targetContact.role_title,
        seniority: targetContact.seniority
      } : null,
      bridge_contact: bridgeContact ? {
        id: bridgeContact.id,
        full_name: bridgeContact.full_name,
        role_title: bridgeContact.role_title,
        seniority: bridgeContact.seniority
      } : null,
      relationship,
      buying_signals: buyingSignals
    }
  } catch (error) {
    console.error(`Exception building scoring context for opportunity ${opportunity.id}:`, error)
    return null
  }
}

// ============================================================================
// INTEGRACIÓN CON OPENAI
// ============================================================================

/**
 * Llama a OpenAI para calcular scores
 * 
 * Usa el helper de OpenAI desde services/ai/openai-helper
 */
async function callScoringEngineAI(
  context: ScoringContext
): Promise<ScoringAIResponse> {
  try {
    // Importar y usar el helper real de OpenAI
    const { callScoringEngineAI as callOpenAI } = await import('./ai/openai-helper')
    
    // Convertir el contexto local al formato esperado por el helper
    const helperContext = {
      company: context.company,
      opportunity: context.opportunity,
      target_contact: context.target_contact,
      bridge_contact: context.bridge_contact,
      relationship: context.relationship,
      buying_signals: context.buying_signals
    }
    
    return await callOpenAI(helperContext)
  } catch (error) {
    console.error('Error calling OpenAI for scoring:', error)
    throw error
  }
}

/**
 * Valida la respuesta de OpenAI
 */
function validateScoringAIResponse(response: ScoringAIResponse): boolean {
  if (!response.scores) {
    console.error('Invalid AI response: missing scores')
    return false
  }
  
  const requiredScores = ['industry_fit_score', 'buying_signal_score', 'intro_strength_score', 'lead_potential_score']
  
  for (const scoreName of requiredScores) {
    const score = response.scores[scoreName as keyof typeof response.scores]
    if (typeof score !== 'number' || score < 0 || score > 100) {
      console.error(`Invalid AI response: ${scoreName} must be number between 0-100, got ${score}`)
      return false
    }
  }
  
  return true
}

// ============================================================================
// PERSISTENCIA EN SUPABASE
// ============================================================================

/**
 * Obtiene score existente para una oportunidad
 */
async function getExistingScore(opportunityId: string): Promise<ExistingScore | null> {
  try {
    const supabase = getSupabaseClient()
    
    const { data, error } = await supabase
      .from('scores')
      .select('id, opportunity_id, industry_fit_score, buying_signal_score, intro_strength_score, lead_potential_score')
      .eq('opportunity_id', opportunityId)
      .maybeSingle()
    
    if (error) {
      console.error(`Error fetching score for opportunity ${opportunityId}:`, error)
      return null
    }
    
    if (!data) {
      return null
    }
    
    return {
      id: data.id,
      opportunity_id: data.opportunity_id,
      industry_fit_score: data.industry_fit_score,
      buying_signal_score: data.buying_signal_score,
      intro_strength_score: data.intro_strength_score,
      lead_potential_score: data.lead_potential_score
    }
  } catch (error) {
    console.error(`Exception fetching score for opportunity ${opportunityId}:`, error)
    return null
  }
}

/**
 * Crea o actualiza el score en Supabase
 */
async function upsertScore(
  opportunityId: string,
  scoringResult: ScoringResult
): Promise<boolean> {
  try {
    const supabase = getSupabaseClient()
    
    const existingScore = await getExistingScore(opportunityId)
    
    const scoreData = {
      opportunity_id: opportunityId,
      industry_fit_score: scoringResult.scores.industry_fit_score,
      buying_signal_score: scoringResult.scores.buying_signal_score,
      intro_strength_score: scoringResult.scores.intro_strength_score,
      lead_potential_score: scoringResult.scores.lead_potential_score,
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
 * Calcula y persiste scores para una oportunidad específica
 */
export async function scoreOpportunityById(
  accountId: string,
  opportunityId: string
): Promise<void> {
  console.log(`[Scoring Engine] Scoring opportunity ${opportunityId} (account: ${accountId})`)
  
  try {
    // 1. Cargar oportunidad
    const opportunity = await getOpportunity(accountId, opportunityId)
    if (!opportunity) {
      console.error(`[Scoring Engine] Opportunity ${opportunityId} not found`)
      return
    }
    
    // 2. Construir contexto
    const context = await buildScoringContext(accountId, opportunity)
    if (!context) {
      console.error(`[Scoring Engine] Failed to build context for opportunity ${opportunityId}`)
      return
    }
    
    // 3. Llamar a IA para calcular scores
    let aiResponse: ScoringAIResponse
    try {
      aiResponse = await callScoringEngineAI(context)
    } catch (error) {
      console.error(`[Scoring Engine] Error calling OpenAI for opportunity ${opportunityId}:`, error)
      return
    }
    
    // 4. Validar respuesta
    if (!validateScoringAIResponse(aiResponse)) {
      console.error(`[Scoring Engine] Invalid AI response for opportunity ${opportunityId}`)
      return
    }
    
    // 5. Convertir a ScoringResult
    const scoringResult: ScoringResult = {
      scores: aiResponse.scores,
      explanation: aiResponse.explanation
    }
    
    // 6. Persistir en Supabase
    const success = await upsertScore(opportunityId, scoringResult)
    if (!success) {
      console.error(`[Scoring Engine] Failed to persist score for opportunity ${opportunityId}`)
      return
    }
    
    console.log(`[Scoring Engine] Successfully scored opportunity ${opportunityId}`)
  } catch (error) {
    console.error(`[Scoring Engine] Fatal error scoring opportunity ${opportunityId}:`, error)
    // No re-lanzar el error para no romper el batch si se llama desde ahí
  }
}

/**
 * Calcula scores para todas las oportunidades de una empresa
 */
export async function scoreOpportunitiesForCompany(
  accountId: string,
  companyId: string
): Promise<{ processed: number; errors: number }> {
  console.log(`[Scoring Engine] Scoring opportunities for company ${companyId} (account: ${accountId})`)
  
  try {
    const supabase = getSupabaseClient()
    
    // Obtener todas las oportunidades de la empresa
    const { data: opportunities, error } = await supabase
      .from('opportunities')
      .select('id')
      .eq('account_id', accountId)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error(`[Scoring Engine] Error fetching opportunities for company ${companyId}:`, error)
      return { processed: 0, errors: 1 }
    }
    
    if (!opportunities || opportunities.length === 0) {
      console.log(`[Scoring Engine] No opportunities found for company ${companyId}`)
      return { processed: 0, errors: 0 }
    }
    
    let processed = 0
    let errors = 0
    
    // Iterar y scorear cada oportunidad
    for (const opp of opportunities) {
      try {
        await scoreOpportunityById(accountId, opp.id)
        processed++
      } catch (error) {
        console.error(`[Scoring Engine] Error scoring opportunity ${opp.id}:`, error)
        errors++
        // Continuar con la siguiente
      }
    }
    
    console.log(
      `[Scoring Engine] Company ${companyId} complete: ${processed} processed, ${errors} errors`
    )
    
    return { processed, errors }
  } catch (error) {
    console.error(`[Scoring Engine] Fatal error scoring opportunities for company ${companyId}:`, error)
    return { processed: 0, errors: 1 }
  }
}

/**
 * Calcula scores para todas las oportunidades activas de una cuenta
 */
export async function scoreAllOpportunitiesForAccount(
  accountId: string
): Promise<{ processed: number; errors: number }> {
  console.log(`[Scoring Engine] Scoring all opportunities for account ${accountId}`)
  
  try {
    const supabase = getSupabaseClient()
    
    // Obtener todas las oportunidades activas del account
    const { data: opportunities, error } = await supabase
      .from('opportunities')
      .select('id')
      .eq('account_id', accountId)
      .in('status', ['suggested', 'intro_requested', 'in_progress', 'outbound_sent'])
      .order('created_at', { ascending: false })
      .limit(1000) // Limitar para no sobrecargar
    
    if (error) {
      console.error(`[Scoring Engine] Error fetching opportunities for account ${accountId}:`, error)
      return { processed: 0, errors: 1 }
    }
    
    if (!opportunities || opportunities.length === 0) {
      console.log(`[Scoring Engine] No active opportunities found for account ${accountId}`)
      return { processed: 0, errors: 0 }
    }
    
    console.log(`[Scoring Engine] Found ${opportunities.length} opportunities to score`)
    
    let processed = 0
    let errors = 0
    
    // Iterar y scorear cada oportunidad
    for (const opp of opportunities) {
      try {
        await scoreOpportunityById(accountId, opp.id)
        processed++
      } catch (error) {
        console.error(`[Scoring Engine] Error scoring opportunity ${opp.id}:`, error)
        errors++
        // Continuar con la siguiente
      }
    }
    
    console.log(
      `[Scoring Engine] Account ${accountId} complete: ${processed} processed, ${errors} errors`
    )
    
    return { processed, errors }
  } catch (error) {
    console.error(`[Scoring Engine] Fatal error scoring opportunities for account ${accountId}:`, error)
    return { processed: 0, errors: 1 }
  }
}

/**
 * Calcula scores para un contexto dado (sin persistir)
 * 
 * Útil para testing o uso interno
 */
export async function scoreSingleContext(
  context: ScoringContext
): Promise<ScoringResult> {
  console.log(`[Scoring Engine] Scoring single context for company ${context.company.name}`)
  
  try {
    // Llamar a IA para calcular scores
    const aiResponse = await callScoringEngineAI(context)
    
    // Validar respuesta
    if (!validateScoringAIResponse(aiResponse)) {
      throw new Error('Invalid AI response')
    }
    
    return {
      scores: aiResponse.scores,
      explanation: aiResponse.explanation
    }
  } catch (error) {
    console.error(`[Scoring Engine] Error scoring context:`, error)
    throw error
  }
}

// ============================================================================
// EXPORT DEFAULT (opcional, para facilitar importación)
// ============================================================================

export default {
  scoreOpportunityById,
  scoreOpportunitiesForCompany,
  scoreAllOpportunitiesForAccount,
  scoreSingleContext
}
