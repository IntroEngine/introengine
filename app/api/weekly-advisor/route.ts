import { NextResponse } from 'next/server'
import { analyzeWeeklyActivity, WeeklyActivity, WeeklyAdvisorResult } from '@/lib/weekly-advisor'

/**
 * POST /api/weekly-advisor
 * 
 * Analiza la actividad semanal y genera insights y recomendaciones.
 * 
 * Body esperado:
 * {
 *   weekly_activity_json: WeeklyActivity
 * }
 * 
 * Retorna:
 * {
 *   summary: {
 *     intros_generated: string,
 *     intros_requested: string,
 *     responses: string,
 *     outbound_pending: string,
 *     wins: string,
 *     losses: string
 *   },
 *   insights: string[],
 *   recommended_actions: string[]
 * }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    // Extraer datos del body
    const { weekly_activity_json } = body
    
    // Validar que los datos requeridos estén presentes
    if (!weekly_activity_json) {
      return NextResponse.json(
        { error: 'weekly_activity_json es requerido' },
        { status: 400 }
      )
    }
    
    // Validar y normalizar actividad semanal
    const activity: WeeklyActivity = {
      intros_generated: weekly_activity_json.intros_generated || 0,
      intros_requested: weekly_activity_json.intros_requested || 0,
      intro_responses: weekly_activity_json.intro_responses || 0,
      outbound_suggested: weekly_activity_json.outbound_suggested || 0,
      outbound_executed: weekly_activity_json.outbound_executed || 0,
      wins: weekly_activity_json.wins || 0,
      losses: weekly_activity_json.losses || 0,
      opportunities_created: weekly_activity_json.opportunities_created || 0,
      industries_performance: weekly_activity_json.industries_performance || null,
      response_rate: weekly_activity_json.response_rate || null,
      conversion_rate: weekly_activity_json.conversion_rate || null,
      top_industries: weekly_activity_json.top_industries || null,
      top_signals: weekly_activity_json.top_signals || null
    }
    
    // Analizar actividad y generar resumen
    const result: WeeklyAdvisorResult = analyzeWeeklyActivity(activity)
    
    // Retornar resultado en formato JSON estricto
    return NextResponse.json(result, { status: 200 })
    
  } catch (error) {
    // Manejar errores de validación
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    // Manejar errores de JSON parsing
    if (error instanceof SyntaxError || error instanceof TypeError) {
      return NextResponse.json(
        { error: 'Invalid request body. Se espera JSON válido.' },
        { status: 400 }
      )
    }
    
    // Manejar otros errores
    console.error('Error inesperado en /api/weekly-advisor:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor al analizar actividad semanal' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/weekly-advisor
 * 
 * Endpoint informativo sobre el uso del Weekly Advisor
 */
export async function GET() {
  return NextResponse.json({
    message: 'Weekly Advisor de IntroEngine - Jefe de ventas inteligente',
    usage: {
      method: 'POST',
      endpoint: '/api/weekly-advisor',
      body: {
        weekly_activity_json: {
          intros_generated: 'Número de intros generadas esta semana',
          intros_requested: 'Número de intros pedidas a contactos puente',
          intro_responses: 'Número de respuestas recibidas',
          outbound_suggested: 'Número de mensajes outbound sugeridos',
          outbound_executed: 'Número de mensajes outbound ejecutados',
          wins: 'Número de victorias/conversiones',
          losses: 'Número de pérdidas',
          opportunities_created: 'Número total de oportunidades creadas',
          industries_performance: 'Array de performance por industria (opcional)',
          response_rate: 'Tasa de respuesta (opcional, se calcula si no se proporciona)',
          conversion_rate: 'Tasa de conversión (opcional, se calcula si no se proporciona)',
          top_industries: 'Array de industrias top (opcional)',
          top_signals: 'Array de señales top (opcional)'
        }
      },
      response: {
        summary: {
          intros_generated: 'Resumen de intros generadas en formato legible',
          intros_requested: 'Resumen de intros pedidas en formato legible',
          responses: 'Resumen de respuestas con tasa de respuesta',
          outbound_pending: 'Resumen de outbound pendiente',
          wins: 'Resumen de victorias',
          losses: 'Resumen de pérdidas'
        },
        insights: 'Array de 3 insights inteligentes basados en los datos',
        recommended_actions: 'Array de 3 acciones recomendadas para mejorar'
      }
    },
    analysis_focus: {
      volume: 'Analiza el volumen de actividad (intros generadas, pedidas)',
      response_rates: 'Evalúa tasas de respuesta y engagement',
      conversion: 'Analiza conversión de respuestas a victorias',
      execution: 'Evalúa ejecución de outbound sugerido',
      industry_performance: 'Identifica industrias que mejor funcionan',
      balance: 'Analiza balance entre wins y losses'
    },
    insights_types: {
      performance: 'Insights sobre performance general y volumen',
      response_quality: 'Insights sobre calidad de relaciones y respuestas',
      execution: 'Insights sobre ejecución de actividades',
      conversion: 'Insights sobre tasas de conversión',
      industry_focus: 'Insights sobre performance por industria',
      balance: 'Insights sobre balance wins/losses'
    },
    action_types: {
      volume: 'Acciones para aumentar volumen de actividad',
      quality: 'Acciones para mejorar calidad de interacciones',
      execution: 'Acciones para mejorar ejecución',
      follow_up: 'Acciones para mejorar seguimiento y cierre',
      focus: 'Acciones para enfocar esfuerzos en áreas de mejor performance'
    }
  }, { status: 200 })
}
