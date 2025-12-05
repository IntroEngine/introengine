// Weekly Advisor de IntroEngine
// Actúa como un jefe de ventas inteligente analizando la actividad semanal

export type WeeklyActivity = {
  intros_generated?: number
  intros_requested?: number
  intro_responses?: number
  outbound_suggested?: number
  outbound_executed?: number
  wins?: number
  losses?: number
  opportunities_created?: number
  industries_performance?: IndustryPerformance[]
  response_rate?: number
  conversion_rate?: number
  top_industries?: string[]
  top_signals?: string[]
}

export type IndustryPerformance = {
  industry: string
  opportunities: number
  responses: number
  wins: number
  conversion_rate: number
}

export type WeeklyAdvisorResult = {
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

/**
 * Genera resumen de métricas en formato legible
 */
function generateSummary(activity: WeeklyActivity): WeeklyAdvisorResult['summary'] {
  const introsGenerated = activity.intros_generated || 0
  const introsRequested = activity.intros_requested || 0
  const responses = activity.intro_responses || 0
  const outboundSuggested = activity.outbound_suggested || 0
  const outboundExecuted = activity.outbound_executed || 0
  const wins = activity.wins || 0
  const losses = activity.losses || 0
  
  return {
    intros_generated: `${introsGenerated} ${introsGenerated === 1 ? 'intro generada' : 'intros generadas'} esta semana`,
    intros_requested: `${introsRequested} ${introsRequested === 1 ? 'intro pedida' : 'intros pedidas'} a contactos puente`,
    responses: `${responses} ${responses === 1 ? 'respuesta recibida' : 'respuestas recibidas'} de ${introsRequested > 0 ? Math.round((responses / introsRequested) * 100) : 0}% de tasa de respuesta`,
    outbound_pending: `${outboundSuggested - outboundExecuted} mensajes outbound sugeridos sin ejecutar de ${outboundSuggested} totales`,
    wins: `${wins} ${wins === 1 ? 'victoria' : 'victorias'} esta semana`,
    losses: `${losses} ${losses === 1 ? 'pérdida' : 'pérdidas'} registradas`
  }
}

/**
 * Genera insights inteligentes basados en los datos
 */
function generateInsights(activity: WeeklyActivity): string[] {
  const insights: string[] = []
  
  const introsGenerated = activity.intros_generated || 0
  const introsRequested = activity.intros_requested || 0
  const responses = activity.intro_responses || 0
  const outboundSuggested = activity.outbound_suggested || 0
  const outboundExecuted = activity.outbound_executed || 0
  const wins = activity.wins || 0
  const losses = activity.losses || 0
  const opportunitiesCreated = activity.opportunities_created || 0
  
  // Calcular tasas
  const responseRate = introsRequested > 0 ? (responses / introsRequested) * 100 : 0
  const conversionRate = responses > 0 ? (wins / responses) * 100 : 0
  const outboundExecutionRate = outboundSuggested > 0 ? (outboundExecuted / outboundSuggested) * 100 : 0
  
  // Insight 1: Performance general
  if (introsGenerated > 0) {
    if (introsGenerated >= 10) {
      insights.push(`Excelente volumen: generaste ${introsGenerated} intros esta semana, lo que indica buena actividad de prospección.`)
    } else if (introsGenerated >= 5) {
      insights.push(`Volumen moderado: ${introsGenerated} intros generadas. Hay espacio para aumentar la actividad.`)
    } else {
      insights.push(`Bajo volumen: solo ${introsGenerated} ${introsGenerated === 1 ? 'intro generada' : 'intros generadas'}. Considera aumentar tu actividad de prospección.`)
    }
  } else {
    insights.push(`No se generaron intros esta semana. Es momento de reactivar tu pipeline de prospección.`)
  }
  
  // Insight 2: Tasa de respuesta
  if (introsRequested > 0) {
    if (responseRate >= 50) {
      insights.push(`Tasa de respuesta excepcional: ${Math.round(responseRate)}% de tus contactos puente respondieron, lo que indica relaciones sólidas.`)
    } else if (responseRate >= 30) {
      insights.push(`Tasa de respuesta buena: ${Math.round(responseRate)}% de respuestas. Tus contactos puente están comprometidos.`)
    } else if (responseRate >= 15) {
      insights.push(`Tasa de respuesta moderada: ${Math.round(responseRate)}%. Considera mejorar la calidad de tus solicitudes de intro.`)
    } else {
      insights.push(`Tasa de respuesta baja: ${Math.round(responseRate)}%. Puede ser que necesites fortalecer tus relaciones o mejorar el timing de tus solicitudes.`)
    }
  }
  
  // Insight 3: Outbound execution
  if (outboundSuggested > 0) {
    const pending = outboundSuggested - outboundExecuted
    if (pending > 0) {
      if (outboundExecutionRate < 50) {
        insights.push(`Oportunidad perdida: tienes ${pending} mensajes outbound sin ejecutar. El outbound frío puede ser efectivo si lo ejecutas consistentemente.`)
      } else if (outboundExecutionRate < 80) {
        insights.push(`Ejecución parcial: ${pending} mensajes outbound pendientes. Completar estos puede abrir nuevas oportunidades.`)
      }
    } else {
      insights.push(`Excelente ejecución: completaste todos los ${outboundExecuted} mensajes outbound sugeridos.`)
    }
  }
  
  // Insight 4: Conversión
  if (responses > 0) {
    if (conversionRate >= 30) {
      insights.push(`Alta tasa de conversión: ${Math.round(conversionRate)}% de las respuestas se convirtieron en victorias. Tu enfoque está funcionando bien.`)
    } else if (conversionRate >= 15) {
      insights.push(`Tasa de conversión moderada: ${Math.round(conversionRate)}%. Hay espacio para mejorar el seguimiento y cierre.`)
    } else {
      insights.push(`Tasa de conversión baja: ${Math.round(conversionRate)}%. Considera revisar tu proceso de seguimiento y cualificación.`)
    }
  }
  
  // Insight 5: Performance por industria
  if (activity.industries_performance && activity.industries_performance.length > 0) {
    const topIndustry = activity.industries_performance
      .sort((a, b) => b.conversion_rate - a.conversion_rate)[0]
    
    if (topIndustry && topIndustry.conversion_rate > 20) {
      insights.push(`Industria destacada: ${topIndustry.industry} muestra ${Math.round(topIndustry.conversion_rate)}% de conversión. Considera enfocarte más en este sector.`)
    }
  }
  
  // Insight 6: Balance wins/losses
  if (wins > 0 || losses > 0) {
    const total = wins + losses
    if (wins > losses * 2) {
      insights.push(`Ratio positivo: ${wins} victorias vs ${losses} pérdidas. Estás en el camino correcto.`)
    } else if (wins > losses) {
      insights.push(`Balance positivo: ${wins} victorias vs ${losses} pérdidas. Sigue así.`)
    } else if (losses > wins) {
      insights.push(`Atención: ${losses} pérdidas vs ${wins} victorias. Revisa tu proceso de cualificación y seguimiento.`)
    }
  }
  
  // Asegurar que siempre haya al menos 3 insights
  while (insights.length < 3) {
    if (insights.length === 0) {
      insights.push('Esta semana no hubo actividad registrada. Es momento de comenzar a generar oportunidades.')
    } else if (insights.length === 1) {
      insights.push('Considera aumentar tu actividad de prospección para generar más oportunidades.')
    } else {
      insights.push('Mantén la consistencia en tu actividad semanal para construir un pipeline sólido.')
    }
  }
  
  // Retornar máximo 3 insights más relevantes
  return insights.slice(0, 3)
}

/**
 * Genera acciones recomendadas basadas en los datos
 */
function generateRecommendedActions(activity: WeeklyActivity): string[] {
  const actions: string[] = []
  
  const introsGenerated = activity.intros_generated || 0
  const introsRequested = activity.intros_requested || 0
  const responses = activity.intro_responses || 0
  const outboundSuggested = activity.outbound_suggested || 0
  const outboundExecuted = activity.outbound_executed || 0
  const wins = activity.wins || 0
  const losses = activity.losses || 0
  
  const responseRate = introsRequested > 0 ? (responses / introsRequested) * 100 : 0
  const outboundPending = outboundSuggested - outboundExecuted
  
  // Acción 1: Basada en volumen de intros
  if (introsGenerated < 5) {
    actions.push('Aumenta tu actividad de prospección: apunta a generar al menos 5-10 intros por semana para mantener un pipeline saludable.')
  } else if (introsGenerated < 10) {
    actions.push('Mantén el momentum: estás en buen camino. Considera aumentar a 10+ intros semanales para acelerar el crecimiento.')
  } else {
    actions.push('Excelente volumen. Ahora enfócate en mejorar la calidad: cualifica mejor tus oportunidades antes de pedir intros.')
  }
  
  // Acción 2: Basada en tasa de respuesta o outbound
  if (responseRate < 30 && introsRequested > 0) {
    actions.push('Mejora tus solicitudes de intro: personaliza más tus mensajes, explica claramente el valor para el contacto puente, y elige mejor el timing.')
  } else if (outboundPending > 5) {
    actions.push(`Ejecuta los ${outboundPending} mensajes outbound pendientes: el outbound frío puede ser efectivo si lo ejecutas consistentemente.`)
  } else if (introsRequested === 0 && outboundSuggested === 0) {
    actions.push('Comienza a pedir intros o generar outbound: sin actividad no hay resultados. Identifica al menos 5 oportunidades esta semana.')
  } else {
    actions.push('Sigue el ritmo: tu actividad es consistente. Enfócate en mejorar la calidad de tus interacciones y seguimientos.')
  }
  
  // Acción 3: Basada en conversión o industrias
  if (responses > 0) {
    const conversionRate = (wins / responses) * 100
    if (conversionRate < 20) {
      actions.push('Mejora tu proceso de seguimiento: cualifica mejor las oportunidades, haz follow-ups más efectivos, y cierra más conversaciones.')
    } else {
      actions.push('Mantén tu proceso de seguimiento: está funcionando bien. Documenta qué está funcionando para replicarlo.')
    }
  } else if (activity.industries_performance && activity.industries_performance.length > 0) {
    const topIndustry = activity.industries_performance
      .sort((a, b) => b.conversion_rate - a.conversion_rate)[0]
    if (topIndustry) {
      actions.push(`Enfócate en ${topIndustry.industry}: esta industria muestra mejor performance. Busca más oportunidades similares.`)
    }
  } else {
    actions.push('Diversifica tu enfoque: prueba diferentes industrias y tipos de empresas para encontrar qué funciona mejor para ti.')
  }
  
  // Asegurar que siempre haya 3 acciones
  while (actions.length < 3) {
    if (actions.length === 0) {
      actions.push('Comienza a generar oportunidades: identifica empresas objetivo y contacta a tus conexiones para pedir intros.')
    } else if (actions.length === 1) {
      actions.push('Mantén la consistencia: establece una rutina semanal de prospección para construir un pipeline sólido.')
    } else {
      actions.push('Revisa y optimiza: analiza qué está funcionando y duplica esos esfuerzos.')
    }
  }
  
  return actions.slice(0, 3)
}

/**
 * Función principal: analiza actividad semanal y genera resumen, insights y acciones
 */
export function analyzeWeeklyActivity(activity: WeeklyActivity): WeeklyAdvisorResult {
  // Generar resumen
  const summary = generateSummary(activity)
  
  // Generar insights
  const insights = generateInsights(activity)
  
  // Generar acciones recomendadas
  const recommendedActions = generateRecommendedActions(activity)
  
  return {
    summary,
    insights,
    recommended_actions: recommendedActions
  }
}
