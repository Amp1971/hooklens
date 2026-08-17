export interface ParsedWebhookEvent {
  provider: string;
  eventType: string;
  isError: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  summary: string;
  resourceId?: string;
  rawPayload: any;
}

export function parseWooCommerceWebhook(payload: any, headers?: Record<string, string>): ParsedWebhookEvent {
  // WooCommerce sender ofte event-navnet i headeren x-wc-webhook-topic eller i selve payloaden
  const topic = headers?.['x-wc-webhook-topic'] || payload.topic || payload.event || 'woocommerce.event';
  const resourceId = payload.id ? String(payload.id) : payload.order_key || undefined;
  const status = payload.status ? String(payload.status).toLowerCase() : '';

  let isError = false;
  let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
  let summary = `WooCommerce event: ${topic}`;

  if (topic.includes('order.created') || topic.includes('order.updated') || status) {
    if (status === 'failed' || status === 'cancelled') {
      isError = true;
      severity = 'critical';
      summary = `WooCommerce Order #${resourceId || ''} status changed to ${status.toUpperCase()}`;
    } else if (status === 'refunded') {
      isError = true;
      severity = 'medium';
      summary = `WooCommerce Order #${resourceId || ''} was refunded`;
    } else if (status === 'on-hold' || status === 'pending') {
      summary = `WooCommerce Order #${resourceId || ''} is ${status}`;
      severity = 'low';
    } else {
      summary = `WooCommerce Order #${resourceId || ''} processed (${status || 'completed'})`;
    }
  }

  return {
    provider: 'woocommerce',
    eventType: topic,
    isError,
    severity,
    summary,
    resourceId,
    rawPayload: payload,
  };
}
