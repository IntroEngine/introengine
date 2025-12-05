/**
 * Weekly Advisor Engine de IntroEngine
 * 
 * Motor para analizar actividad comercial de una cuenta durante un rango de fechas
 * y generar resumen ejecutivo con insights accionables.
 */

import { createClient } from '@/config/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface WeeklyRawMetrics {
  intros_generated: number
  intros_requested: number
  intro_responses: number
  outbound_suggested: number
  outbound_executed: number
  wins: number
  losses: number
  by_industry: IndustryBreakdown[]
  by_type: TypeBreakdown
  stalled_opportunities: number
}

export interface IndustryBreakdown {
  industry: string
  opportunities: number
  wins: number
  losses: number
  conversion_rate: number
}

export interface TypeBreakdown {
  intro: {
    total: number
    suggested: number
    intro_requested: number
    in_progress: number
    won: number
    lost: number
  }
  outbound: {
    total: number
    suggested: number
    in_progress: number
    won: number
    lost: number
  }
}

export interface WeeklyAdvisorAIResponse {
  summary: {
    intros_generated: string
    intros_requested: string
    responses: string
    outbound_pending: string
    wins: string
    losses: string
  }
  insights: string[]
  recommended_actions: string[]
}

export interface WeeklyAdvisorResult {
  accountId: string
  startDate: string
  endDate: string
  rawMetrics: WeeklyRawMetrics
  aiSummary: WeeklyAdvisorAIResponse
  createdAt: string
}

export interface OpportunityRecord {
  id: string
  type: string | null
  status: string | null
  company_id: string | null
  target_contact_id: string | null
  bridge_contact_id: string | null
  created_at: string
  last_action_at: string | null
}

export interface ActivityLogRecord {
  id: string
  action_type: string
  entity_type: string | null
  entity_id: string | null
  payload: any
  created_at: string
}

export interface CompanyRecord {
  id: string
  industry: string | null
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
 * Obtiene oportunidades del account en un rango de fechas
 */
async function getOpportunitiesInDateRange(
  accountId: string,
  startDate: Date,
  endDate: Date
): Promise<OpportunityRecord[]> {
  try {
    const supabase = getSupabaseClient()
    
    const startDateString = startDate.toISOString()
    const endDateString = endDate.toISOString()
    
    // Buscar oportunidades creadas o con actividad en el rango
    const { data, error } = await supabase
      .from('opportunities')
      .select('id, type, status, company_id, target_contact_id, bridge_contact_id, created_at, last_action_at')
      .eq('account_id', accountId)
      .or(`created_at.gte.${startDateString},created_at.lte.${endDateString},last_action_at.gte.${startDateString},last_action_at.lte.${endDateString}`)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error(`Error fetching opportunities for account ${accountId}:`, error)
      return []
    }
    
    // Filtrar en memoria para asegurar que están en el rango
    const filtered = (data || []).filter(opp => {
      const created = new Date(opp.created_at)
      const lastAction = opp.last_action_at ? new Date(opp.last_action_at) : null
      
      return (created >= startDate && created <= endDate) ||
             (lastAction && lastAction >= startDate && lastAction <= endDate)
    })
    
    return filtered.map(opp => ({
      id: opp.id,
      type: opp.type,
      status: opp.status,
      company_id: opp.company_id,
      target_contact_id: opp.target_contact_id,
      bridge_contact_id: opp.bridge_contact_id,
      created_at: opp.created_at,
      last_action_at: opp.last_action_at
    }))
  } catch (error) {
    console.error(`Exception fetching opportunities for account ${accountId}:`, error)
    return []
  }
}

/**
 * Obtiene activity logs del account en un rango de fechas
 */
async function getActivityLogsInDateRange(
  accountId: string,
  startDate: Date,
  endDate: Date
): Promise<ActivityLogRecord[]> {
  try {
    const supabase = getSupabaseClient()
    
    const startDateString = startDate.toISOString()
    const endDateString = endDate.toISOString()
    
    // TODO: Ajustar según estructura real de activity_logs
    const { data, error } = await supabase
      .from('activity_logs')
      .select('id, action_type, entity_type, entity_id, payload, created_at')
      .eq('account_id', accountId)
      .gte('created_at', startDateString)
      .lte('created_at', endDateString)
      .order('created_at', { ascending: false })
    
    if (error) {
      // Si la tabla no existe, retornar array vacío
      if (error.code === '42P01') {
        console.warn('activity_logs table does not exist, skipping activity logs')
        return []
      }
      console.error(`Error fetching activity logs for account ${accountId}:`, error)
      return []
    }
    
    return (data || []).map(log => ({
      id: log.id,
      action_type: log.action_type,
      entity_type: log.entity_type,
      entity_id: log.entity_id,
      payload: log.payload,
      created_at: log.created_at
    }))
  } catch (error) {
    console.error(`Exception fetching activity logs for account ${accountId}:`, error)
    return []
  }
}

/**
 * Obtiene empresas con sus industrias para breakdown
 */
async function getCompaniesWithIndustries(
  accountId: string,
  companyIds: string[]
): Promise<Map<string, string | null>> {
  if (companyIds.length === 0) {
    return new Map()
  }
  
  try {
    const supabase = getSupabaseClient()
    
    const { data, error } = await supabase
      .from('companies')
      .select('id, industry')
      .eq('account_id', accountId)
      .in('id', companyIds)
    
    if (error) {
      console.error(`Error fetching companies for breakdown:`, error)
      return new Map()
    }
    
    const industryMap = new Map<string, string | null>()
    ;(data || []).forEach(company => {
      industryMap.set(company.id, company.industry)
    })
    
    return industryMap
  } catch (error) {
    console.error(`Exception fetching companies for breakdown:`, error)
    return new Map()
  }
}

// ============================================================================
// CÁLCULO DE MÉTRICAS
// ============================================================================

/**
 * Calcula métricas crudas desde oportunidades y activity logs
 */
async function calculateWeeklyRawMetrics(
  accountId: string,
  startDate: Date,
  endDate: Date
): Promise<WeeklyRawMetrics> {
  // 1. Obtener oportunidades en el rango
  const opportunities = await getOpportunitiesInDateRange(accountId, startDate, endDate)
  
  // 2. Obtener activity logs en el rango
  const activityLogs = await getActivityLogsInDateRange(accountId, startDate, endDate)
  
  // 3. Obtener industrias de las empresas
  const companyIds = [...new Set(opportunities.map(o => o.company_id).filter((id): id is string => id !== null))]
  const industryMap = await getCompaniesWithIndustries(accountId, companyIds)
  
  // 4. Calcular métricas básicas
  const introsGenerated = opportunities.filter(o => 
    o.type === 'intro' && 
    new Date(o.created_at) >= startDate && 
    new Date(o.created_at) <= endDate
  ).length
  
  const introsRequested = opportunities.filter(o => 
    o.type === 'intro' && 
    (o.status === 'intro_requested' || o.status?.includes('intro_requested'))
  ).length
  
  // Contar respuestas: oportunidades intro que cambiaron de estado
  const introResponses = opportunities.filter(o => 
    o.type === 'intro' && 
    o.status !== 'suggested' && 
    o.status !== 'intro_requested' &&
    o.last_action_at &&
    new Date(o.last_action_at) >= startDate &&
    new Date(o.last_action_at) <= endDate
  ).length
  
  const outboundSuggested = opportunities.filter(o => 
    o.type === 'outbound' && 
    new Date(o.created_at) >= startDate && 
    new Date(o.created_at) <= endDate
  ).length
  
  const outboundExecuted = opportunities.filter(o => 
    o.type === 'outbound' && 
    (o.status === 'in_progress' || o.status === 'outbound_sent') &&
    o.last_action_at &&
    new Date(o.last_action_at) >= startDate &&
    new Date(o.last_action_at) <= endDate
  ).length
  
  const wins = opportunities.filter(o => o.status === 'won').length
  const losses = opportunities.filter(o => o.status === 'lost').length
  
  // 5. Breakdown por industria
  const industryStats = new Map<string, { opportunities: number; wins: number; losses: number }>()
  
  for (const opp of opportunities) {
    if (!opp.company_id) continue
    
    const industry = industryMap.get(opp.company_id) || 'Unknown'
    const stats = industryStats.get(industry) || { opportunities: 0, wins: 0, losses: 0 }
    
    stats.opportunities++
    if (opp.status === 'won') stats.wins++
    if (opp.status === 'lost') stats.losses++
    
    industryStats.set(industry, stats)
  }
  
  const by_industry: IndustryBreakdown[] = Array.from(industryStats.entries()).map(([industry, stats]) => ({
    industry,
    opportunities: stats.opportunities,
    wins: stats.wins,
    losses: stats.losses,
    conversion_rate: stats.opportunities > 0 
      ? Math.round((stats.wins / stats.opportunities) * 100) 
      : 0
  })).sort((a, b) => b.opportunities - a.opportunities)
  
  // 6. Breakdown por tipo
  const introOpps = opportunities.filter(o => o.type === 'intro')
  const outboundOpps = opportunities.filter(o => o.type === 'outbound')
  
  const by_type: TypeBreakdown = {
    intro: {
      total: introOpps.length,
      suggested: introOpps.filter(o => o.status === 'suggested').length,
      intro_requested: introOpps.filter(o => o.status === 'intro_requested' || o.status?.includes('intro_requested')).length,
      in_progress: introOpps.filter(o => o.status === 'in_progress').length,
      won: introOpps.filter(o => o.status === 'won').length,
      lost: introOpps.filter(o => o.status === 'lost').length
    },
    outbound: {
      total: outboundOpps.length,
      suggested: outboundOpps.filter(o => o.status === 'suggested').length,
      in_progress: outboundOpps.filter(o => o.status === 'in_progress').length,
      won: outboundOpps.filter(o => o.status === 'won').length,
      lost: outboundOpps.filter(o => o.status === 'lost').length
    }
  }
  
  // 7. Oportunidades estancadas (sin cambios desde hace 7+ días)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  
  const stalled_opportunities = opportunities.filter(o => {
    if (o.status === 'won' || o.status === 'lost') return false
    
    const lastAction = o.last_action_at ? new Date(o.last_action_at) : new Date(o.created_at)
    return lastAction < sevenDaysAgo
  }).length
  
  return {
    intros_generated: introsGenerated,
    intros_requested: introsRequested,
    intro_responses: introResponses,
    outbound_suggested: outboundSuggested,
    outbound_executed: outboundExecuted,
    wins: wins,
    losses: losses,
    by_industry: by_industry,
    by_type: by_type,
    stalled_opportunities: stalled_opportunities
  }
}

// ============================================================================
// INTEGRACIÓN CON OPENAI
// ============================================================================

/**
 * Llama a OpenAI para generar resumen ejecutivo e insights
 * 
 * Usa el helper de OpenAI desde services/ai/openai-helper
 */
async function callWeeklyAdvisorAI(
  metrics: WeeklyRawMetrics
): Promise<WeeklyAdvisorAIResponse> {
  try {
    // Importar y usar el helper real de OpenAI
    const { callWeeklyAdvisorAI as callOpenAI } = await import('./ai/openai-helper')
    
    // Las métricas ya están en el formato correcto
    return await callOpenAI(metrics)
  } catch (error) {
    console.error('Error calling OpenAI for weekly advisor:', error)
    throw error
  }
}

/**
 * Valida la respuesta de OpenAI
 */
function validateWeeklyAdvisorAIResponse(response: WeeklyAdvisorAIResponse): boolean {
  if (!response.summary) {
    console.error('Invalid AI response: missing summary')
    return false
  }
  
  if (!Array.isArray(response.insights) || response.insights.length === 0) {
    console.error('Invalid AI response: insights must be non-empty array')
    return false
  }
  
  if (!Array.isArray(response.recommended_actions) || response.recommended_actions.length === 0) {
    console.error('Invalid AI response: recommended_actions must be non-empty array')
    return false
  }
  
  return true
}

// ============================================================================
// PERSISTENCIA EN SUPABASE
// ============================================================================

/**
 * Registra el resumen semanal en activity_logs
 */
async function storeWeeklySummary(
  accountId: string,
  result: WeeklyAdvisorResult
): Promise<boolean> {
  try {
    const supabase = getSupabaseClient()
    
    const { error } = await supabase
      .from('activity_logs')
      .insert({
        account_id: accountId,
        action_type: 'weekly_summary_generated',
        entity_type: 'account',
        entity_id: accountId,
        payload: result,
        created_at: new Date().toISOString()
      })
    
    if (error) {
      // Si la tabla no existe, solo loguear warning
      if (error.code === '42P01') {
        console.warn('activity_logs table does not exist, skipping storage')
        return false
      }
      console.error(`Error storing weekly summary for account ${accountId}:`, error)
      return false
    }
    
    return true
  } catch (error) {
    console.error(`Exception storing weekly summary for account ${accountId}:`, error)
    return false
  }
}

/**
 * Obtiene el último resumen semanal almacenado
 */
async function getLastWeeklySummary(
  accountId: string
): Promise<WeeklyAdvisorResult | null> {
  try {
    const supabase = getSupabaseClient()
    
    const { data, error } = await supabase
      .from('activity_logs')
      .select('payload, created_at')
      .eq('account_id', accountId)
      .eq('action_type', 'weekly_summary_generated')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    
    if (error) {
      if (error.code === 'PGRST116' || error.code === '42P01') {
        // No hay registros o tabla no existe
        return null
      }
      console.error(`Error fetching last weekly summary for account ${accountId}:`, error)
      return null
    }
    
    if (!data || !data.payload) {
      return null
    }
    
    // Validar estructura del payload
    const payload = data.payload as any
    if (!payload.accountId || !payload.rawMetrics || !payload.aiSummary) {
      console.error('Invalid weekly summary payload structure')
      return null
    }
    
    return payload as WeeklyAdvisorResult
  } catch (error) {
    console.error(`Exception fetching last weekly summary for account ${accountId}:`, error)
    return null
  }
}

// ============================================================================
// FUNCIONES PÚBLICAS PRINCIPALES
// ============================================================================

/**
 * Genera resumen semanal para una cuenta
 */
export async function generateWeeklySummaryForAccount(
  accountId: string,
  options?: { startDate?: Date; endDate?: Date }
): Promise<WeeklyAdvisorResult> {
  // Calcular rango de fechas (por defecto, últimos 7 días)
  const endDate = options?.endDate || new Date()
  const startDate = options?.startDate || (() => {
    const date = new Date(endDate)
    date.setDate(date.getDate() - 7)
    return date
  })()
  
  console.log(`[Weekly Advisor] Generating summary for account ${accountId} (${startDate.toISOString()} to ${endDate.toISOString()})`)
  
  try {
    // 1. Calcular métricas crudas
    const rawMetrics = await calculateWeeklyRawMetrics(accountId, startDate, endDate)
    
    // 2. Llamar a IA para generar resumen e insights
    let aiSummary: WeeklyAdvisorAIResponse
    try {
      aiSummary = await callWeeklyAdvisorAI(rawMetrics)
    } catch (error) {
      console.error(`[Weekly Advisor] Error calling OpenAI for account ${accountId}:`, error)
      throw error
    }
    
    // 3. Validar respuesta
    if (!validateWeeklyAdvisorAIResponse(aiSummary)) {
      throw new Error('Invalid AI response')
    }
    
    // 4. Construir resultado
    const result: WeeklyAdvisorResult = {
      accountId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      rawMetrics,
      aiSummary,
      createdAt: new Date().toISOString()
    }
    
    // 5. Registrar en activity_logs
    await storeWeeklySummary(accountId, result)
    
    console.log(`[Weekly Advisor] Successfully generated summary for account ${accountId}`)
    
    return result
  } catch (error) {
    console.error(`[Weekly Advisor] Fatal error generating summary for account ${accountId}:`, error)
    throw error
  }
}

/**
 * Genera y almacena resumen semanal (para cronjobs)
 */
export async function generateWeeklySummaryAndStore(
  accountId: string,
  options?: { startDate?: Date; endDate?: Date }
): Promise<void> {
  console.log(`[Weekly Advisor] Generating and storing summary for account ${accountId}`)
  
  try {
    await generateWeeklySummaryForAccount(accountId, options)
    console.log(`[Weekly Advisor] Summary stored successfully for account ${accountId}`)
  } catch (error) {
    console.error(`[Weekly Advisor] Error generating and storing summary for account ${accountId}:`, error)
    throw error
  }
}

/**
 * Obtiene el último resumen semanal almacenado
 */
export async function getLastWeeklySummaryForAccount(
  accountId: string
): Promise<WeeklyAdvisorResult | null> {
  console.log(`[Weekly Advisor] Fetching last summary for account ${accountId}`)
  
  try {
    const result = await getLastWeeklySummary(accountId)
    return result
  } catch (error) {
    console.error(`[Weekly Advisor] Error fetching last summary for account ${accountId}:`, error)
    return null
  }
}

// ============================================================================
// EXPORT DEFAULT (opcional, para facilitar importación)
// ============================================================================

export default {
  generateWeeklySummaryForAccount,
  generateWeeklySummaryAndStore,
  getLastWeeklySummaryForAccount
}
