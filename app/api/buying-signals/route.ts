import { NextResponse } from 'next/server'
import { createClient } from '@/config/supabase'
import { getAccountId } from '@/lib/auth'
import { detectSignalsForCompany, getActiveSignalsForCompany } from '@/services/buyingSignalsService'

// GET /api/buying-signals?company_id=xxx
export async function GET(req: Request) {
  try {
    const accountId = await getAccountId()
    if (!accountId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const companyId = searchParams.get('company_id')

    if (!companyId) {
      return NextResponse.json({ error: 'company_id is required' }, { status: 400 })
    }

    const signals = await getActiveSignalsForCompany(accountId, companyId)

    return NextResponse.json({
      success: true,
      signals
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

// POST /api/buying-signals/detect
export async function POST(req: Request) {
  try {
    const accountId = await getAccountId()
    if (!accountId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { company_id } = body

    if (!company_id) {
      return NextResponse.json({ error: 'company_id is required' }, { status: 400 })
    }

    const result = await detectSignalsForCompany(accountId, company_id)

    return NextResponse.json({
      success: true,
      ...result
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
