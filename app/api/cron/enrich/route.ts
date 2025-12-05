/**
 * Cronjob: Enrich
 * 
 * Enriquecimiento de datos para todas las cuentas activas.
 * 
 * Schedule sugerido: 1 vez al día (ej: 2:00 AM UTC)
 * 
 * Para configurar en Vercel:
 * - Agregar en vercel.json o configuración de cron:
 *   {
 *     "crons": [{
 *       "path": "/api/cron/enrich",
 *       "schedule": "0 2 * * *"
 *     }]
 *   }
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/config/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

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
      console.error('[Cron Enrich] Error fetching active accounts:', error)
      return []
    }
    
    return accounts || []
  } catch (error) {
    console.error('[Cron Enrich] Exception fetching active accounts:', error)
    return []
  }
}

/**
 * Enriquece datos de una cuenta
 * 
 * TODO: Implementar enrichmentService.enrichAccountData(accountId)
 */
async function enrichAccountData(accountId: string): Promise<void> {
  // TODO: Importar y llamar a enrichmentService
  // import { enrichmentService } from '@/services/enrichmentService'
  // await enrichmentService.enrichAccountData(accountId)
  
  // Placeholder: simular trabajo
  console.log(`[Cron Enrich] Enriching data for account ${accountId}...`)
  
  // Simular delay
  await new Promise(resolve => setTimeout(resolve, 100))
  
  console.log(`[Cron Enrich] Enrichment completed for account ${accountId}`)
}

// ============================================================================
// HANDLER
// ============================================================================

export async function GET(req: Request): Promise<Response> {
  const startTime = Date.now()
  console.log('[Cron Enrich] Starting enrichment cronjob...')
  
  // TODO: Validar token de autorización si es necesario
  // const authHeader = req.headers.get('authorization')
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // }
  
  try {
    // 1. Obtener cuentas activas
    const accounts = await getActiveAccounts()
    
    if (accounts.length === 0) {
      console.log('[Cron Enrich] No active accounts found')
      return NextResponse.json({
        success: true,
        message: 'No active accounts to process',
        processed: 0,
        errors: 0
      })
    }
    
    console.log(`[Cron Enrich] Found ${accounts.length} active accounts`)
    
    // 2. Procesar cada cuenta
    let processed = 0
    let errors = 0
    
    for (const account of accounts) {
      try {
        console.log(`[Cron Enrich] Processing account ${account.id} (${account.name || 'unnamed'})...`)
        
        await enrichAccountData(account.id)
        
        processed++
        console.log(`[Cron Enrich] ✓ Account ${account.id} processed successfully`)
      } catch (error) {
        errors++
        console.error(`[Cron Enrich] ✗ Error processing account ${account.id}:`, error)
        // Continuar con la siguiente cuenta
      }
    }
    
    const duration = Date.now() - startTime
    
    console.log(
      `[Cron Enrich] Completed: ${processed} processed, ${errors} errors, ${duration}ms`
    )
    
    return NextResponse.json({
      success: true,
      processed,
      errors,
      duration_ms: duration
    })
  } catch (error) {
    console.error('[Cron Enrich] Fatal error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
