import { supabaseAdmin } from '../../infra/supabase/supabase-admin';
import { logger } from '../../shared/logger/logger';
import { env } from '../../config/env';

export type AuditAction = 'create' | 'update' | 'delete' | 'view';
export type AuditEntityType = 'patient' | 'appointment' | 'doctor';

interface AuditLogInput {
  orgId?: string | null;
  actorUserId: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

export class AuditRepository {
  async log(input: AuditLogInput): Promise<void> {
    // Skip if audit log table doesn't exist yet (migration 002 not applied)
    if (!env.ENABLE_AUDIT_LOG) return;

    try {
      const { error } = await supabaseAdmin
        .schema('app')
        .from('audit_logs')
        .insert({
          org_id: input.orgId ?? null,
          actor_user_id: input.actorUserId,
          action: input.action,
          entity_type: input.entityType,
          entity_id: input.entityId ?? null,
          metadata: input.metadata ?? null,
        });

      if (error) {
        // Audit log failures should never break the main operation
        logger.warn({ err: error, input }, 'Failed to write audit log');
      }
    } catch (err) {
      logger.warn({ err, input }, 'Audit log exception');
    }
  }
}
