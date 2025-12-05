/**
 * Cronjob: HubSpot Sync
 * 
 * Sincroniza oportunidades pendientes con HubSpot para todas las cuentas activas.
 * 
 * Schedule sugerido: Cada hora (ej: 0 * * * *)
 * 
 * Para configurar en Vercel:
 * - Agregar en vercel.json o configuración de cron:
 *   {
 *     "crons": [{
 *       "path": "/api/cron/hubspot-sync",
 *       "schedule": "0 * * * *"
 *     }]
 *   }
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/config/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'
import { syncAllPendingOpportunitiesToHubSpot } from '@/services/hubspotService'

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
      console.error('[Cron HubSpot Sync] Error fetching active accounts:', error)
      return []
    }
    
    return accounts || []
  } catch (error) {
    console.error('[Cron HubSpot Sync] Exception fetching active accounts:', error)
    return []
  }
}

// ============================================================================
// HANDLER
// ============================================================================

export async function GET(req: Request): Promise<Response> {
  const startTime = Date.now()
  console.log('[Cron HubSpot Sync] Starting HubSpot sync cronjob...')
  
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
      console.log('[Cron HubSpot Sync] No active accounts found')
      return NextResponse.json({
        success: true,
        message: 'No active accounts to process',
        processed: 0,
        errors: 0,
        total_opportunities_synced: 0
      })
    }
    
    console.log(`[Cron HubSpot Sync] Found ${accounts.length} active accounts`)
    
    // 2. Procesar cada cuenta
    let processed = 0
    let errors = 0
    let totalOpportunitiesSynced = 0
    
    for (const account of accounts) {
      try {
        console.log(`[Cron HubSpot Sync] Syncing opportunities for account ${account.id} (${account.name || 'unnamed'})...`)
        
        const result = await syncAllPendingOpportunitiesToHubSpot(account.id)
        
        totalOpportunitiesSynced += result.processed
        
        processed++
        console.log(
          `[Cron HubSpot Sync] ✓ Account ${account.id}: ${result.processed} opportunities synced, ${result.errors} errors`
        )
      } catch (error) {
        errors++
        console.error(`[Cron HubSpot Sync] ✗ Error syncing account ${account.id}:`, error)
        // Continuar con la siguiente cuenta
      }
    }
    
    const duration = Date.now() - startTime
    
    console.log(
      `[Cron HubSpot Sync] Completed: ${processed} accounts processed, ${errors} errors, ` +
      `${totalOpportunitiesSynced} opportunities synced, ${duration}ms`
    )
    
    return NextResponse.json({
      success: true,
      processed,
      errors,
      total_opportunities_synced: totalOpportunitiesSynced,
      duration_ms: duration
    })
  } catch (error) {
    console.error('[Cron HubSpot Sync] Fatal error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
