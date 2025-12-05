import { NextResponse } from 'next/server'
import { createClient } from '@/config/supabase'

// TODO: Obtener account_id desde el token de autenticación en lugar de hardcodearlo
// Para MVP, usar un account_id fijo (mismo que en otros endpoints)
const ACCOUNT_ID = '00000000-0000-0000-0000-000000000000' // TODO: Reemplazar con account_id real desde auth

// Tipo esperado para el payload de followup_suggested
type FollowupPayload = {
  followup_type?: 'bridge' | 'prospect' | 'outbound'
  company_name?: string
  contact_name?: string
  contact_role?: string | null
  days_without_activity?: number
  suggested_message?: string
}

// Tipo para la respuesta de Action
type ActionDTO = {
  id: string
  opportunity_id: string | null
  followup_type: string | null
  company_name: string | null
  contact_name: string | null
  contact_role: string | null
  days_without_activity: number | null
  suggested_message: string | null
  created_at: string
}

// Helper para crear cliente de Supabase
function getSupabaseClient() {
  return createClient()
}

// Helper para parsear payload de forma robusta
function parseFollowupPayload(payload: any): FollowupPayload {
  if (!payload || typeof payload !== 'object') {
    return {}
  }

  return {
    followup_type: payload.followup_type || null,
    company_name: payload.company_name || null,
    contact_name: payload.contact_name || null,
    contact_role: payload.contact_role || null,
    days_without_activity:
      typeof payload.days_without_activity === 'number'
        ? payload.days_without_activity
        : null,
    suggested_message: payload.suggested_message || null,
  }
}

// GET /api/actions
export async function GET(req: Request) {
  try {
    const supabase = getSupabaseClient()

    // Consultar activity_logs con action_type = 'followup_suggested'
    const { data: activityLogs, error } = await supabase
      .from('activity_logs')
      .select('id, opportunity_id, payload, created_at')
      .eq('account_id', ACCOUNT_ID)
      .eq('action_type', 'followup_suggested')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching actions from Supabase:', error)
      return NextResponse.json(
        { error: 'Failed to fetch actions' },
        { status: 500 }
      )
    }

    if (!activityLogs || activityLogs.length === 0) {
      return NextResponse.json({ actions: [] }, { status: 200 })
    }

    // Mapear activity_logs a ActionDTO parseando el payload de forma robusta
    const actions: ActionDTO[] = activityLogs.map((log) => {
      const payload = parseFollowupPayload(log.payload)

      return {
        id: log.id,
        opportunity_id: log.opportunity_id,
        followup_type: payload.followup_type || null,
        company_name: payload.company_name || null,
        contact_name: payload.contact_name || null,
        contact_role: payload.contact_role || null,
        days_without_activity: payload.days_without_activity || null,
        suggested_message: payload.suggested_message || null,
        created_at: log.created_at,
      }
    })

    return NextResponse.json({ actions }, { status: 200 })
  } catch (error) {
    console.error('Unexpected error in GET /api/actions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch actions' },
      { status: 500 }
    )
  }
}

