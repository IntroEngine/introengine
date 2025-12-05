/**
 * Helper para integración con OpenAI
 * 
 * Encapsula la lógica de llamadas a OpenAI para todos los engines de IntroEngine
 */

import OpenAI from 'openai'
import {
  RELATIONSHIP_ENGINE_SYSTEM_PROMPT,
  buildRelationshipEngineUserPrompt,
  SCORING_ENGINE_SYSTEM_PROMPT,
  buildScoringEngineUserPrompt,
  OUTBOUND_ENGINE_SYSTEM_PROMPT,
  buildOutboundEngineUserPrompt,
  FOLLOWUP_ENGINE_SYSTEM_PROMPT,
  buildFollowUpEngineUserPrompt,
  WEEKLY_ADVISOR_SYSTEM_PROMPT,
  buildWeeklyAdvisorUserPrompt
} from './prompts'

// ============================================================================
// CONFIGURACIÓN DEL CLIENTE OPENAI
// ============================================================================

let openaiClient: OpenAI | null = null

/**
 * Obtiene o crea el cliente de OpenAI
 */
function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY
    
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY no está configurada. Por favor, configura la variable de entorno OPENAI_API_KEY.')
    }
    
    openaiClient = new OpenAI({
      apiKey: apiKey
    })
  }
  
  return openaiClient
}

/**
 * Obtiene el modelo a usar (configurable via env, default: gpt-4-turbo-preview)
 */
function getModel(): string {
  return process.env.OPENAI_MODEL || 'gpt-4-turbo-preview'
}

// ============================================================================
// INTERFACES Y TIPOS
// ============================================================================

export interface RelationshipContext {
  company: any
  bridge_contacts: any[]
  target_candidates: any[]
  known_relationships: any[]
}

export interface IntroOpportunitiesAIResponse {
  opportunities: Array<{
    company_id: string
    target: {
      id: string
      full_name: string
      role_title: string
      seniority: string
    }
    best_route: {
      type: 'direct' | 'second_level' | 'inferred'
      bridge_contact: { id: string; full_name: string } | null
      confidence: number
      why: string
    }
    suggested_intro_message: string
    score: {
      intro_strength_score: number
    }
  }>
}

export interface ScoringContext {
  company: any
  opportunity: any
  target_contact: any
  bridge_contact: any
  relationship: any
  buying_signals: any
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

export interface OutboundContext {
  company: any
  target_role: string
  buying_signals: any[]
  has_intro_opportunities: boolean
  metadata: any
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

export interface FollowUpContext {
  opportunity: any
  company: any
  target_contact: any
  bridge_contact: any
  days_without_activity: number
  followup_type: string
}

export interface FollowUpAIResponse {
  followups: {
    bridge_contact: string
    prospect: string
    outbound: string
  }
}

export interface WeeklyRawMetrics {
  intros_generated: number
  intros_requested: number
  intro_responses: number
  outbound_suggested: number
  outbound_executed: number
  wins: number
  losses: number
  by_industry: any[]
  by_type: any
  stalled_opportunities: number
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

// ============================================================================
// FUNCIONES DE LLAMADA A OPENAI
// ============================================================================

/**
 * Llama a OpenAI para analizar relaciones y generar oportunidades de intro
 */
export async function callRelationshipEngineAI(
  context: RelationshipContext
): Promise<IntroOpportunitiesAIResponse> {
  try {
    const openai = getOpenAIClient()
    const userPrompt = buildRelationshipEngineUserPrompt(context)
    
    const response = await openai.chat.completions.create({
      model: getModel(),
      messages: [
        { role: 'system', content: RELATIONSHIP_ENGINE_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3, // Baja temperatura para respuestas más consistentes
      max_tokens: 2000
    })
    
    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response content from OpenAI')
    }
    
    // Parsear JSON
    const parsed = JSON.parse(content)
    
    // Validar estructura básica
    if (!parsed.opportunities || !Array.isArray(parsed.opportunities)) {
      throw new Error('Invalid response format: opportunities array missing')
    }
    
    return parsed as IntroOpportunitiesAIResponse
  } catch (error) {
    console.error('OpenAI API error in callRelationshipEngineAI:', error)
    throw error
  }
}

/**
 * Llama a OpenAI para calcular scores comerciales
 */
export async function callScoringEngineAI(
  context: ScoringContext
): Promise<ScoringAIResponse> {
  try {
    const openai = getOpenAIClient()
    const userPrompt = buildScoringEngineUserPrompt(context)
    
    const response = await openai.chat.completions.create({
      model: getModel(),
      messages: [
        { role: 'system', content: SCORING_ENGINE_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2, // Baja temperatura para scores más consistentes
      max_tokens: 1000
    })
    
    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response content from OpenAI')
    }
    
    const parsed = JSON.parse(content)
    
    // Validar estructura
    if (!parsed.scores || typeof parsed.scores !== 'object') {
      throw new Error('Invalid response format: scores missing')
    }
    
    // Validar que todos los scores estén en rango 0-100
    const scores = parsed.scores
    const requiredScores = ['industry_fit_score', 'buying_signal_score', 'intro_strength_score', 'lead_potential_score']
    
    for (const scoreName of requiredScores) {
      if (typeof scores[scoreName] !== 'number' || scores[scoreName] < 0 || scores[scoreName] > 100) {
        throw new Error(`Invalid ${scoreName}: must be number between 0-100`)
      }
    }
    
    return parsed as ScoringAIResponse
  } catch (error) {
    console.error('OpenAI API error in callScoringEngineAI:', error)
    throw error
  }
}

/**
 * Llama a OpenAI para generar mensaje outbound personalizado
 */
export async function callOutboundEngineAI(
  context: OutboundContext
): Promise<OutboundAIResponse> {
  try {
    const openai = getOpenAIClient()
    const userPrompt = buildOutboundEngineUserPrompt(context)
    
    const response = await openai.chat.completions.create({
      model: getModel(),
      messages: [
        { role: 'system', content: OUTBOUND_ENGINE_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 1500
    })
    
    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response content from OpenAI')
    }
    
    const parsed = JSON.parse(content)
    
    // Validar estructura
    if (!parsed.outbound || !parsed.score) {
      throw new Error('Invalid response format: outbound or score missing')
    }
    
    // Validar que el score esté en rango 0-100
    if (typeof parsed.score.lead_potential_score !== 'number' || 
        parsed.score.lead_potential_score < 0 || 
        parsed.score.lead_potential_score > 100) {
      throw new Error('Invalid lead_potential_score: must be number between 0-100')
    }
    
    return parsed as OutboundAIResponse
  } catch (error) {
    console.error('OpenAI API error in callOutboundEngineAI:', error)
    throw error
  }
}

/**
 * Llama a OpenAI para generar mensajes de follow-up
 */
export async function callFollowUpEngineAI(
  context: FollowUpContext
): Promise<FollowUpAIResponse> {
  try {
    const openai = getOpenAIClient()
    const userPrompt = buildFollowUpEngineUserPrompt(context)
    
    const response = await openai.chat.completions.create({
      model: getModel(),
      messages: [
        { role: 'system', content: FOLLOWUP_ENGINE_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 1500
    })
    
    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response content from OpenAI')
    }
    
    const parsed = JSON.parse(content)
    
    // Validar estructura
    if (!parsed.followups || typeof parsed.followups !== 'object') {
      throw new Error('Invalid response format: followups missing')
    }
    
    const requiredTypes = ['bridge_contact', 'prospect', 'outbound']
    for (const type of requiredTypes) {
      if (!parsed.followups[type] || typeof parsed.followups[type] !== 'string') {
        throw new Error(`Invalid response format: missing or invalid ${type}`)
      }
    }
    
    return parsed as FollowUpAIResponse
  } catch (error) {
    console.error('OpenAI API error in callFollowUpEngineAI:', error)
    throw error
  }
}

/**
 * Llama a OpenAI para generar resumen ejecutivo e insights semanales
 */
export async function callWeeklyAdvisorAI(
  metrics: WeeklyRawMetrics
): Promise<WeeklyAdvisorAIResponse> {
  try {
    const openai = getOpenAIClient()
    const userPrompt = buildWeeklyAdvisorUserPrompt(metrics)
    
    const response = await openai.chat.completions.create({
      model: getModel(),
      messages: [
        { role: 'system', content: WEEKLY_ADVISOR_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 2000
    })
    
    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response content from OpenAI')
    }
    
    const parsed = JSON.parse(content)
    
    // Validar estructura
    if (!parsed.summary || !parsed.insights || !parsed.recommended_actions) {
      throw new Error('Invalid response format: summary, insights or recommended_actions missing')
    }
    
    if (!Array.isArray(parsed.insights) || !Array.isArray(parsed.recommended_actions)) {
      throw new Error('Invalid response format: insights and recommended_actions must be arrays')
    }
    
    // Validar que haya al menos 3 insights y 3 acciones
    if (parsed.insights.length < 3) {
      console.warn('Warning: Expected at least 3 insights, got', parsed.insights.length)
    }
    
    if (parsed.recommended_actions.length < 3) {
      console.warn('Warning: Expected at least 3 recommended actions, got', parsed.recommended_actions.length)
    }
    
    return parsed as WeeklyAdvisorAIResponse
  } catch (error) {
    console.error('OpenAI API error in callWeeklyAdvisorAI:', error)
    throw error
  }
}
