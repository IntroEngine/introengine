import { NextResponse } from 'next/server'
import { generateFollowups, Opportunity, FollowupResult } from '@/lib/followup-generator'

/**
 * POST /api/generate-followups
 * 
 * Genera mensajes de follow-up suaves, educados y efectivos.
 * 
 * Body esperado:
 * {
 *   opportunity_json: Opportunity,
 *   days_waiting: number
 * }
 * 
 * Retorna:
 * {
 *   followups: {
 *     bridge_contact: string,
 *     prospect: string,
 *     outbound: string
 *   }
 * }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    // Extraer datos del body
    const { opportunity_json, days_waiting } = body
    
    // Validar que los datos requeridos estén presentes
    if (!opportunity_json) {
      return NextResponse.json(
        { error: 'opportunity_json es requerido' },
        { status: 400 }
      )
    }
    
    // Validar días de espera
    const daysWaiting = days_waiting !== undefined ? Number(days_waiting) : 0
    if (isNaN(daysWaiting) || daysWaiting < 0) {
      return NextResponse.json(
        { error: 'days_waiting debe ser un número positivo' },
        { status: 400 }
      )
    }
    
    // Validar y normalizar oportunidad
    const opportunity: Opportunity = {
      id: opportunity_json.id || null,
      company_id: opportunity_json.company_id || null,
      company_name: opportunity_json.company_name || null,
      target_contact_id: opportunity_json.target_contact_id || null,
      target_contact_name: opportunity_json.target_contact_name || null,
      target_contact_role: opportunity_json.target_contact_role || null,
      bridge_contact_id: opportunity_json.bridge_contact_id || null,
      bridge_contact_name: opportunity_json.bridge_contact_name || null,
      bridge_contact_role: opportunity_json.bridge_contact_role || null,
      type: opportunity_json.type || null,
      status: opportunity_json.status || null,
      last_interaction: opportunity_json.last_interaction || null,
      has_intro_request: opportunity_json.has_intro_request || null,
      has_previous_conversation: opportunity_json.has_previous_conversation || null,
      is_cold_outbound: opportunity_json.is_cold_outbound || null
    }
    
    // Generar follow-ups
    const result: FollowupResult = generateFollowups(opportunity, daysWaiting)
    
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
    console.error('Error inesperado en /api/generate-followups:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor al generar follow-ups' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/generate-followups
 * 
 * Endpoint informativo sobre el uso del generador de follow-ups
 */
export async function GET() {
  return NextResponse.json({
    message: 'Motor de follow-ups de IntroEngine',
    usage: {
      method: 'POST',
      endpoint: '/api/generate-followups',
      body: {
        opportunity_json: 'Objeto Opportunity con información de la oportunidad',
        days_waiting: 'Número de días sin respuesta (0 o más)'
      },
      response: {
        followups: {
          bridge_contact: 'Mensaje para contacto puente (pediste intro y no respondieron)',
          prospect: 'Mensaje para decisor objetivo (ya hablaste pero quedó congelado)',
          outbound: 'Mensaje para prospecto frío (no respondieron a outbound inicial)'
        }
      }
    },
    followup_types: {
      bridge_contact: {
        description: 'Follow-up para contacto puente cuando pediste una introducción y no respondieron',
        tone: 'Amable, recordatorio suave, ofrece facilitar el proceso'
      },
      prospect: {
        description: 'Follow-up para prospecto con quien ya tuviste una conversación pero quedó congelado',
        tone: 'Respetuoso, re-engagement suave, ofrece valor adicional'
      },
      outbound: {
        description: 'Follow-up para prospecto frío que no respondió a un outbound inicial',
        tone: 'No invasivo, ofrece valor, da opción de no seguir'
      }
    },
    tone_guidelines: {
      directo_but_amable: 'Mensajes directos pero con tono amable y respetuoso',
      corto: 'Mensajes concisos, sin extenderse demasiado',
      no_desesperado: 'Evita sonar desesperado o insistente',
      sugerir_valor: 'Siempre sugiere valor o beneficio para el prospecto'
    },
    timing_considerations: {
      '0-3 días': 'Tono suave, recordatorio breve',
      '4-7 días': 'Tono amigable, ofrece facilitar el proceso',
      '8-14 días': 'Tono respetuoso, reconoce que están ocupados',
      '15-30 días': 'Re-engagement suave, nuevo ángulo o valor',
      '30+ días': 'Último intento muy suave, da opción de no seguir'
    }
  }, { status: 200 })
}
