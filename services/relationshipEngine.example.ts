/**
 * Ejemplos de uso del Relationship Engine
 * 
 * Este archivo muestra cómo usar las funciones públicas del Relationship Engine
 */

import {
  findIntroOpportunitiesForCompany,
  findIntroOpportunitiesForCompanies,
  recalculateIntroOpportunitiesForAccount
} from './relationshipEngine'

/**
 * Ejemplo 1: Encontrar oportunidades para una empresa específica
 */
export async function example1() {
  const accountId = '00000000-0000-0000-0000-000000000000'
  const companyId = 'company-123'
  
  try {
    await findIntroOpportunitiesForCompany(accountId, companyId)
    console.log('Oportunidades generadas exitosamente')
  } catch (error) {
    console.error('Error generando oportunidades:', error)
  }
}

/**
 * Ejemplo 2: Procesar múltiples empresas en batch
 */
export async function example2() {
  const accountId = '00000000-0000-0000-0000-000000000000'
  const companyIds = [
    'company-123',
    'company-456',
    'company-789'
  ]
  
  try {
    const result = await findIntroOpportunitiesForCompanies(accountId, companyIds)
    console.log(`Procesadas ${result.processed} empresas, ${result.errors} errores`)
  } catch (error) {
    console.error('Error procesando empresas:', error)
  }
}

/**
 * Ejemplo 3: Recalcular todas las oportunidades de una cuenta
 */
export async function example3() {
  const accountId = '00000000-0000-0000-0000-000000000000'
  
  try {
    const result = await recalculateIntroOpportunitiesForAccount(accountId)
    console.log(`Recálculo completo: ${result.processed} empresas procesadas, ${result.errors} errores`)
  } catch (error) {
    console.error('Error recalculando oportunidades:', error)
  }
}

/**
 * Ejemplo 4: Uso desde una API route de Next.js
 * 
 * POST /api/opportunities/recalculate
 */
export async function example4() {
  // Este sería el código en una API route
  /*
  import { recalculateIntroOpportunitiesForAccount } from '@/services/relationshipEngine'
  
  export async function POST(req: Request) {
    const { accountId } = await req.json()
    
    try {
      const result = await recalculateIntroOpportunitiesForAccount(accountId)
      return NextResponse.json({
        success: true,
        processed: result.processed,
        errors: result.errors
      })
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to recalculate opportunities' },
        { status: 500 }
      )
    }
  }
  */
}
