// Sistema de scoring comercial avanzado para IntroEngine
// Genera 4 scores para evaluar el potencial de un lead

export type Company = {
  id: string
  name: string
  industry?: string | null
  size_bucket?: string | null // 'startup', 'small', 'medium', 'large', 'enterprise'
  domain?: string | null
  website?: string | null
}

export type Contact = {
  id: string
  full_name: string
  email?: string | null
  company_id?: string | null
  role_title?: string | null
  seniority?: string | null
  connections?: string[] | null
}

export type Opportunity = {
  id?: string
  company_id: string
  target_contact_id?: string | null
  type?: 'direct' | 'second_level' | 'inferred' | null
  bridge_contact_id?: string | null
  confidence?: number | null
  buying_signals?: BuyingSignal[] | null
}

export type BuyingSignal = {
  type: 'hiring' | 'growth' | 'operational_chaos' | 'hr_shortage' | 'expansion' | 'compliance_issues' | 'manual_processes'
  description?: string | null
  strength?: 'low' | 'medium' | 'high'
}

export type ScoringResult = {
  scores: {
    industry_fit_score: number
    buying_signal_score: number
    intro_strength_score: number
    lead_potential_score: number
  }
  explanation: string
}

/**
 * Normaliza el tamaño de la empresa
 */
function getCompanySize(sizeBucket: string | null | undefined): 'startup' | 'small' | 'medium' | 'large' | 'enterprise' {
  if (!sizeBucket) return 'small'
  
  const normalized = sizeBucket.toLowerCase()
  if (normalized.includes('startup') || normalized.includes('micro')) return 'startup'
  if (normalized.includes('small') || normalized.includes('pequeña') || normalized.includes('1-10') || normalized.includes('1-50')) return 'small'
  if (normalized.includes('medium') || normalized.includes('mediana') || normalized.includes('50-200') || normalized.includes('51-200')) return 'medium'
  if (normalized.includes('large') || normalized.includes('grande') || normalized.includes('200-1000')) return 'large'
  if (normalized.includes('enterprise') || normalized.includes('1000+')) return 'enterprise'
  
  return 'small' // Default
}

/**
 * Calcula industry_fit_score (0-100)
 * Qué tan bien encaja la empresa con un SaaS de RRHH/control horario para pymes
 */
function calculateIndustryFitScore(company: Company): number {
  let score = 50 // Base
  
  const companySize = getCompanySize(company.size_bucket)
  const industry = company.industry?.toLowerCase() || ''
  
  // Ajustar por tamaño (Witar es para pymes)
  if (companySize === 'startup' || companySize === 'small') {
    score += 25 // Perfecto para pymes
  } else if (companySize === 'medium') {
    score += 15 // Bueno para medianas
  } else if (companySize === 'large') {
    score -= 10 // Menos relevante para grandes
  } else if (companySize === 'enterprise') {
    score -= 20 // No es el target
  }
  
  // Ajustar por industria (algunas tienen más necesidad de control horario)
  const highFitIndustries = [
    'retail', 'retail', 'comercio', 'tienda',
    'restaurante', 'hospitalidad', 'hotel', 'turismo',
    'servicios', 'servicio', 'atención al cliente',
    'manufactura', 'producción', 'fábrica',
    'logística', 'transporte', 'distribución',
    'salud', 'salud', 'clínica', 'hospital',
    'educación', 'educativo', 'escuela',
    'construcción', 'obra', 'inmobiliaria'
  ]
  
  const mediumFitIndustries = [
    'technology', 'tech', 'software', 'saas',
    'consultoría', 'consulting', 'asesoría',
    'marketing', 'publicidad', 'comunicación',
    'finanzas', 'finance', 'contabilidad'
  ]
  
  const lowFitIndustries = [
    'banca', 'banking', 'financiera',
    'gobierno', 'público', 'estatal'
  ]
  
  if (highFitIndustries.some(term => industry.includes(term))) {
    score += 20 // Alta necesidad de control horario
  } else if (mediumFitIndustries.some(term => industry.includes(term))) {
    score += 10 // Necesidad media
  } else if (lowFitIndustries.some(term => industry.includes(term))) {
    score -= 15 // Baja necesidad o no aplicable
  }
  
  // Asegurar que esté en rango 0-100
  return Math.min(100, Math.max(0, score))
}

/**
 * Calcula buying_signal_score (0-100)
 * Señales que muestran intención de compra
 */
function calculateBuyingSignalScore(opportunity: Opportunity): number {
  let score = 30 // Base (sin señales)
  
  const signals = opportunity.buying_signals || []
  
  if (signals.length === 0) {
    return score // Sin señales, score bajo
  }
  
  // Ponderar señales por tipo y fuerza
  const signalWeights: Record<string, number> = {
    'hiring': 25, // Muy relevante
    'hr_shortage': 30, // Muy relevante
    'operational_chaos': 20,
    'manual_processes': 20,
    'growth': 15,
    'expansion': 15,
    'compliance_issues': 25
  }
  
  const strengthMultipliers: Record<string, number> = {
    'high': 1.0,
    'medium': 0.7,
    'low': 0.4
  }
  
  let totalSignalValue = 0
  let maxPossibleValue = 0
  
  for (const signal of signals) {
    const weight = signalWeights[signal.type] || 10
    const strength = signal.strength || 'medium'
    const multiplier = strengthMultipliers[strength] || 0.7
    
    const signalValue = weight * multiplier
    totalSignalValue += signalValue
    maxPossibleValue += weight // Máximo si fuera high
  }
  
  // Normalizar a 0-100
  if (maxPossibleValue > 0) {
    score = 30 + (totalSignalValue / maxPossibleValue) * 70 // 30-100
  }
  
  // Bonus por múltiples señales
  if (signals.length >= 2) {
    score += 5
  }
  if (signals.length >= 3) {
    score += 5
  }
  
  // Asegurar que esté en rango 0-100
  return Math.min(100, Math.max(0, Math.round(score)))
}

/**
 * Calcula intro_strength_score (0-100)
 * Calidad del puente entre usuario y objetivo
 */
function calculateIntroStrengthScore(
  opportunity: Opportunity,
  contacts: Contact[]
): number {
  // Si no hay puente, score bajo
  if (!opportunity.bridge_contact_id && opportunity.type !== 'direct') {
    return 20 // Sin puente, muy difícil
  }
  
  let score = 50 // Base
  
  // Ajustar por tipo de ruta
  if (opportunity.type === 'direct') {
    score = 90 // Conexión directa es muy fuerte
  } else if (opportunity.type === 'second_level') {
    score = 70 // Segundo nivel es bueno
  } else if (opportunity.type === 'inferred') {
    score = 40 // Inferida es débil
  }
  
  // Ajustar por confianza de la ruta
  if (opportunity.confidence !== null && opportunity.confidence !== undefined) {
    // La confianza ya está en 0-100, mezclar con el score base
    score = Math.round((score * 0.6) + (opportunity.confidence * 0.4))
  }
  
  // Ajustar por calidad del puente (si existe)
  if (opportunity.bridge_contact_id) {
    const bridgeContact = contacts.find(c => c.id === opportunity.bridge_contact_id)
    
    if (bridgeContact) {
      // Evaluar relevancia del rol del puente
      const roleTitle = bridgeContact.role_title?.toLowerCase() || ''
      const seniority = bridgeContact.seniority?.toLowerCase() || ''
      
      // Puentes en RRHH o CEO son más valiosos
      if (roleTitle.includes('rrhh') || roleTitle.includes('hr') || 
          roleTitle.includes('recursos humanos') || roleTitle.includes('people')) {
        score += 10 // RRHH es muy relevante
      } else if (roleTitle.includes('ceo') || roleTitle.includes('director general') ||
                 seniority.includes('c-level')) {
        score += 8 // CEO tiene mucho poder
      } else if (roleTitle.includes('director') || seniority.includes('director')) {
        score += 5 // Directores tienen influencia
      }
      
      // Evaluar cercanía (número de conexiones compartidas)
      if (bridgeContact.connections && bridgeContact.connections.length > 0) {
        // Más conexiones = más cercanía potencial
        if (bridgeContact.connections.length >= 10) {
          score += 5
        } else if (bridgeContact.connections.length >= 5) {
          score += 3
        }
      }
    }
  }
  
  // Asegurar que esté en rango 0-100
  return Math.min(100, Math.max(0, score))
}

/**
 * Calcula lead_potential_score (0-100)
 * Valor total del lead combinando industria + señales + accesibilidad
 */
function calculateLeadPotentialScore(
  industryFit: number,
  buyingSignal: number,
  introStrength: number
): number {
  // Ponderación: industria (30%), señales (40%), accesibilidad (30%)
  // Esto refleja que las señales son lo más importante, pero necesitas
  // un buen fit de industria y una forma de acceder
  
  const weightedScore = 
    (industryFit * 0.30) +
    (buyingSignal * 0.40) +
    (introStrength * 0.30)
  
  return Math.round(Math.min(100, Math.max(0, weightedScore)))
}

/**
 * Genera explicación breve (2-3 líneas)
 */
function generateExplanation(
  industryFit: number,
  buyingSignal: number,
  introStrength: number,
  leadPotential: number,
  company: Company,
  opportunity: Opportunity
): string {
  const companySize = getCompanySize(company.size_bucket)
  const hasBridge = opportunity.bridge_contact_id || opportunity.type === 'direct'
  const hasSignals = (opportunity.buying_signals?.length || 0) > 0
  
  let explanation = ''
  
  // Primera línea: evaluación general
  if (leadPotential >= 70) {
    explanation += 'Lead de alto potencial: '
  } else if (leadPotential >= 50) {
    explanation += 'Lead con potencial moderado: '
  } else {
    explanation += 'Lead con potencial limitado: '
  }
  
  // Segunda línea: factores clave
  const factors: string[] = []
  
  if (industryFit >= 70) {
    factors.push('excelente fit de industria')
  } else if (industryFit < 50) {
    factors.push('fit de industria limitado')
  }
  
  if (buyingSignal >= 70) {
    factors.push('fuertes señales de compra')
  } else if (buyingSignal < 40) {
    factors.push('señales de compra débiles')
  }
  
  if (introStrength >= 70) {
    factors.push('buen acceso a través de puente')
  } else if (introStrength < 40 && !hasBridge) {
    factors.push('sin acceso directo')
  }
  
  if (factors.length > 0) {
    explanation += factors.join(', ') + '.'
  } else {
    explanation += 'evaluación balanceada en todos los factores.'
  }
  
  // Tercera línea: recomendación
  if (leadPotential >= 70) {
    explanation += ' Priorizar este lead para seguimiento inmediato.'
  } else if (leadPotential >= 50) {
    explanation += ' Considerar seguimiento si hay capacidad disponible.'
  } else {
    explanation += ' Evaluar si vale la pena invertir tiempo en este lead.'
  }
  
  return explanation
}

/**
 * Función principal: calcula todos los scores
 */
export function calculateCommercialScores(
  company: Company,
  contacts: Contact[],
  opportunity: Opportunity
): ScoringResult {
  // Calcular cada score individual
  const industryFitScore = calculateIndustryFitScore(company)
  const buyingSignalScore = calculateBuyingSignalScore(opportunity)
  const introStrengthScore = calculateIntroStrengthScore(opportunity, contacts)
  const leadPotentialScore = calculateLeadPotentialScore(
    industryFitScore,
    buyingSignalScore,
    introStrengthScore
  )
  
  // Generar explicación
  const explanation = generateExplanation(
    industryFitScore,
    buyingSignalScore,
    introStrengthScore,
    leadPotentialScore,
    company,
    opportunity
  )
  
  return {
    scores: {
      industry_fit_score: industryFitScore,
      buying_signal_score: buyingSignalScore,
      intro_strength_score: introStrengthScore,
      lead_potential_score: leadPotentialScore
    },
    explanation
  }
}
