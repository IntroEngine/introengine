/**
 * Cronjob: Weekly Advisor
 * 
 * Genera el resumen semanal para todas las cuentas activas.
 * 
 * Schedule sugerido: 1 vez a la semana (ej: Lunes 9:00 AM UTC - "0 9 * * 1")
 * 
 * Para configurar en Vercel:
 * - Agregar en vercel.json o configuración de cron:
 *   {
 *     "crons": [{
 *       "path": "/api/cron/weekly-advisor",
 *       "schedule": "0 9 * * 1"
 *     }]
 *   }
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/config/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'
import { generateWeeklySummaryAndStore } from '@/services/weeklyAdvisorEngine'

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
      console.error('[Cron Weekly Advisor] Error fetching active accounts:', error)
      return []
    }
    
    return accounts || []
  } catch (error) {
    console.error('[Cron Weekly Advisor] Exception fetching active accounts:', error)
    return []
  }
}

// ============================================================================
// HANDLER
// ============================================================================

export async function GET(req: Request): Promise<Response> {
  const startTime = Date.now()
  console.log('[Cron Weekly Advisor] Starting weekly advisor cronjob...')
  
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
      console.log('[Cron Weekly Advisor] No active accounts found')
      return NextResponse.json({
        success: true,
        message: 'No active accounts to process',
        processed: 0,
        errors: 0
      })
    }
    
    console.log(`[Cron Weekly Advisor] Found ${accounts.length} active accounts`)
    
    // 2. Procesar cada cuenta
    let processed = 0
    let errors = 0
    
    for (const account of accounts) {
      try {
        console.log(`[Cron Weekly Advisor] Generating weekly summary for account ${account.id} (${account.name || 'unnamed'})...`)
        
        await generateWeeklySummaryAndStore(account.id)
        
        processed++
        console.log(`[Cron Weekly Advisor] ✓ Weekly summary generated for account ${account.id}`)
      } catch (error) {
        errors++
        console.error(`[Cron Weekly Advisor] ✗ Error generating weekly summary for account ${account.id}:`, error)
        // Continuar con la siguiente cuenta
      }
    }
    
    const duration = Date.now() - startTime
    
    console.log(
      `[Cron Weekly Advisor] Completed: ${processed} processed, ${errors} errors, ${duration}ms`
    )
    
    return NextResponse.json({
      success: true,
      processed,
      errors,
      duration_ms: duration
    })
  } catch (error) {
    console.error('[Cron Weekly Advisor] Fatal error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
