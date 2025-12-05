import { NextResponse } from 'next/server'
import { createClient } from '@/config/supabase'

// TODO: Importar weeklyAdvisorEngine cuando esté disponible
// import { weeklyAdvisorEngine } from '@/services/weeklyAdvisorEngine'

// TODO: Obtener account_id desde el token de autenticación en lugar de hardcodearlo
// Para MVP, usar un account_id fijo (mismo que en otros endpoints)
const ACCOUNT_ID = '00000000-0000-0000-0000-000000000000' // TODO: Reemplazar con account_id real desde auth

// Interfaces para WeeklyAdvisorResult
interface WeeklyRawMetrics {
  intros_generated: number
  intros_requested: number
  intro_responses: number
  outbound_suggested: number
  outbound_executed: number
  wins: number
  losses: number
}

interface WeeklyAdvisorAISummary {
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

interface WeeklyAdvisorResult {
  accountId: string
  startDate: string
  endDate: string
  rawMetrics: WeeklyRawMetrics
  aiSummary: WeeklyAdvisorAISummary
  createdAt: string
}

// Helper para crear cliente de Supabase
function getSupabaseClient() {
  return createClient()
}

// Helper para parsear payload de forma robusta
function parseWeeklySummaryPayload(payload: any): WeeklyAdvisorResult | null {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  try {
    return {
      accountId: payload.accountId || '',
      startDate: payload.startDate || '',
      endDate: payload.endDate || '',
      rawMetrics: {
        intros_generated: payload.rawMetrics?.intros_generated || 0,
        intros_requested: payload.rawMetrics?.intros_requested || 0,
        intro_responses: payload.rawMetrics?.intro_responses || 0,
        outbound_suggested: payload.rawMetrics?.outbound_suggested || 0,
        outbound_executed: payload.rawMetrics?.outbound_executed || 0,
        wins: payload.rawMetrics?.wins || 0,
        losses: payload.rawMetrics?.losses || 0,
      },
      aiSummary: {
        summary: {
          intros_generated: payload.aiSummary?.summary?.intros_generated || '',
          intros_requested: payload.aiSummary?.summary?.intros_requested || '',
          responses: payload.aiSummary?.summary?.responses || '',
          outbound_pending: payload.aiSummary?.summary?.outbound_pending || '',
          wins: payload.aiSummary?.summary?.wins || '',
          losses: payload.aiSummary?.summary?.losses || '',
        },
        insights: Array.isArray(payload.aiSummary?.insights)
          ? payload.aiSummary.insights
          : [],
        recommended_actions: Array.isArray(payload.aiSummary?.recommended_actions)
          ? payload.aiSummary.recommended_actions
          : [],
      },
      createdAt: payload.createdAt || '',
    }
  } catch (error) {
    console.error('Error parsing weekly summary payload:', error)
    return null
  }
}

// GET /api/weekly-summary
export async function GET(req: Request) {
  try {
    const supabase = getSupabaseClient()

    // Consultar el último resumen semanal generado
    const { data: activityLogs, error } = await supabase
      .from('activity_logs')
      .select('id, payload, created_at')
      .eq('account_id', ACCOUNT_ID)
      .eq('action_type', 'weekly_summary_generated')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      // Si no hay registros, devolver 404
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'No weekly summary found' },
          { status: 404 }
        )
      }

      console.error('Error fetching weekly summary from Supabase:', error)
      return NextResponse.json(
        { error: 'Failed to fetch weekly summary' },
        { status: 500 }
      )
    }

    if (!activityLogs) {
      return NextResponse.json(
        { error: 'No weekly summary found' },
        { status: 404 }
      )
    }

    // Parsear el payload
    const weeklySummary = parseWeeklySummaryPayload(activityLogs.payload)

    if (!weeklySummary) {
      return NextResponse.json(
        { error: 'Invalid weekly summary data' },
        { status: 500 }
      )
    }

    return NextResponse.json({ weeklySummary }, { status: 200 })
  } catch (error) {
    console.error('Unexpected error in GET /api/weekly-summary:', error)
    return NextResponse.json(
      { error: 'Failed to fetch weekly summary' },
      { status: 500 }
    )
  }
}

// POST /api/weekly-summary
export async function POST(req: Request) {
  try {
    const supabase = getSupabaseClient()

    // TODO: Importar y usar weeklyAdvisorEngine cuando esté disponible
    // await weeklyAdvisorEngine.generateWeeklySummaryAndStore(ACCOUNT_ID)

    // Por ahora, simular la generación o lanzar error si no está implementado
    try {
      // Intentar importar dinámicamente (fallará si no existe, pero no romperá el build)
      const { weeklyAdvisorEngine } = await import('@/services/weeklyAdvisorEngine')
      await weeklyAdvisorEngine.generateWeeklySummaryAndStore(ACCOUNT_ID)
    } catch (importError) {
      // Si el servicio no existe, devolver error informativo
      console.warn('weeklyAdvisorEngine service not available:', importError)
      return NextResponse.json(
        {
          error: 'Weekly advisor engine service not implemented',
          message: 'TODO: Implement @/services/weeklyAdvisorEngine',
        },
        { status: 501 } // 501 Not Implemented
      )
    }

    // Después de generar, obtener el último resumen para devolverlo
    const { data: activityLogs, error: fetchError } = await supabase
      .from('activity_logs')
      .select('id, payload, created_at')
      .eq('account_id', ACCOUNT_ID)
      .eq('action_type', 'weekly_summary_generated')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (fetchError || !activityLogs) {
      // Si no se puede obtener el resumen recién generado, devolver éxito pero sin datos
      return NextResponse.json(
        {
          message: 'Weekly summary generation triggered successfully',
          note: 'Summary may still be processing',
        },
        { status: 202 } // 202 Accepted
      )
    }

    const weeklySummary = parseWeeklySummaryPayload(activityLogs.payload)

    if (!weeklySummary) {
      return NextResponse.json(
        {
          message: 'Weekly summary generation triggered successfully',
          note: 'Summary generated but data format may be invalid',
        },
        { status: 202 }
      )
    }

    return NextResponse.json(
      {
        message: 'Weekly summary generated successfully',
        weeklySummary,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Unexpected error in POST /api/weekly-summary:', error)
    return NextResponse.json(
      { error: 'Failed to generate weekly summary' },
      { status: 500 }
    )
  }
}

