/**
 * Helper para integración con OpenAI
 * 
 * Encapsula la lógica de llamadas a OpenAI para el Relationship Engine
 */

// TODO: Instalar y configurar el cliente de OpenAI
// npm install openai
// import OpenAI from 'openai'

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

/**
 * Llama a OpenAI para analizar relaciones
 * 
 * TODO: Implementar con cliente real de OpenAI
 */
export async function callRelationshipEngineAI(
  context: RelationshipContext
): Promise<IntroOpportunitiesAIResponse> {
  // TODO: Reemplazar con implementación real
  // Ejemplo de implementación esperada:
  
  /*
  import OpenAI from 'openai'
  import { RELATIONSHIP_ENGINE_SYSTEM_PROMPT, buildRelationshipEngineUserPrompt } from './prompts'
  
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })
  
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured')
  }
  
  try {
    const userPrompt = buildRelationshipEngineUserPrompt(context)
    
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview', // o 'gpt-5' cuando esté disponible
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
    console.error('OpenAI API error:', error)
    throw error
  }
  */
  
  // Implementación temporal (debe ser reemplazada)
  console.warn('TODO: Implementar llamada real a OpenAI')
  console.log('Context received:', {
    company: context.company?.name,
    bridge_contacts_count: context.bridge_contacts?.length,
    target_candidates_count: context.target_candidates?.length,
    relationships_count: context.known_relationships?.length
  })
  
  // Retornar estructura vacía por ahora
  return { opportunities: [] }
}
