/**
 * Activity Logger de IntroEngine
 * 
 * Servicio centralizado para registrar todas las actividades del sistema y usuarios
 * en la tabla activity_logs.
 * 
 * Tipos de acciones soportados:
 * - intro_requested: Usuario solicitó una intro
 * - message_sent: Se envió un mensaje
 * - status_changed: Cambió el estado de una oportunidad/empresa/contacto
 * - company_added: Se agregó una empresa
 * - contact_added: Se agregó un contacto
 * - relationship_added: Se agregó una relación
 * - opportunity_created: Se creó una oportunidad
 * - opportunity_accepted: Se aceptó una oportunidad
 * - opportunity_rejected: Se rechazó una oportunidad
 * - hubspot_synced: Sincronización con HubSpot
 * - enrichment_completed: Enriquecimiento completado
 * - weekly_summary_generated: Resumen semanal generado
 * - settings_updated: Configuración actualizada
 * - system_automated: Acción automatizada del sistema
 * - buying_signal_detected: Señal de compra detectada
 * - followup_suggested: Follow-up sugerido
 */

import { createClient } from '@/config/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export type ActionType =
  | 'intro_requested'
  | 'message_sent'
  | 'status_changed'
  | 'company_added'
  | 'contact_added'
  | 'relationship_added'
  | 'opportunity_created'
  | 'opportunity_accepted'
  | 'opportunity_rejected'
  | 'hubspot_synced'
  | 'enrichment_completed'
  | 'weekly_summary_generated'
  | 'settings_updated'
  | 'system_automated'
  | 'buying_signal_detected'
  | 'followup_suggested'

export interface ActivityLogPayload {
  [key: string]: any
  // Campos comunes
  entity_type?: string
  entity_id?: string
  old_value?: any
  new_value?: any
  message?: string
  metadata?: Record<string, any>
}

export interface LogActivityOptions {
  accountId: string
  userId?: string
  opportunityId?: string
  actionType: ActionType
  payload?: ActivityLogPayload
}

// ============================================================================
// HELPERS
// ============================================================================

function getSupabaseClient(): SupabaseClient {
  return createClient()
}

// ============================================================================
// FUNCIONES PÚBLICAS
// ============================================================================

/**
 * Registra una actividad en el log
 */
export async function logActivity(
  options: LogActivityOptions
): Promise<boolean> {
  try {
    const supabase = getSupabaseClient()
    
    const { error } = await supabase
      .from('activity_logs')
      .insert({
        account_id: options.accountId,
        user_id: options.userId || null,
        opportunity_id: options.opportunityId || null,
        action_type: options.actionType,
        payload: options.payload || {}
      })
    
    if (error) {
      console.error(`[Activity Logger] Error logging activity:`, error)
      return false
    }
    
    return true
  } catch (error) {
    console.error(`[Activity Logger] Exception logging activity:`, error)
    return false
  }
}

/**
 * Registra que se solicitó una intro
 */
export async function logIntroRequested(
  accountId: string,
  opportunityId: string,
  userId?: string,
  metadata?: Record<string, any>
): Promise<boolean> {
  return logActivity({
    accountId,
    userId,
    opportunityId,
    actionType: 'intro_requested',
    payload: {
      entity_type: 'opportunity',
      entity_id: opportunityId,
      metadata
    }
  })
}

/**
 * Registra que se envió un mensaje
 */
export async function logMessageSent(
  accountId: string,
  opportunityId: string,
  messageType: 'intro' | 'outbound' | 'followup',
  userId?: string,
  metadata?: Record<string, any>
): Promise<boolean> {
  return logActivity({
    accountId,
    userId,
    opportunityId,
    actionType: 'message_sent',
    payload: {
      entity_type: 'opportunity',
      entity_id: opportunityId,
      message_type: messageType,
      metadata
    }
  })
}

/**
 * Registra un cambio de estado
 */
export async function logStatusChanged(
  accountId: string,
  entityType: 'company' | 'contact' | 'opportunity',
  entityId: string,
  oldStatus: string,
  newStatus: string,
  userId?: string,
  metadata?: Record<string, any>
): Promise<boolean> {
  return logActivity({
    accountId,
    userId,
    opportunityId: entityType === 'opportunity' ? entityId : undefined,
    actionType: 'status_changed',
    payload: {
      entity_type: entityType,
      entity_id: entityId,
      old_value: oldStatus,
      new_value: newStatus,
      metadata
    }
  })
}

/**
 * Registra que se agregó una empresa
 */
export async function logCompanyAdded(
  accountId: string,
  companyId: string,
  userId?: string,
  metadata?: Record<string, any>
): Promise<boolean> {
  return logActivity({
    accountId,
    userId,
    actionType: 'company_added',
    payload: {
      entity_type: 'company',
      entity_id: companyId,
      metadata
    }
  })
}

/**
 * Registra que se agregó un contacto
 */
export async function logContactAdded(
  accountId: string,
  contactId: string,
  userId?: string,
  metadata?: Record<string, any>
): Promise<boolean> {
  return logActivity({
    accountId,
    userId,
    actionType: 'contact_added',
    payload: {
      entity_type: 'contact',
      entity_id: contactId,
      metadata
    }
  })
}

/**
 * Registra que se agregó una relación
 */
export async function logRelationshipAdded(
  accountId: string,
  relationshipId: string,
  contactId1: string,
  contactId2: string,
  userId?: string,
  metadata?: Record<string, any>
): Promise<boolean> {
  return logActivity({
    accountId,
    userId,
    actionType: 'relationship_added',
    payload: {
      entity_type: 'relationship',
      entity_id: relationshipId,
      contact_id_1: contactId1,
      contact_id_2: contactId2,
      metadata
    }
  })
}

/**
 * Registra que se creó una oportunidad
 */
export async function logOpportunityCreated(
  accountId: string,
  opportunityId: string,
  opportunityType: 'intro' | 'outbound',
  companyId: string,
  targetContactId: string,
  bridgeContactId?: string,
  metadata?: Record<string, any>
): Promise<boolean> {
  return logActivity({
    accountId,
    opportunityId,
    actionType: 'opportunity_created',
    payload: {
      entity_type: 'opportunity',
      entity_id: opportunityId,
      opportunity_type: opportunityType,
      company_id: companyId,
      target_contact_id: targetContactId,
      bridge_contact_id: bridgeContactId,
      metadata
    }
  })
}

/**
 * Registra que se aceptó una oportunidad
 */
export async function logOpportunityAccepted(
  accountId: string,
  opportunityId: string,
  userId?: string,
  metadata?: Record<string, any>
): Promise<boolean> {
  return logActivity({
    accountId,
    userId,
    opportunityId,
    actionType: 'opportunity_accepted',
    payload: {
      entity_type: 'opportunity',
      entity_id: opportunityId,
      metadata
    }
  })
}

/**
 * Registra que se rechazó una oportunidad
 */
export async function logOpportunityRejected(
  accountId: string,
  opportunityId: string,
  userId?: string,
  reason?: string,
  metadata?: Record<string, any>
): Promise<boolean> {
  return logActivity({
    accountId,
    userId,
    opportunityId,
    actionType: 'opportunity_rejected',
    payload: {
      entity_type: 'opportunity',
      entity_id: opportunityId,
      reason,
      metadata
    }
  })
}

/**
 * Registra sincronización con HubSpot
 */
export async function logHubspotSynced(
  accountId: string,
  entityType: 'company' | 'contact' | 'opportunity',
  entityId: string,
  hubspotId: string,
  syncType: 'created' | 'updated',
  metadata?: Record<string, any>
): Promise<boolean> {
  return logActivity({
    accountId,
    opportunityId: entityType === 'opportunity' ? entityId : undefined,
    actionType: 'hubspot_synced',
    payload: {
      entity_type: entityType,
      entity_id: entityId,
      hubspot_id: hubspotId,
      sync_type: syncType,
      metadata
    }
  })
}

/**
 * Registra que se completó un enriquecimiento
 */
export async function logEnrichmentCompleted(
  accountId: string,
  entityType: 'company' | 'contact',
  entityId: string,
  provider: 'clearbit' | 'apollo' | 'manual',
  success: boolean,
  metadata?: Record<string, any>
): Promise<boolean> {
  return logActivity({
    accountId,
    actionType: 'enrichment_completed',
    payload: {
      entity_type: entityType,
      entity_id: entityId,
      provider,
      success,
      metadata
    }
  })
}

/**
 * Registra que se generó un resumen semanal
 */
export async function logWeeklySummaryGenerated(
  accountId: string,
  summaryId?: string,
  metadata?: Record<string, any>
): Promise<boolean> {
  return logActivity({
    accountId,
    actionType: 'weekly_summary_generated',
    payload: {
      entity_type: 'summary',
      entity_id: summaryId,
      metadata
    }
  })
}

/**
 * Registra que se actualizó la configuración
 */
export async function logSettingsUpdated(
  accountId: string,
  userId: string,
  changedFields: string[],
  metadata?: Record<string, any>
): Promise<boolean> {
  return logActivity({
    accountId,
    userId,
    actionType: 'settings_updated',
    payload: {
      entity_type: 'settings',
      changed_fields: changedFields,
      metadata
    }
  })
}

/**
 * Registra una acción automatizada del sistema
 */
export async function logSystemAutomated(
  accountId: string,
  action: string,
  metadata?: Record<string, any>
): Promise<boolean> {
  return logActivity({
    accountId,
    actionType: 'system_automated',
    payload: {
      action,
      metadata
    }
  })
}

/**
 * Registra que se detectó una señal de compra
 */
export async function logBuyingSignalDetected(
  accountId: string,
  companyId: string,
  signalType: string,
  confidence: number,
  metadata?: Record<string, any>
): Promise<boolean> {
  return logActivity({
    accountId,
    actionType: 'buying_signal_detected',
    payload: {
      entity_type: 'company',
      entity_id: companyId,
      signal_type: signalType,
      confidence,
      metadata
    }
  })
}

/**
 * Registra que se sugirió un follow-up
 */
export async function logFollowupSuggested(
  accountId: string,
  opportunityId: string,
  followupType: string,
  daysSinceLastActivity: number,
  metadata?: Record<string, any>
): Promise<boolean> {
  return logActivity({
    accountId,
    opportunityId,
    actionType: 'followup_suggested',
    payload: {
      entity_type: 'opportunity',
      entity_id: opportunityId,
      followup_type: followupType,
      days_since_last_activity: daysSinceLastActivity,
      metadata
    }
  })
}

/**
 * Obtiene actividades recientes para una cuenta
 */
export async function getRecentActivities(
  accountId: string,
  options?: {
    limit?: number
    actionTypes?: ActionType[]
    opportunityId?: string
    userId?: string
  }
): Promise<any[]> {
  try {
    const supabase = getSupabaseClient()
    
    let query = supabase
      .from('activity_logs')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })
    
    if (options?.limit) {
      query = query.limit(options.limit)
    }
    
    if (options?.actionTypes && options.actionTypes.length > 0) {
      query = query.in('action_type', options.actionTypes)
    }
    
    if (options?.opportunityId) {
      query = query.eq('opportunity_id', options.opportunityId)
    }
    
    if (options?.userId) {
      query = query.eq('user_id', options.userId)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error(`[Activity Logger] Error fetching activities:`, error)
      return []
    }
    
    return data || []
  } catch (error) {
    console.error(`[Activity Logger] Exception fetching activities:`, error)
    return []
  }
}

/**
 * Obtiene actividades para una oportunidad específica
 */
export async function getActivitiesForOpportunity(
  accountId: string,
  opportunityId: string
): Promise<any[]> {
  return getRecentActivities(accountId, { opportunityId })
}

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default {
  logActivity,
  logIntroRequested,
  logMessageSent,
  logStatusChanged,
  logCompanyAdded,
  logContactAdded,
  logRelationshipAdded,
  logOpportunityCreated,
  logOpportunityAccepted,
  logOpportunityRejected,
  logHubspotSynced,
  logEnrichmentCompleted,
  logWeeklySummaryGenerated,
  logSettingsUpdated,
  logSystemAutomated,
  logBuyingSignalDetected,
  logFollowupSuggested,
  getRecentActivities,
  getActivitiesForOpportunity
}
