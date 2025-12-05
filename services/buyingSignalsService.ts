/**
 * Buying Signals Service de IntroEngine
 * 
 * Servicio para detectar señales de compra (buying signals) para empresas:
 * - hiring: Están contratando activamente
 * - growth: Crecimiento rápido (funding, expansión)
 * - operational_chaos: Problemas operacionales detectados
 * - hr_shortage: Escasez de personal HR/recruiting
 * - expansion: Expansión geográfica o de mercado
 * - compliance_issues: Problemas de compliance detectados
 * - manual_processes: Procesos manuales que podrían automatizarse
 * 
 * Fuentes de datos:
 * - Datos enriquecidos de Clearbit/Apollo
 * - APIs de job boards (LinkedIn, Indeed, etc.)
 * - Análisis de web scraping
 * - Datos de funding (Crunchbase, etc.)
 */

import { createClient } from '@/config/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export type BuyingSignalType = 
  | 'hiring'
  | 'growth'
  | 'operational_chaos'
  | 'hr_shortage'
  | 'expansion'
  | 'compliance_issues'
  | 'manual_processes'

export interface BuyingSignal {
  id: string
  account_id: string
  company_id: string
  signal_type: BuyingSignalType
  status: 'active' | 'resolved' | 'dismissed'
  confidence: number // 0-100
  source: 'system' | 'manual' | 'api' | 'enrichment'
  detected_at: string
  resolved_at: string | null
  metadata: Record<string, any> | null
}

export interface CompanyData {
  id: string
  name: string
  domain: string | null
  website: string | null
  industry: string | null
  size_bucket: string | null
  enrichment_data: Record<string, any> | null
}

export interface DetectedSignal {
  signal_type: BuyingSignalType
  confidence: number
  source: 'system' | 'api' | 'enrichment'
  metadata: Record<string, any>
  reason: string
}

// ============================================================================
// HELPERS DE ACCESO A DATOS
// ============================================================================

function getSupabaseClient(): SupabaseClient {
  return createClient()
}

/**
 * Obtiene datos de una empresa
 */
async function getCompanyData(
  accountId: string,
  companyId: string
): Promise<CompanyData | null> {
  try {
    const supabase = getSupabaseClient()
    
    const { data, error } = await supabase
      .from('companies')
      .select('id, name, domain, website, industry, size_bucket, enrichment_data')
      .eq('id', companyId)
      .eq('account_id', accountId)
      .single()
    
    if (error || !data) {
      console.error(`[Buying Signals] Error fetching company ${companyId}:`, error)
      return null
    }
    
    return {
      id: data.id,
      name: data.name,
      domain: data.domain,
      website: data.website,
      industry: data.industry,
      size_bucket: data.size_bucket,
      enrichment_data: data.enrichment_data as Record<string, any> | null
    }
  } catch (error) {
    console.error(`[Buying Signals] Exception fetching company ${companyId}:`, error)
    return null
  }
}

// ============================================================================
// DETECCIÓN DE SEÑALES
// ============================================================================

/**
 * Detecta señales de hiring basándose en datos disponibles
 */
async function detectHiringSignals(
  company: CompanyData
): Promise<DetectedSignal[]> {
  const signals: DetectedSignal[] = []
  
  // 1. Verificar si hay datos de enriquecimiento con tecnologías de recruiting
  if (company.enrichment_data) {
    const technologies = company.enrichment_data.technologies || []
    const recruitingTechs = ['greenhouse', 'lever', 'workday', 'bamboohr', 'jobvite', 'smartrecruiters']
    
    const hasRecruitingTech = technologies.some((tech: string) => 
      recruitingTechs.some(rt => tech.toLowerCase().includes(rt))
    )
    
    if (hasRecruitingTech) {
      signals.push({
        signal_type: 'hiring',
        confidence: 60,
        source: 'enrichment',
        metadata: { technologies },
        reason: 'Tecnologías de recruiting detectadas en stack tecnológico'
      })
    }
  }
  
  // 2. Verificar crecimiento rápido (puede indicar hiring)
  if (company.enrichment_data?.employee_count) {
    const employeeCount = company.enrichment_data.employee_count
    const sizeBucket = company.size_bucket
    
    // Si la empresa está en un bucket pequeño pero tiene muchos empleados según enriquecimiento,
    // puede estar creciendo
    if (sizeBucket && employeeCount) {
      const bucketMax = getBucketMax(sizeBucket)
      if (employeeCount > bucketMax * 0.8) {
        signals.push({
          signal_type: 'hiring',
          confidence: 50,
          source: 'enrichment',
          metadata: { employee_count: employeeCount, size_bucket: sizeBucket },
          reason: 'Crecimiento de empleados detectado'
        })
      }
    }
  }
  
  // TODO: Integrar con APIs de job boards (LinkedIn, Indeed) para detectar postings activos
  // TODO: Scraping de career pages
  
  return signals
}

/**
 * Detecta señales de growth
 */
async function detectGrowthSignals(
  company: CompanyData
): Promise<DetectedSignal[]> {
  const signals: DetectedSignal[] = []
  
  if (company.enrichment_data) {
    // 1. Verificar funding reciente (si está en metadata)
    const funding = company.enrichment_data.metadata?.funding
    if (funding && funding.amount && funding.date) {
      const fundingDate = new Date(funding.date)
      const daysSinceFunding = (Date.now() - fundingDate.getTime()) / (1000 * 60 * 60 * 24)
      
      if (daysSinceFunding < 180) { // Últimos 6 meses
        signals.push({
          signal_type: 'growth',
          confidence: 80,
          source: 'enrichment',
          metadata: { funding },
          reason: `Funding reciente detectado: ${funding.amount}`
        })
      }
    }
    
    // 2. Verificar expansión geográfica
    const locations = company.enrichment_data.metadata?.locations || []
    if (locations.length > 1) {
      signals.push({
        signal_type: 'growth',
        confidence: 40,
        source: 'enrichment',
        metadata: { locations },
        reason: 'Múltiples ubicaciones detectadas (expansión geográfica)'
      })
    }
    
    // 3. Verificar crecimiento de empleados
    const employeeCount = company.enrichment_data.employee_count
    if (employeeCount && employeeCount > 100) {
      signals.push({
        signal_type: 'growth',
        confidence: 50,
        source: 'enrichment',
        metadata: { employee_count: employeeCount },
        reason: 'Empresa de tamaño considerable, potencial de crecimiento'
      })
    }
  }
  
  // TODO: Integrar con Crunchbase API para funding data
  // TODO: Detectar expansión de productos/servicios
  
  return signals
}

/**
 * Detecta señales de operational_chaos
 */
async function detectOperationalChaosSignals(
  company: CompanyData
): Promise<DetectedSignal[]> {
  const signals: DetectedSignal[] = []
  
  // Esta señal es más difícil de detectar automáticamente
  // Se puede inferir de:
  // - Reviews negativas en Glassdoor
  // - Alta rotación de empleados (si tenemos datos)
  // - Problemas reportados en redes sociales
  
  // Por ahora, retornamos señales vacías
  // TODO: Integrar con APIs de reviews, social media monitoring
  
  return signals
}

/**
 * Detecta señales de hr_shortage
 */
async function detectHrShortageSignals(
  company: CompanyData
): Promise<DetectedSignal[]> {
  const signals: DetectedSignal[] = []
  
  // Si hay muchas posiciones abiertas de HR/recruiting, puede indicar escasez
  // TODO: Integrar con job boards para contar postings de HR
  
  // Por ahora, inferir de tamaño de empresa
  if (company.size_bucket && ['51-200', '201-500', '501-1000', '1000+'].includes(company.size_bucket)) {
    // Empresas medianas/grandes suelen necesitar más procesos de HR
    signals.push({
      signal_type: 'hr_shortage',
      confidence: 30,
      source: 'system',
      metadata: { size_bucket: company.size_bucket },
      reason: 'Empresa de tamaño mediano/grande, potencial necesidad de herramientas HR'
    })
  }
  
  return signals
}

/**
 * Detecta señales de expansion
 */
async function detectExpansionSignals(
  company: CompanyData
): Promise<DetectedSignal[]> {
  const signals: DetectedSignal[] = []
  
  if (company.enrichment_data) {
    // Múltiples ubicaciones
    const locations = company.enrichment_data.metadata?.locations || []
    if (locations.length > 1) {
      signals.push({
        signal_type: 'expansion',
        confidence: 50,
        source: 'enrichment',
        metadata: { locations },
        reason: 'Múltiples ubicaciones detectadas'
      })
    }
    
    // Nuevos productos/servicios mencionados
    const tags = company.enrichment_data.tags || []
    if (tags.length > 5) {
      signals.push({
        signal_type: 'expansion',
        confidence: 40,
        source: 'enrichment',
        metadata: { tags },
        reason: 'Diversificación de productos/servicios detectada'
      })
    }
  }
  
  return signals
}

/**
 * Detecta señales de compliance_issues
 */
async function detectComplianceIssuesSignals(
  company: CompanyData
): Promise<DetectedSignal[]> {
  const signals: DetectedSignal[] = []
  
  // Esta señal requiere datos específicos de compliance
  // TODO: Integrar con APIs de compliance, news monitoring
  
  // Por industria, algunas tienen más necesidades de compliance
  const highComplianceIndustries = ['healthcare', 'finance', 'legal', 'insurance', 'pharmaceutical']
  if (company.industry && highComplianceIndustries.some(industry => 
    company.industry!.toLowerCase().includes(industry)
  )) {
    signals.push({
      signal_type: 'compliance_issues',
      confidence: 40,
      source: 'system',
      metadata: { industry: company.industry },
      reason: 'Industria con altos requisitos de compliance'
    })
  }
  
  return signals
}

/**
 * Detecta señales de manual_processes
 */
async function detectManualProcessesSignals(
  company: CompanyData
): Promise<DetectedSignal[]> {
  const signals: DetectedSignal[] = []
  
  if (company.enrichment_data) {
    const technologies = company.enrichment_data.technologies || []
    
    // Si no tienen muchas herramientas de automatización, pueden tener procesos manuales
    const automationTechs = ['zapier', 'make', 'n8n', 'airtable', 'notion', 'asana', 'monday']
    const hasAutomation = technologies.some((tech: string) => 
      automationTechs.some(at => tech.toLowerCase().includes(at))
    )
    
    if (!hasAutomation && technologies.length < 10) {
      signals.push({
        signal_type: 'manual_processes',
        confidence: 50,
        source: 'enrichment',
        metadata: { technologies },
        reason: 'Stack tecnológico limitado, posibles procesos manuales'
      })
    }
  }
  
  // Empresas pequeñas/medianas suelen tener más procesos manuales
  if (company.size_bucket && ['1-10', '11-50', '51-200'].includes(company.size_bucket)) {
    signals.push({
      signal_type: 'manual_processes',
      confidence: 40,
      source: 'system',
      metadata: { size_bucket: company.size_bucket },
      reason: 'Empresa pequeña/mediana, potencial para automatización'
    })
  }
  
  return signals
}

/**
 * Detecta todas las señales para una empresa
 */
async function detectAllSignals(
  accountId: string,
  companyId: string
): Promise<DetectedSignal[]> {
  const company = await getCompanyData(accountId, companyId)
  
  if (!company) {
    return []
  }
  
  // Ejecutar todas las detecciones en paralelo
  const [
    hiringSignals,
    growthSignals,
    operationalChaosSignals,
    hrShortageSignals,
    expansionSignals,
    complianceIssuesSignals,
    manualProcessesSignals
  ] = await Promise.all([
    detectHiringSignals(company),
    detectGrowthSignals(company),
    detectOperationalChaosSignals(company),
    detectHrShortageSignals(company),
    detectExpansionSignals(company),
    detectComplianceIssuesSignals(company),
    detectManualProcessesSignals(company)
  ])
  
  return [
    ...hiringSignals,
    ...growthSignals,
    ...operationalChaosSignals,
    ...hrShortageSignals,
    ...expansionSignals,
    ...complianceIssuesSignals,
    ...manualProcessesSignals
  ]
}

// ============================================================================
// PERSISTENCIA
// ============================================================================

/**
 * Guarda o actualiza una señal de compra
 */
async function upsertSignal(
  accountId: string,
  companyId: string,
  signal: DetectedSignal
): Promise<boolean> {
  try {
    const supabase = getSupabaseClient()
    
    // Verificar si ya existe una señal activa del mismo tipo
    const { data: existing, error: fetchError } = await supabase
      .from('buying_signals')
      .select('id, confidence')
      .eq('account_id', accountId)
      .eq('company_id', companyId)
      .eq('signal_type', signal.signal_type)
      .eq('status', 'active')
      .maybeSingle()
    
    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error(`[Buying Signals] Error checking existing signal:`, fetchError)
      return false
    }
    
    const signalData = {
      account_id: accountId,
      company_id: companyId,
      signal_type: signal.signal_type,
      status: 'active' as const,
      confidence: signal.confidence,
      source: signal.source,
      metadata: signal.metadata,
      detected_at: new Date().toISOString()
    }
    
    if (existing) {
      // Actualizar solo si la nueva confianza es mayor
      if (signal.confidence > existing.confidence) {
        const { error } = await supabase
          .from('buying_signals')
          .update({
            ...signalData,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
        
        if (error) {
          console.error(`[Buying Signals] Error updating signal:`, error)
          return false
        }
      }
    } else {
      // Crear nueva señal
      const { error } = await supabase
        .from('buying_signals')
        .insert(signalData)
      
      if (error) {
        console.error(`[Buying Signals] Error creating signal:`, error)
        return false
      }
    }
    
    return true
  } catch (error) {
    console.error(`[Buying Signals] Exception upserting signal:`, error)
    return false
  }
}

/**
 * Obtiene señales activas para una empresa
 */
export async function getActiveSignalsForCompany(
  accountId: string,
  companyId: string
): Promise<BuyingSignal[]> {
  try {
    const supabase = getSupabaseClient()
    
    const { data, error } = await supabase
      .from('buying_signals')
      .select('*')
      .eq('account_id', accountId)
      .eq('company_id', companyId)
      .eq('status', 'active')
      .order('confidence', { ascending: false })
    
    if (error) {
      console.error(`[Buying Signals] Error fetching signals:`, error)
      return []
    }
    
    return (data || []) as BuyingSignal[]
  } catch (error) {
    console.error(`[Buying Signals] Exception fetching signals:`, error)
    return []
  }
}

// ============================================================================
// FUNCIONES PÚBLICAS
// ============================================================================

/**
 * Detecta y guarda señales de compra para una empresa
 */
export async function detectSignalsForCompany(
  accountId: string,
  companyId: string
): Promise<{ detected: number; saved: number; errors: number }> {
  console.log(`[Buying Signals] Detecting signals for company ${companyId} (account: ${accountId})`)
  
  try {
    // 1. Detectar todas las señales
    const signals = await detectAllSignals(accountId, companyId)
    
    if (signals.length === 0) {
      console.log(`[Buying Signals] No signals detected for company ${companyId}`)
      return { detected: 0, saved: 0, errors: 0 }
    }
    
    console.log(`[Buying Signals] Detected ${signals.length} signals for company ${companyId}`)
    
    // 2. Guardar cada señal
    let saved = 0
    let errors = 0
    
    for (const signal of signals) {
      try {
        const success = await upsertSignal(accountId, companyId, signal)
        if (success) {
          saved++
        } else {
          errors++
        }
      } catch (error) {
        console.error(`[Buying Signals] Error saving signal ${signal.signal_type}:`, error)
        errors++
      }
    }
    
    console.log(`[Buying Signals] Company ${companyId}: ${saved} saved, ${errors} errors`)
    
    // Registrar en activity logs las señales detectadas
    try {
      const { logBuyingSignalDetected } = await import('./activityLogger')
      for (const signal of signals) {
        if (signal.confidence >= 30) {
          await logBuyingSignalDetected(
            accountId,
            companyId,
            signal.signal_type,
            signal.confidence,
            { reason: signal.reason, source: signal.source }
          )
        }
      }
    } catch (logError) {
      // No fallar si el logging falla
      console.warn(`[Buying Signals] Failed to log signal activities:`, logError)
    }
    
    return { detected: signals.length, saved, errors }
  } catch (error) {
    console.error(`[Buying Signals] Fatal error detecting signals for company ${companyId}:`, error)
    return { detected: 0, saved: 0, errors: 1 }
  }
}

/**
 * Detecta señales para todas las empresas de una cuenta
 */
export async function detectSignalsForAccount(
  accountId: string,
  options?: { limit?: number; onlyEnriched?: boolean }
): Promise<{ processed: number; detected: number; saved: number; errors: number }> {
  console.log(`[Buying Signals] Detecting signals for account ${accountId}`)
  
  try {
    const supabase = getSupabaseClient()
    
    // Obtener empresas
    let query = supabase
      .from('companies')
      .select('id')
      .eq('account_id', accountId)
    
    if (options?.onlyEnriched) {
      query = query.eq('enrichment_status', 'completed')
    }
    
    if (options?.limit) {
      query = query.limit(options.limit)
    }
    
    const { data: companies, error } = await query
    
    if (error) {
      console.error(`[Buying Signals] Error fetching companies:`, error)
      return { processed: 0, detected: 0, saved: 0, errors: 1 }
    }
    
    if (!companies || companies.length === 0) {
      console.log(`[Buying Signals] No companies found for account ${accountId}`)
      return { processed: 0, detected: 0, saved: 0, errors: 0 }
    }
    
    let processed = 0
    let totalDetected = 0
    let totalSaved = 0
    let totalErrors = 0
    
    for (const company of companies) {
      try {
        const result = await detectSignalsForCompany(accountId, company.id)
        processed++
        totalDetected += result.detected
        totalSaved += result.saved
        totalErrors += result.errors
      } catch (error) {
        console.error(`[Buying Signals] Error processing company ${company.id}:`, error)
        totalErrors++
      }
    }
    
    console.log(
      `[Buying Signals] Account ${accountId}: ${processed} processed, ${totalDetected} detected, ${totalSaved} saved, ${totalErrors} errors`
    )
    
    return { processed, detected: totalDetected, saved: totalSaved, errors: totalErrors }
  } catch (error) {
    console.error(`[Buying Signals] Fatal error detecting signals for account ${accountId}:`, error)
    return { processed: 0, detected: 0, saved: 0, errors: 1 }
  }
}

/**
 * Resuelve una señal (marca como resuelta)
 */
export async function resolveSignal(
  accountId: string,
  signalId: string
): Promise<boolean> {
  try {
    const supabase = getSupabaseClient()
    
    const { error } = await supabase
      .from('buying_signals')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', signalId)
      .eq('account_id', accountId)
    
    if (error) {
      console.error(`[Buying Signals] Error resolving signal:`, error)
      return false
    }
    
    return true
  } catch (error) {
    console.error(`[Buying Signals] Exception resolving signal:`, error)
    return false
  }
}

/**
 * Descarta una señal (marca como dismissed)
 */
export async function dismissSignal(
  accountId: string,
  signalId: string
): Promise<boolean> {
  try {
    const supabase = getSupabaseClient()
    
    const { error } = await supabase
      .from('buying_signals')
      .update({
        status: 'dismissed',
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', signalId)
      .eq('account_id', accountId)
    
    if (error) {
      console.error(`[Buying Signals] Error dismissing signal:`, error)
      return false
    }
    
    return true
  } catch (error) {
    console.error(`[Buying Signals] Exception dismissing signal:`, error)
    return false
  }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Obtiene el máximo de empleados para un bucket
 */
function getBucketMax(bucket: string): number {
  const bucketMap: Record<string, number> = {
    '1-10': 10,
    '11-50': 50,
    '51-200': 200,
    '201-500': 500,
    '501-1000': 1000,
    '1000+': 10000
  }
  return bucketMap[bucket] || 0
}

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default {
  detectSignalsForCompany,
  detectSignalsForAccount,
  getActiveSignalsForCompany,
  resolveSignal,
  dismissSignal
}
