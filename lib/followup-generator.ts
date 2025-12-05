// Motor de follow-ups de IntroEngine
// Genera mensajes de seguimiento suaves, educados y efectivos

export type Opportunity = {
  id?: string
  company_id?: string | null
  company_name?: string | null
  target_contact_id?: string | null
  target_contact_name?: string | null
  target_contact_role?: string | null
  bridge_contact_id?: string | null
  bridge_contact_name?: string | null
  bridge_contact_role?: string | null
  type?: 'direct' | 'second_level' | 'inferred' | null
  status?: string | null
  last_interaction?: string | null
  has_intro_request?: boolean | null
  has_previous_conversation?: boolean | null
  is_cold_outbound?: boolean | null
}

export type FollowupResult = {
  followups: {
    bridge_contact: string
    prospect: string
    outbound: string
  }
}

/**
 * Determina el tono según los días de espera
 */
function getToneByDays(days: number): 'gentle' | 'friendly' | 'polite' {
  if (days <= 3) return 'gentle'
  if (days <= 7) return 'friendly'
  return 'polite'
}

/**
 * Genera mensaje de follow-up para contacto puente
 * (pediste intro y no respondieron)
 */
function generateBridgeFollowup(
  opportunity: Opportunity,
  daysWaiting: number
): string {
  const bridgeName = opportunity.bridge_contact_name || 'Hola'
  const targetName = opportunity.target_contact_name || 'ellos'
  const companyName = opportunity.company_name || 'la empresa'
  const tone = getToneByDays(daysWaiting)
  
  if (daysWaiting <= 3) {
    return `Hola ${bridgeName},\n\nSolo quería hacer un seguimiento sobre mi mensaje anterior. ¿Tendrías un momento para presentarme a ${targetName} en ${companyName}?\n\nGracias de antemano.`
  }
  
  if (daysWaiting <= 7) {
    return `Hola ${bridgeName},\n\nEspero que estés bien. Te escribo porque me gustaría conectarme con ${targetName} en ${companyName} y pensé que podrías ayudarme con una presentación.\n\n¿Te parece bien si te paso un mensaje corto que puedas compartir?`
  }
  
  if (daysWaiting <= 14) {
    return `Hola ${bridgeName},\n\nSé que estás ocupado. Solo quería recordarte que me gustaría conectarme con ${targetName} en ${companyName}.\n\nSi no es el momento adecuado, no hay problema. Solo avísame cuando puedas.`
  }
  
  // Más de 14 días
  return `Hola ${bridgeName},\n\nEspero que todo esté bien. Te escribo porque me gustaría explorar una oportunidad con ${companyName} y pensé que ${targetName} podría estar interesado.\n\nSi puedes hacer una presentación breve, te lo agradecería. Si no, entiendo perfectamente.`
}

/**
 * Genera mensaje de follow-up para prospecto
 * (ya hablaste pero quedó congelado)
 */
function generateProspectFollowup(
  opportunity: Opportunity,
  daysWaiting: number
): string {
  const targetName = opportunity.target_contact_name || 'Hola'
  const companyName = opportunity.company_name || 'tu empresa'
  const tone = getToneByDays(daysWaiting)
  
  if (daysWaiting <= 3) {
    return `Hola ${targetName},\n\nSolo quería hacer un seguimiento sobre nuestra conversación anterior. ¿Tienes alguna pregunta sobre cómo Witar podría ayudar a ${companyName}?\n\nEstoy aquí para lo que necesites.`
  }
  
  if (daysWaiting <= 7) {
    return `Hola ${targetName},\n\nEspero que estés bien. Te escribo porque pensé que podría ser útil compartirte cómo otras empresas similares están usando Witar para simplificar la gestión de horarios y documentos.\n\n¿Te parece bien si coordinamos una llamada rápida de 15 minutos?`
  }
  
  if (daysWaiting <= 14) {
    return `Hola ${targetName},\n\nSé que estás ocupado. Solo quería recordarte que Witar puede ayudar a ${companyName} a gestionar control horario, vacaciones y documentos sin complicarse.\n\nSi ahora no es el momento, no hay problema. Solo avísame cuando quieras retomar la conversación.`
  }
  
  if (daysWaiting <= 30) {
    return `Hola ${targetName},\n\nEspero que todo esté bien. Te escribo porque las necesidades de gestión de RRHH pueden cambiar con el tiempo, y quería ver si ahora sería un buen momento para retomar nuestra conversación.\n\nSi te interesa, podemos hacer una demo rápida. Si no, entiendo perfectamente.`
  }
  
  // Más de 30 días - re-engagement suave
  return `Hola ${targetName},\n\nEspero que estés bien. Te escribo porque ${companyName} sigue en mi radar y pensé que podría ser útil compartirte cómo Witar ha ayudado a empresas similares a simplificar su gestión de RRHH.\n\nSi te interesa explorarlo, estaré encantado de conversar. Si no, no hay problema.`
}

/**
 * Genera mensaje de follow-up para outbound frío
 * (no respondieron a outbound inicial)
 */
function generateOutboundFollowup(
  opportunity: Opportunity,
  daysWaiting: number
): string {
  const targetName = opportunity.target_contact_name || 'Hola'
  const companyName = opportunity.company_name || 'tu empresa'
  const targetRole = opportunity.target_contact_role || ''
  const tone = getToneByDays(daysWaiting)
  
  if (daysWaiting <= 3) {
    return `Hola ${targetName},\n\nSolo quería hacer un seguimiento sobre mi mensaje anterior. Sé que estás ocupado, pero pensé que Witar podría ser útil para ${companyName}.\n\nSi te interesa, podemos hacer una llamada rápida de 15 minutos. Si no, no hay problema.`
  }
  
  if (daysWaiting <= 7) {
    return `Hola ${targetName},\n\nEspero que estés bien. Te escribo porque vi que ${companyName} está en crecimiento y pensé que podría ser útil compartirte cómo Witar ayuda a empresas pequeñas a gestionar control horario y documentos sin complicarse.\n\n¿Te parece bien si coordinamos una conversación breve?`
  }
  
  if (daysWaiting <= 14) {
    return `Hola ${targetName},\n\nSé que estás ocupado. Solo quería recordarte que Witar puede ayudar a ${companyName} a simplificar la gestión de RRHH.\n\nSi ahora no es el momento, no hay problema. Solo avísame si en el futuro te interesa explorarlo.`
  }
  
  if (daysWaiting <= 30) {
    // Re-engagement con nuevo ángulo
    return `Hola ${targetName},\n\nEspero que todo esté bien. Te escribo porque las necesidades de gestión de RRHH pueden cambiar con el tiempo, y quería ver si ahora sería un buen momento para conversar sobre cómo Witar podría ayudar a ${companyName}.\n\nSi te interesa, podemos hacer una demo rápida. Si no, entiendo perfectamente.`
  }
  
  // Más de 30 días - último intento muy suave
  return `Hola ${targetName},\n\nEspero que estés bien. Te escribo porque ${companyName} sigue en mi radar y pensé que podría ser útil compartirte cómo otras empresas similares están usando Witar para simplificar la gestión de horarios y documentos.\n\nSi te interesa explorarlo, estaré encantado de conversar. Si no, no hay problema y no te molestaré más.`
}

/**
 * Función principal: genera todos los tipos de follow-up
 */
export function generateFollowups(
  opportunity: Opportunity,
  daysWaiting: number
): FollowupResult {
  // Validar días de espera
  const days = Math.max(0, Math.round(daysWaiting || 0))
  
  // Generar cada tipo de follow-up
  const bridgeFollowup = generateBridgeFollowup(opportunity, days)
  const prospectFollowup = generateProspectFollowup(opportunity, days)
  const outboundFollowup = generateOutboundFollowup(opportunity, days)
  
  return {
    followups: {
      bridge_contact: bridgeFollowup,
      prospect: prospectFollowup,
      outbound: outboundFollowup
    }
  }
}
