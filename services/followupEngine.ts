/**
 * Follow-up Engine de IntroEngine
 * 
 * Motor para detectar oportunidades comerciales que llevan X días sin movimiento
 * y generar mensajes de seguimiento contextuales usando IA.
 */

import { createClient } from '@/config/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface OpportunityRecord {
  id: string
  account_id: string
  company_id: string
  type: string | null // 'intro' | 'outbound'
  status: string | null
  target_contact_id: string | null
  bridge_contact_id: string | null
  last_action_at: string | null
  created_at: string
}

export interface Company {
  id: string
  name: string
  industry: string | null
  size_bucket: string | null
  country: string | null
}

export interface Contact {
  id: string
  full_name: string
  role_title: string | null
  seniority: string | null
  email: string | null
}

export interface FollowUpContext {
  opportunity: {
    id: string
    type: string | null
    status: string | null
    last_action_at: string | null
  }
  company: {
    id: string
    name: string
    industry: string | null
    size_bucket: string | null
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
    relationship: string | null
  } | null
  days_without_activity: number
  last_message_summary: string | null
  followup_type: 'bridge' | 'prospect' | 'outbound'
}

export interface FollowUpAIResponse {
  followups: {
    bridge_contact: string
    prospect: string
    outbound: string
  }
}

export interface FollowUpSuggestion {
  opportunity_id: string
  followup_type: 'bridge' | 'prospect' | 'outbound'
  message: string
  days_without_activity: number
  suggested_at: string
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
): Promise<OpportunityRecord | null> {
  try {
    const supabase = getSupabaseClient()
    
    const { data, error } = await supabase
      .from('opportunities')
      .select('id, account_id, company_id, type, status, target_contact_id, bridge_contact_id, last_action_at, created_at')
      .eq('id', opportunityId)
      .eq('account_id', accountId)
      .single()
    
    if (error) {
      console.error(`Error fetching opportunity ${opportunityId}:`, error)
      return null
    }
    
    return data as OpportunityRecord
  } catch (error) {
    console.error(`Exception fetching opportunity ${opportunityId}:`, error)
    return null
  }
}

/**
 * Obtiene oportunidades del account que necesitan follow-up
 */
async function getOpportunitiesNeedingFollowUp(
  accountId: string,
  daysWithoutActivity: number
): Promise<OpportunityRecord[]> {
  try {
    const supabase = getSupabaseClient()
    
    // Calcular fecha límite
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysWithoutActivity)
    const cutoffDateString = cutoffDate.toISOString()
    
    // Buscar oportunidades activas sin actividad reciente
    const { data, error } = await supabase
      .from('opportunities')
      .select('id, account_id, company_id, type, status, target_contact_id, bridge_contact_id, last_action_at, created_at')
      .eq('account_id', accountId)
      .in('status', ['intro_requested', 'in_progress', 'demo_scheduled', 'outbound_sent'])
      .or(`last_action_at.is.null,last_action_at.lt.${cutoffDateString}`)
      .order('last_action_at', { ascending: true, nullsFirst: true })
      .limit(100) // Limitar para no sobrecargar
    
    if (error) {
      console.error(`Error fetching opportunities needing follow-up for account ${accountId}:`, error)
      return []
    }
    
    return (data || []) as OpportunityRecord[]
  } catch (error) {
    console.error(`Exception fetching opportunities needing follow-up for account ${accountId}:`, error)
    return []
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
      .select('id, name, industry, size_bucket, country')
      .eq('id', companyId)
      .eq('account_id', accountId)
      .single()
    
    if (error) {
      console.error(`Error fetching company ${companyId}:`, error)
      return null
    }
    
    return {
      id: data.id,
      name: data.name,
      industry: data.industry,
      size_bucket: data.size_bucket,
      country: data.country
    }
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
 * Calcula días sin actividad desde last_action_at o created_at
 */
function calculateDaysWithoutActivity(
  opportunity: OpportunityRecord
): number {
  const referenceDate = opportunity.last_action_at 
    ? new Date(opportunity.last_action_at)
    : new Date(opportunity.created_at)
  
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - referenceDate.getTime())
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays
}

// ============================================================================
// LÓGICA DE DETECCIÓN DE TIPO DE FOLLOW-UP
// ============================================================================

/**
 * Determina el tipo de follow-up que corresponde para una oportunidad
 * 
 * TODO: Refinar esta lógica con más reglas de negocio según se necesite
 */
function determineFollowUpType(
  opportunity: OpportunityRecord
): 'bridge' | 'prospect' | 'outbound' | null {
  const type = opportunity.type
  const status = opportunity.status?.toLowerCase() || ''
  
  // Si está en estado final, no aplicar follow-up
  if (status === 'won' || status === 'lost' || status === 'closed') {
    return null
  }
  
  // Follow-up a contacto puente
  // Oportunidades de tipo intro donde ya se pidió la intro
  if (type === 'intro') {
    if (status === 'intro_requested' || status.includes('intro_requested')) {
      return 'bridge'
    }
    // Si está en progreso, es follow-up a prospecto
    if (status === 'in_progress' || status === 'demo_scheduled' || status.includes('progress')) {
      return 'prospect'
    }
  }
  
  // Follow-up outbound frío
  // Oportunidades de tipo outbound donde se envió mensaje
  if (type === 'outbound') {
    if (status === 'in_progress' || status === 'outbound_sent' || status.includes('sent')) {
      return 'outbound'
    }
  }
  
  // Default: si no hay match claro, retornar null
  // TODO: Agregar más casos según se necesite
  return null
}

// ============================================================================
// CONSTRUCCIÓN DE CONTEXTO
// ============================================================================

/**
 * Construye el contexto para generar follow-up con IA
 */
async function buildFollowUpContext(
  accountId: string,
  opportunityId: string,
  daysWithoutActivity?: number
): Promise<FollowUpContext | null> {
  try {
    // 1. Leer la opportunity
    const opportunity = await getOpportunity(accountId, opportunityId)
    if (!opportunity) {
      return null
    }
    
    // 2. Determinar tipo de follow-up
    const followupType = determineFollowUpType(opportunity)
    if (!followupType) {
      // No hay tipo aplicable, no generar follow-up
      return null
    }
    
    // 3. Calcular días sin actividad
    const calculatedDays = daysWithoutActivity !== undefined
      ? daysWithoutActivity
      : calculateDaysWithoutActivity(opportunity)
    
    // 4. Leer la empresa asociada
    const company = await getCompany(accountId, opportunity.company_id)
    if (!company) {
      return null
    }
    
    // 5. Leer contactos target y bridge (si existen)
    let targetContact: Contact | null = null
    if (opportunity.target_contact_id) {
      targetContact = await getContact(accountId, opportunity.target_contact_id)
    }
    
    let bridgeContact: Contact | null = null
    let relationship: string | null = null
    if (opportunity.bridge_contact_id) {
      bridgeContact = await getContact(accountId, opportunity.bridge_contact_id)
      // TODO: Leer relación desde contact_relationships si está disponible
      // Por ahora, dejar null
    }
    
    // 6. Leer resumen del último mensaje (opcional)
    // TODO: Implementar lectura desde activity_logs o similar
    const lastMessageSummary: string | null = null
    
    return {
      opportunity: {
        id: opportunity.id,
        type: opportunity.type,
        status: opportunity.status,
        last_action_at: opportunity.last_action_at
      },
      company: {
        id: company.id,
        name: company.name,
        industry: company.industry,
        size_bucket: company.size_bucket
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
        relationship: relationship
      } : null,
      days_without_activity: calculatedDays,
      last_message_summary: lastMessageSummary,
      followup_type: followupType
    }
  } catch (error) {
    console.error(`Exception building follow-up context for opportunity ${opportunityId}:`, error)
    return null
  }
}

// ============================================================================
// INTEGRACIÓN CON OPENAI
// ============================================================================

/**
 * Llama a OpenAI para generar mensaje de follow-up
 * 
 * Usa el helper de OpenAI desde services/ai/openai-helper
 */
async function callFollowUpEngineAI(
  context: FollowUpContext
): Promise<FollowUpAIResponse> {
  try {
    // Importar y usar el helper real de OpenAI
    const { callFollowUpEngineAI as callOpenAI } = await import('./ai/openai-helper')
    
    // El contexto ya está en el formato correcto
    return await callOpenAI(context)
  } catch (error) {
    console.error('Error calling OpenAI for follow-up generation:', error)
    throw error
  }
}

/**
 * Valida la respuesta de OpenAI
 */
function validateFollowUpAIResponse(response: FollowUpAIResponse): boolean {
  if (!response.followups) {
    console.error('Invalid AI response: missing followups')
    return false
  }
  
  const requiredTypes = ['bridge_contact', 'prospect', 'outbound']
  for (const type of requiredTypes) {
    if (!response.followups[type] || typeof response.followups[type] !== 'string') {
      console.error(`Invalid AI response: missing or invalid ${type}`)
      return false
    }
  }
  
  return true
}

/**
 * Extrae el mensaje correcto según el tipo de follow-up
 */
function extractFollowUpMessage(
  aiResponse: FollowUpAIResponse,
  followupType: 'bridge' | 'prospect' | 'outbound'
): string {
  switch (followupType) {
    case 'bridge':
      return aiResponse.followups.bridge_contact
    case 'prospect':
      return aiResponse.followups.prospect
    case 'outbound':
      return aiResponse.followups.outbound
    default:
      return ''
  }
}

// ============================================================================
// PERSISTENCIA EN SUPABASE
// ============================================================================

/**
 * Registra una sugerencia de follow-up en la BD
 * 
 * Opción 1: Guardar en campo de opportunities
 * Opción 2: Guardar en activity_logs
 * Por ahora, implementamos ambas opciones
 */
async function persistFollowUpSuggestion(
  accountId: string,
  opportunityId: string,
  suggestion: FollowUpSuggestion
): Promise<boolean> {
  try {
    const supabase = getSupabaseClient()
    
    // Opción 1: Actualizar campo en opportunities
    const { error: updateError } = await supabase
      .from('opportunities')
      .update({
        suggested_followup_message: suggestion.message,
        suggested_followup_type: suggestion.followup_type,
        suggested_followup_at: suggestion.suggested_at,
        updated_at: new Date().toISOString()
      })
      .eq('id', opportunityId)
      .eq('account_id', accountId)
    
    if (updateError) {
      console.error(`Error updating opportunity ${opportunityId} with follow-up suggestion:`, updateError)
      // Continuar con activity_logs aunque falle esto
    }
    
    // Opción 2: Registrar en activity_logs
    const { error: logError } = await supabase
      .from('activity_logs')
      .insert({
        account_id: accountId,
        action_type: 'followup_suggested',
        entity_type: 'opportunity',
        entity_id: opportunityId,
        payload: {
          followup_type: suggestion.followup_type,
          message: suggestion.message,
          days_without_activity: suggestion.days_without_activity,
          suggested_at: suggestion.suggested_at
        },
        created_at: new Date().toISOString()
      })
    
    if (logError) {
      console.error(`Error logging follow-up suggestion for opportunity ${opportunityId}:`, logError)
      // Si ambas fallan, retornar false
      if (updateError) {
        return false
      }
    }
    
    return true
  } catch (error) {
    console.error(`Exception persisting follow-up suggestion for opportunity ${opportunityId}:`, error)
    return false
  }
}

// ============================================================================
// FUNCIONES PÚBLICAS PRINCIPALES
// ============================================================================

/**
 * Genera follow-ups para todas las oportunidades del account que lo necesiten
 */
export async function generateFollowUpsForAccount(
  accountId: string,
  options?: { daysWithoutActivity?: number }
): Promise<{ processed: number; errors: number }> {
  const daysWithoutActivity = options?.daysWithoutActivity || 7
  
  console.log(`[Follow-up Engine] Generating follow-ups for account ${accountId} (threshold: ${daysWithoutActivity} days)`)
  
  try {
    // 1. Buscar oportunidades que necesitan follow-up
    const opportunities = await getOpportunitiesNeedingFollowUp(accountId, daysWithoutActivity)
    
    if (opportunities.length === 0) {
      console.log(`[Follow-up Engine] No opportunities need follow-up for account ${accountId}`)
      return { processed: 0, errors: 0 }
    }
    
    console.log(`[Follow-up Engine] Found ${opportunities.length} opportunities needing follow-up`)
    
    let processed = 0
    let errors = 0
    
    // 2. Procesar cada oportunidad
    for (const opportunity of opportunities) {
      try {
        await generateFollowUpsForOpportunity(accountId, opportunity.id, daysWithoutActivity)
        processed++
      } catch (error) {
        console.error(`[Follow-up Engine] Error processing opportunity ${opportunity.id}:`, error)
        errors++
        // Continuar con la siguiente
      }
    }
    
    console.log(
      `[Follow-up Engine] Account ${accountId} complete: ${processed} processed, ${errors} errors`
    )
    
    return { processed, errors }
  } catch (error) {
    console.error(`[Follow-up Engine] Fatal error generating follow-ups for account ${accountId}:`, error)
    return { processed: 0, errors: 1 }
  }
}

/**
 * Genera follow-up para una oportunidad específica
 */
export async function generateFollowUpsForOpportunity(
  accountId: string,
  opportunityId: string,
  daysWithoutActivity?: number
): Promise<void> {
  console.log(`[Follow-up Engine] Generating follow-up for opportunity ${opportunityId} (account: ${accountId})`)
  
  try {
    // 1. Construir contexto
    const context = await buildFollowUpContext(accountId, opportunityId, daysWithoutActivity)
    if (!context) {
      console.log(`[Follow-up Engine] No follow-up needed for opportunity ${opportunityId}`)
      return
    }
    
    // 2. Llamar a IA para generar mensaje
    let aiResponse: FollowUpAIResponse
    try {
      aiResponse = await callFollowUpEngineAI(context)
    } catch (error) {
      console.error(`[Follow-up Engine] Error calling OpenAI for opportunity ${opportunityId}:`, error)
      return
    }
    
    // 3. Validar respuesta
    if (!validateFollowUpAIResponse(aiResponse)) {
      console.error(`[Follow-up Engine] Invalid AI response for opportunity ${opportunityId}`)
      return
    }
    
    // 4. Extraer mensaje según tipo
    const message = extractFollowUpMessage(aiResponse, context.followup_type)
    if (!message) {
      console.error(`[Follow-up Engine] No message generated for follow-up type ${context.followup_type}`)
      return
    }
    
    // 5. Crear sugerencia
    const suggestion: FollowUpSuggestion = {
      opportunity_id: opportunityId,
      followup_type: context.followup_type,
      message: message,
      days_without_activity: context.days_without_activity,
      suggested_at: new Date().toISOString()
    }
    
    // 6. Persistir sugerencia
    const success = await persistFollowUpSuggestion(accountId, opportunityId, suggestion)
    if (!success) {
      console.error(`[Follow-up Engine] Failed to persist follow-up suggestion for opportunity ${opportunityId}`)
      return
    }
    
    console.log(`[Follow-up Engine] Successfully generated follow-up for opportunity ${opportunityId}`)
  } catch (error) {
    console.error(`[Follow-up Engine] Fatal error processing opportunity ${opportunityId}:`, error)
    // No re-lanzar el error para no romper el batch si se llama desde ahí
  }
}

/**
 * Previsualiza el follow-up sugerido sin persistirlo
 * 
 * Útil para mostrar en UI antes de confirmar
 */
export async function previewFollowUpForOpportunity(
  accountId: string,
  opportunityId: string,
  daysWithoutActivity?: number
): Promise<FollowUpSuggestion | null> {
  console.log(`[Follow-up Engine] Previewing follow-up for opportunity ${opportunityId} (account: ${accountId})`)
  
  try {
    // 1. Construir contexto
    const context = await buildFollowUpContext(accountId, opportunityId, daysWithoutActivity)
    if (!context) {
      return null
    }
    
    // 2. Llamar a IA para generar mensaje
    let aiResponse: FollowUpAIResponse
    try {
      aiResponse = await callFollowUpEngineAI(context)
    } catch (error) {
      console.error(`[Follow-up Engine] Error calling OpenAI for preview of opportunity ${opportunityId}:`, error)
      return null
    }
    
    // 3. Validar respuesta
    if (!validateFollowUpAIResponse(aiResponse)) {
      console.error(`[Follow-up Engine] Invalid AI response for preview of opportunity ${opportunityId}`)
      return null
    }
    
    // 4. Extraer mensaje según tipo
    const message = extractFollowUpMessage(aiResponse, context.followup_type)
    if (!message) {
      return null
    }
    
    // 5. Retornar sugerencia (sin persistir)
    return {
      opportunity_id: opportunityId,
      followup_type: context.followup_type,
      message: message,
      days_without_activity: context.days_without_activity,
      suggested_at: new Date().toISOString()
    }
  } catch (error) {
    console.error(`[Follow-up Engine] Fatal error previewing opportunity ${opportunityId}:`, error)
    return null
  }
}

// ============================================================================
// EXPORT DEFAULT (opcional, para facilitar importación)
// ============================================================================

export default {
  generateFollowUpsForAccount,
  generateFollowUpsForOpportunity,
  previewFollowUpForOpportunity
}
