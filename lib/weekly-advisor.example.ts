/**
 * Ejemplo de uso del Weekly Advisor de IntroEngine
 * 
 * Este archivo muestra cómo usar el advisor para analizar
 * la actividad semanal y generar insights y recomendaciones.
 */

import { analyzeWeeklyActivity, WeeklyActivity } from './weekly-advisor'

// Ejemplo 1: Semana con buena performance
const exampleActivity1: WeeklyActivity = {
  intros_generated: 12,
  intros_requested: 8,
  intro_responses: 5,
  outbound_suggested: 15,
  outbound_executed: 12,
  wins: 2,
  losses: 1,
  opportunities_created: 20,
  industries_performance: [
    {
      industry: 'Retail',
      opportunities: 8,
      responses: 3,
      wins: 2,
      conversion_rate: 66.7
    },
    {
      industry: 'Technology',
      opportunities: 5,
      responses: 2,
      wins: 0,
      conversion_rate: 0
    }
  ]
}

// Ejemplo 2: Semana con baja actividad
const exampleActivity2: WeeklyActivity = {
  intros_generated: 3,
  intros_requested: 2,
  intro_responses: 0,
  outbound_suggested: 10,
  outbound_executed: 3,
  wins: 0,
  losses: 0,
  opportunities_created: 5
}

// Ejemplo 3: Semana con alta tasa de respuesta pero baja conversión
const exampleActivity3: WeeklyActivity = {
  intros_generated: 15,
  intros_requested: 10,
  intro_responses: 7,
  outbound_suggested: 20,
  outbound_executed: 20,
  wins: 1,
  losses: 3,
  opportunities_created: 25,
  industries_performance: [
    {
      industry: 'Servicios',
      opportunities: 12,
      responses: 5,
      wins: 1,
      conversion_rate: 20
    }
  ]
}

// Ejemplos de uso
export function example1() {
  const result = analyzeWeeklyActivity(exampleActivity1)
  
  console.log('=== Ejemplo 1: Semana con buena performance ===')
  console.log('\nSUMMARY:')
  console.log('- Intros generadas:', result.summary.intros_generated)
  console.log('- Intros pedidas:', result.summary.intros_requested)
  console.log('- Respuestas:', result.summary.responses)
  console.log('- Outbound pendiente:', result.summary.outbound_pending)
  console.log('- Wins:', result.summary.wins)
  console.log('- Losses:', result.summary.losses)
  
  console.log('\nINSIGHTS:')
  result.insights.forEach((insight, i) => {
    console.log(`${i + 1}. ${insight}`)
  })
  
  console.log('\nRECOMMENDED ACTIONS:')
  result.recommended_actions.forEach((action, i) => {
    console.log(`${i + 1}. ${action}`)
  })
  
  return result
}

export function example2() {
  const result = analyzeWeeklyActivity(exampleActivity2)
  
  console.log('=== Ejemplo 2: Semana con baja actividad ===')
  console.log('\nSUMMARY:')
  console.log('- Intros generadas:', result.summary.intros_generated)
  console.log('- Intros pedidas:', result.summary.intros_requested)
  console.log('- Respuestas:', result.summary.responses)
  console.log('- Outbound pendiente:', result.summary.outbound_pending)
  console.log('- Wins:', result.summary.wins)
  console.log('- Losses:', result.summary.losses)
  
  console.log('\nINSIGHTS:')
  result.insights.forEach((insight, i) => {
    console.log(`${i + 1}. ${insight}`)
  })
  
  console.log('\nRECOMMENDED ACTIONS:')
  result.recommended_actions.forEach((action, i) => {
    console.log(`${i + 1}. ${action}`)
  })
  
  return result
}

export function example3() {
  const result = analyzeWeeklyActivity(exampleActivity3)
  
  console.log('=== Ejemplo 3: Alta respuesta pero baja conversión ===')
  console.log('\nSUMMARY:')
  console.log('- Intros generadas:', result.summary.intros_generated)
  console.log('- Intros pedidas:', result.summary.intros_requested)
  console.log('- Respuestas:', result.summary.responses)
  console.log('- Outbound pendiente:', result.summary.outbound_pending)
  console.log('- Wins:', result.summary.wins)
  console.log('- Losses:', result.summary.losses)
  
  console.log('\nINSIGHTS:')
  result.insights.forEach((insight, i) => {
    console.log(`${i + 1}. ${insight}`)
  })
  
  console.log('\nRECOMMENDED ACTIONS:')
  result.recommended_actions.forEach((action, i) => {
    console.log(`${i + 1}. ${action}`)
  })
  
  return result
}

/**
 * Ejemplo de llamada a la API
 * 
 * POST /api/weekly-advisor
 * Content-Type: application/json
 * 
 * {
 *   "weekly_activity_json": {
 *     "intros_generated": 12,
 *     "intros_requested": 8,
 *     "intro_responses": 5,
 *     "outbound_suggested": 15,
 *     "outbound_executed": 12,
 *     "wins": 2,
 *     "losses": 1,
 *     "opportunities_created": 20,
 *     "industries_performance": [
 *       {
 *         "industry": "Retail",
 *         "opportunities": 8,
 *         "responses": 3,
 *         "wins": 2,
 *         "conversion_rate": 66.7
 *       }
 *     ]
 *   }
 * }
 */
