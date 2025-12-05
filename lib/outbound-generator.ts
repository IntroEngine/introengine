// Motor de outbound inteligente para IntroEngine
// Genera mensajes personalizados cuando NO existe un puente posible

export type Company = {
  id: string
  name: string
  industry?: string | null
  size_bucket?: string | null // 'startup', 'small', 'medium', 'large', 'enterprise'
  domain?: string | null
  website?: string | null
}

export type BuyingSignal = {
  type: 'hiring' | 'growth' | 'operational_chaos' | 'hr_shortage' | 'expansion' | 'compliance_issues' | 'manual_processes'
  description?: string | null
  strength?: 'low' | 'medium' | 'high'
}

export type Role = {
  title: string // 'CEO', 'RRHH', 'Operaciones', 'CFO', etc.
  seniority?: string | null
}

export type OutboundResult = {
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

// Pitch base de Witar
const PITCH_BASE = 'Witar ayuda a empresas pequeñas a gestionar control horario, vacaciones y documentos laborales sin complicarse.'

/**
 * Normaliza el rol para identificar el tipo de decisor
 */
function normalizeRole(roleTitle: string): 'ceo' | 'hr' | 'operations' | 'finance' | 'other' {
  const normalized = roleTitle.toLowerCase()
  
  if (normalized.includes('ceo') || normalized.includes('director general') || normalized.includes('fundador')) {
    return 'ceo'
  }
  if (normalized.includes('rrhh') || normalized.includes('hr') || normalized.includes('recursos humanos') || 
      normalized.includes('people') || normalized.includes('talent')) {
    return 'hr'
  }
  if (normalized.includes('operaciones') || normalized.includes('operations') || 
      normalized.includes('coo') || normalized.includes('jefe de operaciones')) {
    return 'operations'
  }
  if (normalized.includes('cfo') || normalized.includes('finanzas') || normalized.includes('finance') ||
      normalized.includes('contador') || normalized.includes('contabilidad')) {
    return 'finance'
  }
  
  return 'other'
}

/**
 * Identifica el tamaño de la empresa basado en size_bucket
 */
function getCompanySize(sizeBucket: string | null | undefined): 'startup' | 'small' | 'medium' | 'large' {
  if (!sizeBucket) return 'small'
  
  const normalized = sizeBucket.toLowerCase()
  if (normalized.includes('startup') || normalized.includes('micro')) return 'startup'
  if (normalized.includes('small') || normalized.includes('pequeña') || normalized.includes('1-10') || normalized.includes('1-50')) return 'small'
  if (normalized.includes('medium') || normalized.includes('mediana') || normalized.includes('50-200') || normalized.includes('51-200')) return 'medium'
  if (normalized.includes('large') || normalized.includes('grande') || normalized.includes('200+')) return 'large'
  
  return 'small' // Default
}

/**
 * Analiza señales de compra y calcula relevancia
 */
function analyzeBuyingSignals(signals: BuyingSignal[]): {
  primarySignal: BuyingSignal | null
  totalStrength: number
  relevantSignals: BuyingSignal[]
} {
  if (!signals || signals.length === 0) {
    return { primarySignal: null, totalStrength: 0, relevantSignals: [] }
  }
  
  // Señales más relevantes para Witar
  const relevantTypes = ['hr_shortage', 'operational_chaos', 'manual_processes', 'hiring', 'compliance_issues']
  const relevantSignals = signals.filter(s => relevantTypes.includes(s.type))
  
  // Encontrar la señal principal (la más fuerte)
  const primarySignal = relevantSignals.length > 0
    ? relevantSignals.reduce((prev, current) => {
        const prevStrength = prev.strength === 'high' ? 3 : prev.strength === 'medium' ? 2 : 1
        const currStrength = current.strength === 'high' ? 3 : current.strength === 'medium' ? 2 : 1
        return currStrength > prevStrength ? current : prev
      })
    : signals[0]
  
  // Calcular fuerza total
  const totalStrength = signals.reduce((sum, signal) => {
    const strength = signal.strength === 'high' ? 3 : signal.strength === 'medium' ? 2 : 1
    return sum + strength
  }, 0)
  
  return { primarySignal, totalStrength, relevantSignals }
}

/**
 * Genera mensaje outbound corto (2-3 líneas)
 */
function generateShortOutbound(
  company: Company,
  role: Role,
  primarySignal: BuyingSignal | null
): string {
  const roleType = normalizeRole(role.title)
  const companySize = getCompanySize(company.size_bucket)
  const companyName = company.name
  
  // Mensajes personalizados por rol
  if (roleType === 'ceo') {
    if (primarySignal?.type === 'hr_shortage') {
      return `Hola, vi que ${companyName} está creciendo y contratando. Como CEO, sé que gestionar el equipo puede volverse complejo.\n\n${PITCH_BASE}`
    }
    if (primarySignal?.type === 'operational_chaos') {
      return `Hola, entiendo que en ${companyName} están enfocados en escalar operaciones. La gestión de horarios y documentos puede ser un cuello de botella.\n\n${PITCH_BASE}`
    }
    return `Hola, como CEO de ${companyName}, sé que cada minuto cuenta. ${PITCH_BASE}`
  }
  
  if (roleType === 'hr') {
    if (primarySignal?.type === 'hr_shortage') {
      return `Hola, veo que ${companyName} está en crecimiento. Como responsable de RRHH, gestionar control horario y vacaciones puede volverse abrumador.\n\n${PITCH_BASE}`
    }
    if (primarySignal?.type === 'manual_processes') {
      return `Hola, sé que en RRHH de ${companyName} probablemente estás gestionando horarios y documentos de forma manual. ${PITCH_BASE}`
    }
    return `Hola, como responsable de RRHH en ${companyName}, sé lo que implica gestionar control horario y documentos laborales. ${PITCH_BASE}`
  }
  
  if (roleType === 'operations') {
    if (primarySignal?.type === 'operational_chaos') {
      return `Hola, veo que ${companyName} está escalando operaciones. La gestión de horarios del equipo puede ser un desafío operativo.\n\n${PITCH_BASE}`
    }
    return `Hola, como responsable de Operaciones en ${companyName}, entiendo la importancia de tener procesos claros. ${PITCH_BASE}`
  }
  
  // Mensaje genérico
  return `Hola, vi que ${companyName} está en crecimiento. ${PITCH_BASE}`
}

/**
 * Genera mensaje outbound detallado (4-6 líneas)
 */
function generateLongOutbound(
  company: Company,
  role: Role,
  primarySignal: BuyingSignal | null,
  relevantSignals: BuyingSignal[]
): string {
  const roleType = normalizeRole(role.title)
  const companySize = getCompanySize(company.size_bucket)
  const companyName = company.name
  
  let message = `Hola,\n\n`
  
  // Personalización por señal principal
  if (primarySignal) {
    if (primarySignal.type === 'hr_shortage' && roleType === 'hr') {
      message += `Veo que ${companyName} está en una fase de crecimiento y contratación. Como responsable de RRHH, sé que esto significa más trabajo administrativo: control de horarios, gestión de vacaciones, y documentación laboral.\n\n`
      message += `${PITCH_BASE} Witar automatiza estos procesos para que puedas enfocarte en lo que realmente importa: las personas.\n\n`
    } else if (primarySignal.type === 'operational_chaos' && roleType === 'operations') {
      message += `Entiendo que ${companyName} está escalando operaciones. Cuando el equipo crece, la gestión de horarios y la coordinación se vuelven más complejas.\n\n`
      message += `${PITCH_BASE} Esto puede ayudar a reducir la carga operativa y dar más visibilidad sobre el trabajo del equipo.\n\n`
    } else if (primarySignal.type === 'manual_processes') {
      message += `Sé que muchas empresas pequeñas como ${companyName} gestionan el control horario y los documentos laborales de forma manual: hojas de cálculo, emails, papel.\n\n`
      message += `${PITCH_BASE} Es una solución simple que puede ahorrar horas cada semana.\n\n`
    } else if (primarySignal.type === 'hiring' && roleType === 'ceo') {
      message += `Vi que ${companyName} está contratando. Como CEO, sé que cada nuevo empleado significa más gestión administrativa: horarios, vacaciones, documentos.\n\n`
      message += `${PITCH_BASE} Es especialmente útil cuando el equipo está creciendo.\n\n`
    } else {
      message += `Veo que ${companyName} está en crecimiento. ${PITCH_BASE}\n\n`
      message += `Puede ayudar a simplificar la gestión de tu equipo y reducir el trabajo administrativo.\n\n`
    }
  } else {
    // Sin señales específicas, mensaje genérico pero personalizado
    if (roleType === 'hr') {
      message += `Como responsable de RRHH en ${companyName}, sé lo que implica gestionar control horario, vacaciones y documentos laborales. ${PITCH_BASE}\n\n`
      message += `Puede ahorrarte tiempo y reducir errores en la gestión administrativa.\n\n`
    } else if (roleType === 'ceo') {
      message += `Como CEO de ${companyName}, sé que cada proceso que puedas simplificar cuenta. ${PITCH_BASE}\n\n`
      message += `Es especialmente útil para empresas pequeñas que están creciendo y necesitan procesos más estructurados.\n\n`
    } else {
      message += `${PITCH_BASE}\n\n`
      message += `Puede ayudar a ${companyName} a gestionar mejor el equipo y reducir la carga administrativa.\n\n`
    }
  }
  
  return message.trim()
}

/**
 * Genera CTA suave (no agresivo)
 */
function generateCTA(role: Role, companySize: string): string {
  const roleType = normalizeRole(role.title)
  
  if (roleType === 'hr') {
    return '¿Te gustaría que te muestre cómo funciona? Puedo hacerte una demo rápida de 15 minutos sin compromiso.'
  }
  
  if (roleType === 'ceo') {
    return '¿Te parece bien si coordinamos una breve conversación para ver si tiene sentido para tu equipo?'
  }
  
  return '¿Te gustaría conocer más? Puedo contarte cómo funciona en una llamada rápida.'
}

/**
 * Genera "por qué ahora"
 */
function generateReasonNow(
  primarySignal: BuyingSignal | null,
  relevantSignals: BuyingSignal[],
  companySize: string
): string {
  if (primarySignal) {
    if (primarySignal.type === 'hiring') {
      return 'Es el momento ideal porque están contratando. Implementar Witar ahora facilitará la gestión de los nuevos empleados desde el día uno.'
    }
    if (primarySignal.type === 'hr_shortage') {
      return 'Con el crecimiento del equipo, la carga administrativa aumenta. Implementar ahora evitará que se vuelva inmanejable.'
    }
    if (primarySignal.type === 'operational_chaos') {
      return 'Es mejor establecer procesos claros ahora, antes de que el equipo crezca más y la complejidad aumente.'
    }
    if (primarySignal.type === 'manual_processes') {
      return 'Cada día que pasa con procesos manuales es tiempo perdido. Automatizar ahora ahorrará horas cada semana.'
    }
    if (primarySignal.type === 'compliance_issues') {
      return 'Es importante tener los procesos en orden para cumplir con normativas laborales. Witar ayuda a mantener todo documentado correctamente.'
    }
  }
  
  // Razón genérica basada en tamaño
  if (companySize === 'startup' || companySize === 'small') {
    return 'Para empresas pequeñas en crecimiento, es el momento perfecto para establecer procesos que escalen con el equipo.'
  }
  
  return 'Es un buen momento para evaluar herramientas que pueden simplificar la gestión del equipo y ahorrar tiempo.'
}

/**
 * Calcula el lead_potential_score (0-100)
 */
function calculateLeadPotentialScore(
  company: Company,
  role: Role,
  signals: BuyingSignal[]
): number {
  let score = 50 // Base
  
  // Ajustar por tamaño de empresa (Witar es para empresas pequeñas)
  const companySize = getCompanySize(company.size_bucket)
  if (companySize === 'startup' || companySize === 'small') {
    score += 20
  } else if (companySize === 'medium') {
    score += 10
  } else {
    score -= 10 // Menos relevante para empresas grandes
  }
  
  // Ajustar por rol
  const roleType = normalizeRole(role.title)
  if (roleType === 'hr') {
    score += 15 // RRHH es el rol más relevante
  } else if (roleType === 'ceo') {
    score += 10 // CEO puede decidir
  } else if (roleType === 'operations') {
    score += 8
  } else if (roleType === 'finance') {
    score += 5
  }
  
  // Ajustar por señales de compra
  if (signals && signals.length > 0) {
    const { totalStrength, relevantSignals } = analyzeBuyingSignals(signals)
    
    // Bonus por señales relevantes
    if (relevantSignals.length > 0) {
      score += Math.min(20, totalStrength * 2) // Hasta 20 puntos por señales
    } else {
      score += Math.min(10, totalStrength) // Hasta 10 puntos por otras señales
    }
    
    // Bonus por múltiples señales
    if (signals.length >= 2) {
      score += 5
    }
    if (signals.length >= 3) {
      score += 5
    }
  }
  
  // Ajustar por industria (algunas industrias tienen más necesidad)
  if (company.industry) {
    const industry = company.industry.toLowerCase()
    if (industry.includes('retail') || industry.includes('retail') || 
        industry.includes('servicios') || industry.includes('hospitalidad') ||
        industry.includes('restaurante') || industry.includes('comercio')) {
      score += 5 // Industrias con muchos empleados horarios
    }
  }
  
  // Asegurar que esté en rango 0-100
  return Math.min(100, Math.max(0, score))
}

/**
 * Función principal: genera outbound personalizado
 */
export function generateOutbound(
  company: Company,
  role: Role,
  signals: BuyingSignal[]
): OutboundResult {
  // Analizar señales
  const { primarySignal, relevantSignals } = analyzeBuyingSignals(signals || [])
  
  // Generar contenido
  const short = generateShortOutbound(company, role, primarySignal)
  const long = generateLongOutbound(company, role, primarySignal, relevantSignals)
  const cta = generateCTA(role, getCompanySize(company.size_bucket))
  const reasonNow = generateReasonNow(primarySignal, relevantSignals, getCompanySize(company.size_bucket))
  
  // Calcular score
  const leadPotentialScore = calculateLeadPotentialScore(company, role, signals || [])
  
  return {
    outbound: {
      short,
      long,
      cta,
      reason_now: reasonNow
    },
    score: {
      lead_potential_score: leadPotentialScore
    }
  }
}
