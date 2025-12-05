import { NextResponse } from 'next/server'
import { getAccountId } from '@/lib/auth'
import { getRecentActivities } from '@/services/activityLogger'

// GET /api/activity-logs?limit=50&action_type=intro_requested&opportunity_id=xxx
export async function GET(req: Request) {
  try {
    const accountId = await getAccountId()
    if (!accountId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50
    const actionType = searchParams.get('action_type')
    const opportunityId = searchParams.get('opportunity_id')
    const userId = searchParams.get('user_id')

    const actionTypes = actionType ? [actionType as any] : undefined

    const activities = await getRecentActivities(accountId, {
      limit,
      actionTypes,
      opportunityId: opportunityId || undefined,
      userId: userId || undefined
    })

    return NextResponse.json({
      success: true,
      activities,
      count: activities.length
    })
  } catch (error) {
    console.error('[API Activity Logs] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
