import { env } from '../../config/env';
import { logger } from '../logger/logger';

export interface WhatsAppSendResult {
  ok: boolean;
  status?: number;
  error?: string;
}

function normalizeToWhatsAppId(phone: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) return '';
  return digits.includes('@') ? digits : `${digits}@c.us`;
}

export async function sendWhatsAppMessage(params: {
  phone: string;
  message: string;
}): Promise<WhatsAppSendResult> {
  const gatewayUrl = env.WHATSAPP_GATEWAY_URL;
  if (!gatewayUrl) {
    logger.debug('[whatsapp] gateway URL nao configurado, skip');
    return { ok: false, error: 'gateway_not_configured' };
  }

  const to = normalizeToWhatsAppId(params.phone);
  if (!to) return { ok: false, error: 'invalid_phone' };

  try {
    const res = await fetch(`${gatewayUrl}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(env.WHATSAPP_GATEWAY_TOKEN
          ? { Authorization: `Bearer ${env.WHATSAPP_GATEWAY_TOKEN}` }
          : {}),
      },
      body: JSON.stringify({ to, message: params.message }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      logger.warn({ status: res.status, body }, '[whatsapp] gateway error');
      return { ok: false, status: res.status, error: body };
    }
    return { ok: true, status: res.status };
  } catch (err) {
    logger.warn({ err }, '[whatsapp] request failed');
    return { ok: false, error: err instanceof Error ? err.message : 'unknown' };
  }
}
