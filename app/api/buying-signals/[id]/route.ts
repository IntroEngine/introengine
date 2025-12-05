import { NextResponse } from 'next/server'
import { getAccountId } from '@/lib/auth'
import { resolveSignal, dismissSignal } from '@/services/buyingSignalsService'

// PATCH /api/buying-signals/[id] - Resolver o descartar una señal
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const accountId = await getAccountId()
    if (!accountId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { action } = body // 'resolve' o 'dismiss'

    if (!action || !['resolve', 'dismiss'].includes(action)) {
      return NextResponse.json(
        { error: 'action must be "resolve" or "dismiss"' },
        { status: 400 }
      )
    }

    const signalId = params.id
    let success = false

    if (action === 'resolve') {
      success = await resolveSignal(accountId, signalId)
    } else {
      success = await dismissSignal(accountId, signalId)
    }

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update signal' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Signal ${action}d successfully`
    })
  } catch (error) {
    console.error('[API Buying Signals] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
