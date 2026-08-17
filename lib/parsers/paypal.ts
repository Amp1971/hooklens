export interface ParsedWebhookEvent {
  provider: string;
  eventType: string;
  isError: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  summary: string;
  resourceId?: string;
  rawPayload: any;
}

export function parsePayPalWebhook(payload: any): ParsedWebhookEvent {
  const eventType = payload.event_type || 'UNKNOWN.PAYPAL.EVENT';
  const summary = payload.summary || 'PayPal webhook event received';
  const resource = payload.resource || {};
  const resourceId = resource.id || payload.id;

  let isError = false;
  let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';

  // Tjek for kritiske fejl og tvister
  if (
    eventType.includes('DENIED') ||
    eventType.includes('FAILED') ||
    eventType.includes('DECLINED')
  ) {
    isError = true;
    severity = 'critical';
  } else if (
    eventType.includes('DISPUTE') ||
    eventType.includes('SUSPENDED') ||
    eventType.includes('CANCELLED')
  ) {
    isError = true;
    severity = 'high';
  } else if (eventType.includes('REFUND') || eventType.includes('REVERSED')) {
    isError = true;
    severity = 'medium';
  }

  return {
    provider: 'paypal',
    eventType,
    isError,
    severity,
    summary,
    resourceId,
    rawPayload: payload,
  };
}
