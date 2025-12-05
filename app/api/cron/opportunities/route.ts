/**
 * Cronjob: Opportunities
 * 
 * Genera y recalcula oportunidades (intros + outbound + scoring) para todas las cuentas activas.
 * 
 * Schedule sugerido: 2-4 veces al día (ej: 6:00 AM, 12:00 PM, 6:00 PM UTC)
 * 
 * Para configurar en Vercel:
 * - Agregar en vercel.json o configuración de cron:
 *   {
 *     "crons": [{
 *       "path": "/api/cron/opportunities",
 *       "schedule": "0 6,12,18 * * *"
 *     }]
 *   }
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/config/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'
import { recalculateIntroOpportunitiesForAccount } from '@/services/relationshipEngine'
import { autoGenerateOutboundForAccount } from '@/services/outboundEngine'
import { scoreAllOpportunitiesForAccount } from '@/services/scoringEngine'

// ============================================================================
// TIPOS
// ============================================================================

interface AccountRecord {
  id: string
  name: string | null
  is_active: boolean
}

// ============================================================================
// HELPERS
// ============================================================================

function getSupabaseClient(): SupabaseClient {
  return createClient()
}

/**
 * Obtiene todas las cuentas activas
 */
async function getActiveAccounts(): Promise<AccountRecord[]> {
  try {
    const supabase = getSupabaseClient()
    
    const { data: accounts, error } = await supabase
      .from('accounts')
      .select('id, name, is_active')
      .eq('is_active', true)
    
    if (error) {
      console.error('[Cron Opportunities] Error fetching active accounts:', error)
      return []
    }
    
    return accounts || []
  } catch (error) {
    console.error('[Cron Opportunities] Exception fetching active accounts:', error)
    return []
  }
}

/**
 * Procesa oportunidades para una cuenta
 */
async function processOpportunitiesForAccount(accountId: string): Promise<void> {
  console.log(`[Cron Opportunities] Processing opportunities for account ${accountId}...`)
  
  // 1. Recalcular oportunidades de intro
  try {
    console.log(`[Cron Opportunities] Recalculating intro opportunities for account ${accountId}...`)
    await recalculateIntroOpportunitiesForAccount(accountId)
    console.log(`[Cron Opportunities] ✓ Intro opportunities recalculated for account ${accountId}`)
  } catch (error) {
    console.error(`[Cron Opportunities] ✗ Error recalculating intro opportunities for account ${accountId}:`, error)
    // Continuar con los siguientes pasos
  }
  
  // 2. Generar oportunidades de outbound
  try {
    console.log(`[Cron Opportunities] Generating outbound opportunities for account ${accountId}...`)
    await autoGenerateOutboundForAccount(accountId)
    console.log(`[Cron Opportunities] ✓ Outbound opportunities generated for account ${accountId}`)
  } catch (error) {
    console.error(`[Cron Opportunities] ✗ Error generating outbound opportunities for account ${accountId}:`, error)
    // Continuar con el siguiente paso
  }
  
  // 3. Calcular scores para todas las oportunidades
  try {
    console.log(`[Cron Opportunities] Scoring opportunities for account ${accountId}...`)
    await scoreAllOpportunitiesForAccount(accountId)
    console.log(`[Cron Opportunities] ✓ Opportunities scored for account ${accountId}`)
  } catch (error) {
    console.error(`[Cron Opportunities] ✗ Error scoring opportunities for account ${accountId}:`, error)
    // No re-lanzar, ya se logueó
  }
}

// ============================================================================
// HANDLER
// ============================================================================

export async function GET(req: Request): Promise<Response> {
  const startTime = Date.now()
  console.log('[Cron Opportunities] Starting opportunities cronjob...')
  
  // Validar token de autorización si CRON_SECRET está configurado
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }
  
  try {
    // 1. Obtener cuentas activas
    const accounts = await getActiveAccounts()
    
    if (accounts.length === 0) {
      console.log('[Cron Opportunities] No active accounts found')
      return NextResponse.json({
        success: true,
        message: 'No active accounts to process',
        processed: 0,
        errors: 0
      })
    }
    
    console.log(`[Cron Opportunities] Found ${accounts.length} active accounts`)
    
    // 2. Procesar cada cuenta
    let processed = 0
    let errors = 0
    
    for (const account of accounts) {
      try {
        console.log(`[Cron Opportunities] Processing account ${account.id} (${account.name || 'unnamed'})...`)
        
        await processOpportunitiesForAccount(account.id)
        
        processed++
        console.log(`[Cron Opportunities] ✓ Account ${account.id} processed successfully`)
      } catch (error) {
        errors++
        console.error(`[Cron Opportunities] ✗ Error processing account ${account.id}:`, error)
        // Continuar con la siguiente cuenta
      }
    }
    
    const duration = Date.now() - startTime
    
    console.log(
      `[Cron Opportunities] Completed: ${processed} processed, ${errors} errors, ${duration}ms`
    )
    
    return NextResponse.json({
      success: true,
      processed,
      errors,
      duration_ms: duration
    })
  } catch (error) {
    console.error('[Cron Opportunities] Fatal error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
