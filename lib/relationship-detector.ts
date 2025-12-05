// Motor experto de detección de relaciones para IntroEngine
// Analiza contactos del usuario y contactos objetivo para encontrar rutas de conexión

export type Contact = {
  id: string
  full_name: string
  email?: string | null
  company_id?: string | null
  company_name?: string | null
  role_title?: string | null
  seniority?: string | null
  previous_companies?: string[] | null
  previous_roles?: string[] | null
  linkedin_url?: string | null
  connections?: string[] | null
  interactions?: string[] | null
}

export type Company = {
  id: string
  name: string
  domain?: string | null
  industry?: string | null
}

export type TargetContact = {
  id: string
  full_name: string
  role_title: string
  seniority: string
  company_id: string
  email?: string | null
  previous_companies?: string[] | null
  previous_roles?: string[] | null
  linkedin_url?: string | null
  connections?: string[] | null
}

export type RouteType = 'direct' | 'second_level' | 'inferred'

export type BridgeContact = {
  id: string
  full_name: string
}

export type BestRoute = {
  type: RouteType
  bridge_contact: BridgeContact | null
  confidence: number
  why: string
}

export type Opportunity = {
  company_id: string
  target: {
    id: string
    full_name: string
    role_title: string
    seniority: string
  }
  best_route: BestRoute
  suggested_intro_message: string
  score: {
    intro_strength_score: number
  }
}

export type AnalysisResult = {
  opportunities: Opportunity[]
}

/**
 * Normaliza nombres para comparación (remueve acentos, convierte a minúsculas)
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

/**
 * Calcula similitud entre dos nombres (0-1)
 */
function nameSimilarity(name1: string, name2: string): number {
  const n1 = normalizeName(name1)
  const n2 = normalizeName(name2)
  
  if (n1 === n2) return 1.0
  
  // Verificar si uno contiene al otro
  if (n1.includes(n2) || n2.includes(n1)) return 0.8
  
  // Verificar palabras comunes
  const words1 = n1.split(/\s+/)
  const words2 = n2.split(/\s+/)
  const commonWords = words1.filter(w => words2.includes(w))
  if (commonWords.length > 0) return 0.6
  
  return 0.0
}

/**
 * Normaliza nombres de empresas para comparación
 */
function normalizeCompanyName(name: string): string {
  return normalizeName(name)
    .replace(/\b(inc|llc|ltd|corp|corporation|company|co)\b/g, '')
    .replace(/[^\w\s]/g, '')
    .trim()
}

/**
 * Verifica si dos empresas son la misma o similares
 */
function areSameCompany(company1: string | null | undefined, company2: string | null | undefined): boolean {
  if (!company1 || !company2) return false
  
  const n1 = normalizeCompanyName(company1)
  const n2 = normalizeCompanyName(company2)
  
  if (n1 === n2) return true
  if (n1.includes(n2) || n2.includes(n1)) return true
  
  return false
}

/**
 * Verifica si un contacto tiene conexión directa con el objetivo
 */
function hasDirectConnection(userContact: Contact, target: TargetContact): boolean {
  // Misma persona (mismo ID o mismo nombre + email)
  if (userContact.id === target.id) return true
  
  if (userContact.email && target.email && userContact.email === target.email) return true
  
  const nameSim = nameSimilarity(userContact.full_name, target.full_name)
  if (nameSim > 0.8 && userContact.email && target.email && userContact.email === target.email) {
    return true
  }
  
  // Verificar si están en la lista de conexiones
  if (userContact.connections?.includes(target.id)) return true
  if (target.connections?.includes(userContact.id)) return true
  
  return false
}

/**
 * Verifica si hay conexión de segundo nivel (usuario -> puente -> objetivo)
 */
function findSecondLevelRoute(
  userContacts: Contact[],
  target: TargetContact
): { bridge: Contact; confidence: number; reason: string } | null {
  for (const bridge of userContacts) {
    // El puente debe conocer al objetivo
    const bridgeKnowsTarget = 
      bridge.connections?.includes(target.id) ||
      (bridge.company_id === target.company_id && bridge.company_id) ||
      bridge.previous_companies?.some(prev => 
        target.previous_companies?.includes(prev) || 
        target.company_id === prev
      )
    
    if (bridgeKnowsTarget) {
      let confidence = 60
      let reason = 'Conexión de segundo nivel detectada'
      
      // Aumentar confianza si comparten empresa actual
      if (bridge.company_id === target.company_id) {
        confidence = 85
        reason = 'El puente trabaja en la misma empresa que el objetivo'
      }
      // Aumentar confianza si comparten empresa previa
      else if (bridge.previous_companies?.some(prev => target.previous_companies?.includes(prev))) {
        confidence = 75
        reason = 'El puente y el objetivo trabajaron en la misma empresa anteriormente'
      }
      // Aumentar confianza si están en conexiones
      else if (bridge.connections?.includes(target.id)) {
        confidence = 70
        reason = 'El puente tiene conexión directa con el objetivo'
      }
      
      return { bridge, confidence, reason }
    }
  }
  
  return null
}

/**
 * Detecta relaciones inferidas basadas en patrones
 */
function findInferredRoute(
  userContacts: Contact[],
  target: TargetContact,
  companies: Company[]
): { bridge: Contact | null; confidence: number; reason: string } | null {
  let bestMatch: { bridge: Contact | null; confidence: number; reason: string } | null = null
  
  // Estrategia 1: Historial laboral compartido
  for (const contact of userContacts) {
    let confidence = 0
    let reason = ''
    
    // Misma empresa actual
    if (contact.company_id === target.company_id && contact.company_id) {
      confidence = 65
      reason = 'Comparten empresa actual'
    }
    // Empresas previas en común
    else if (contact.previous_companies && target.previous_companies) {
      const commonCompanies = contact.previous_companies.filter(c => 
        target.previous_companies?.includes(c)
      )
      if (commonCompanies.length > 0) {
        confidence = 55
        reason = `Comparten ${commonCompanies.length} empresa(s) previa(s)`
      }
    }
    // Roles similares en empresas relacionadas
    else if (contact.role_title && target.role_title) {
      const roleSim = nameSimilarity(contact.role_title, target.role_title)
      if (roleSim > 0.5) {
        confidence = 45
        reason = 'Roles similares en empresas relacionadas'
      }
    }
    
    if (confidence > (bestMatch?.confidence || 0)) {
      bestMatch = { bridge: contact, confidence, reason }
    }
  }
  
  // Estrategia 2: Empresas en común (sin contacto puente específico)
  if (!bestMatch || bestMatch.confidence < 50) {
    const targetCompany = companies.find(c => c.id === target.company_id)
    if (targetCompany) {
      // Buscar contactos en empresas relacionadas (mismo dominio, industria similar)
      for (const contact of userContacts) {
        const contactCompany = companies.find(c => c.id === contact.company_id)
        if (contactCompany) {
          // Mismo dominio
          if (targetCompany.domain && contactCompany.domain && 
              targetCompany.domain === contactCompany.domain) {
            if (!bestMatch || bestMatch.confidence < 50) {
              bestMatch = {
                bridge: contact,
                confidence: 50,
                reason: 'Empresas con mismo dominio'
              }
            }
          }
          // Misma industria
          else if (targetCompany.industry && contactCompany.industry &&
                   normalizeName(targetCompany.industry) === normalizeName(contactCompany.industry)) {
            if (!bestMatch || bestMatch.confidence < 40) {
              bestMatch = {
                bridge: contact,
                confidence: 40,
                reason: 'Empresas en la misma industria'
              }
            }
          }
        }
      }
    }
  }
  
  // Estrategia 3: Sin puente específico pero con contexto
  if (!bestMatch || bestMatch.confidence < 30) {
    // Verificar si hay interacciones públicas o contexto compartido
    const hasSharedContext = userContacts.some(c => 
      c.interactions?.some(i => i.includes(target.full_name)) ||
      c.interactions?.some(i => i.includes(target.company_id))
    )
    
    if (hasSharedContext) {
      bestMatch = {
        bridge: null,
        confidence: 35,
        reason: 'Contexto compartido detectado en interacciones'
      }
    }
  }
  
  return bestMatch && bestMatch.confidence >= 30 ? bestMatch : null
}

/**
 * Genera mensaje de introducción sugerido
 */
function generateIntroMessage(
  route: BestRoute,
  target: TargetContact,
  bridge: Contact | null
): string {
  if (route.type === 'direct') {
    return `Hola ${target.full_name}, me gustaría conectarme contigo para hablar sobre oportunidades de colaboración.`
  }
  
  if (route.type === 'second_level' && bridge) {
    return `Hola ${target.full_name}, ${bridge.full_name} me sugirió que me ponga en contacto contigo. Me encantaría conversar sobre cómo podríamos trabajar juntos.`
  }
  
  if (route.type === 'inferred' && bridge) {
    if (route.why.includes('misma empresa')) {
      return `Hola ${target.full_name}, vi que trabajas en ${target.company_id ? 'tu empresa' : 'una empresa relacionada'} y me gustaría explorar posibles sinergias.`
    }
    if (route.why.includes('empresa previa')) {
      return `Hola ${target.full_name}, noté que compartimos algunas conexiones profesionales y me gustaría conocer más sobre tu trabajo.`
    }
    return `Hola ${target.full_name}, me gustaría conectarme contigo para explorar oportunidades de colaboración.`
  }
  
  return `Hola ${target.full_name}, me gustaría conectarme contigo para hablar sobre posibles oportunidades de colaboración.`
}

/**
 * Calcula el score de fuerza de introducción (0-100)
 */
function calculateIntroStrengthScore(route: BestRoute, target: TargetContact): number {
  let score = route.confidence
  
  // Ajustar según seniority del objetivo
  const seniorityBonus: Record<string, number> = {
    'c-level': 10,
    'vp': 8,
    'director': 5,
    'manager': 3,
    'senior': 2,
    'mid': 0,
    'junior': -2
  }
  
  if (target.seniority && seniorityBonus[target.seniority.toLowerCase()]) {
    score += seniorityBonus[target.seniority.toLowerCase()]
  }
  
  // Bonus por tipo de ruta
  if (route.type === 'direct') score += 5
  else if (route.type === 'second_level') score += 3
  
  // Asegurar que esté en rango 0-100
  return Math.min(100, Math.max(0, score))
}

/**
 * Función principal: analiza relaciones y genera oportunidades
 */
export function analyzeRelationships(
  userContacts: Contact[],
  targetContacts: TargetContact[],
  companies: Company[]
): AnalysisResult {
  const opportunities: Opportunity[] = []
  
  for (const target of targetContacts) {
    let bestRoute: BestRoute | null = null
    
    // 1. Buscar conexión DIRECTA
    const directContact = userContacts.find(c => hasDirectConnection(c, target))
    if (directContact) {
      bestRoute = {
        type: 'direct',
        bridge_contact: {
          id: directContact.id,
          full_name: directContact.full_name
        },
        confidence: 95,
        why: 'Conexión directa con el objetivo'
      }
    }
    
    // 2. Buscar conexión de SEGUNDO NIVEL
    if (!bestRoute || bestRoute.confidence < 80) {
      const secondLevel = findSecondLevelRoute(userContacts, target)
      if (secondLevel && (!bestRoute || secondLevel.confidence > bestRoute.confidence)) {
        bestRoute = {
          type: 'second_level',
          bridge_contact: {
            id: secondLevel.bridge.id,
            full_name: secondLevel.bridge.full_name
          },
          confidence: secondLevel.confidence,
          why: secondLevel.reason
        }
      }
    }
    
    // 3. Buscar relación INFERIDA
    if (!bestRoute || bestRoute.confidence < 50) {
      const inferred = findInferredRoute(userContacts, target, companies)
      if (inferred && (!bestRoute || inferred.confidence > bestRoute.confidence)) {
        bestRoute = {
          type: 'inferred',
          bridge_contact: inferred.bridge ? {
            id: inferred.bridge.id,
            full_name: inferred.bridge.full_name
          } : null,
          confidence: inferred.confidence,
          why: inferred.reason
        }
      }
    }
    
    // Solo agregar si encontramos una ruta viable (confianza >= 30)
    if (bestRoute && bestRoute.confidence >= 30) {
      const bridgeContact = bestRoute.bridge_contact 
        ? userContacts.find(c => c.id === bestRoute.bridge_contact!.id) || null
        : null
      
      const introMessage = generateIntroMessage(bestRoute, target, bridgeContact)
      const introStrengthScore = calculateIntroStrengthScore(bestRoute, target)
      
      opportunities.push({
        company_id: target.company_id,
        target: {
          id: target.id,
          full_name: target.full_name,
          role_title: target.role_title,
          seniority: target.seniority
        },
        best_route: bestRoute,
        suggested_intro_message: introMessage,
        score: {
          intro_strength_score: introStrengthScore
        }
      })
    }
  }
  
  // Ordenar por score descendente
  opportunities.sort((a, b) => b.score.intro_strength_score - a.score.intro_strength_score)
  
  return { opportunities }
}
