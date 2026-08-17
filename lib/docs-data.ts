export interface DocGuide {
  id: string;
  category: string;
  title: string;
  badge: string;
  description: string;
  difficulty: 'Beginner (No-Code)' | 'Developer / Intermediate';
  steps: {
    title: string;
    description: string;
    code?: string;
    tip?: string;
  }[];
}

export const docGuides: DocGuide[] = [
  {
    id: 'stripe-setup',
    category: 'Payment Providers',
    title: 'Connecting Stripe Webhooks to HookLens',
    badge: 'Popular',
    difficulty: 'Beginner (No-Code)',
    description: 'Learn how to connect your Stripe account to HookLens in less than 2 minutes. Monitor checkout sessions, failed payments, and subscription upgrades with automatic AI diagnostics.',
    steps: [
      {
        title: '1. Copy your HookLens Ingest URL',
        description: 'Log into your HookLens Dashboard at usehooklens.com/dashboard, open your project (e.g., "HookLens Core Billing"), and click the "Copy Ingest URL" button. It looks like: https://usehooklens.com/api/ingest/hl_cdd50...',
        tip: 'Each project has its own unique Ingestion URL and API key.'
      },
      {
        title: '2. Open Developers > Webhooks in Stripe',
        description: 'Log into your Stripe Dashboard. In the top-right search bar or left navigation, go to Developers > Webhooks (or direct URL: dashboard.stripe.com/test/webhooks).',
      },
      {
        title: '3. Add Destination / Add Endpoint',
        description: 'Click the "+ Add destination" (or "+ Add endpoint") button in Stripe. Choose "Your account" as the destination scope.',
      },
      {
        title: '4. Configure Payload Style & Insert URL',
        description: 'Choose "Snapshot payload" (this includes full order & customer metadata, giving HookLens AI maximum diagnostic power). Paste your HookLens Ingest URL into the Endpoint URL field.',
      },
      {
        title: '5. Select Events to Monitor',
        description: 'You can choose "Select all" or specifically pick the most critical subscription and billing events:',
        code: `• checkout.session.completed\n• customer.subscription.created\n• customer.subscription.updated\n• customer.subscription.deleted\n• invoice.payment_succeeded\n• invoice.payment_failed`
      },
      {
        title: '6. Test the Connection',
        description: 'Click "Add destination". Inside Stripe, click "Send test event" or "Test in test mode", select "invoice.payment_failed", and hit send. Within seconds, the test event and AI diagnosis will appear in your HookLens dashboard!',
        tip: 'No coding required! Stripe will now automatically stream errors and events to your HookLens triage system.'
      }
    ]
  },
  {
    id: 'shopify-setup',
    category: 'E-Commerce Platforms',
    title: 'Connecting Shopify Webhooks to HookLens',
    badge: 'E-Commerce',
    difficulty: 'Beginner (No-Code)',
    description: 'Track Shopify orders, customer updates, and inventory syncs. Catch 504 gateway timeouts and broken fulfillment hooks before customers notice.',
    steps: [
      {
        title: '1. Get your HookLens Ingest URL',
        description: 'From your HookLens dashboard, copy your project’s Ingestion URL (e.g., https://usehooklens.com/api/ingest/hl_...).',
      },
      {
        title: '2. Open Shopify Admin Notifications Settings',
        description: 'In your Shopify Admin, click "Settings" in the bottom-left corner, then click "Notifications" in the sidebar.',
      },
      {
        title: '3. Scroll down to Webhooks',
        description: 'Scroll down to the bottom of the Notifications page to the "Webhooks" section, and click "Create webhook".',
      },
      {
        title: '4. Configure Webhook Event & Format',
        description: 'Configure the webhook dialog as follows:\n- Event: Select "Order creation" (or "Fulfillment creation")\n- Format: Select "JSON"\n- URL: Paste your HookLens Ingest URL\n- Webhook API version: Select the latest stable version.',
        code: `Event: Order creation\nFormat: JSON\nURL: https://usehooklens.com/api/ingest/YOUR_API_KEY\nAPI Version: Latest (Recommended)`
      },
      {
        title: '5. Save and Send Test Notification',
        description: 'Click "Save". Click "Send test notification" next to your newly created webhook to verify that HookLens receives the mock order payload instantly.',
        tip: 'Repeat these steps for other critical events like "Order cancellation" or "Inventory levels update".'
      }
    ]
  },
  {
    id: 'slack-discord-alerts',
    category: 'Integrations & Alerts',
    title: 'Setting up Real-Time Slack & Discord Alerts',
    badge: 'Alerts',
    difficulty: 'Beginner (No-Code)',
    description: 'Receive instant AI triage alerts with root-cause summaries and code fixes directly inside your engineering Slack or Discord channels.',
    steps: [
      {
        title: '1. Create an Incoming Webhook in Slack or Discord',
        description: 'In Slack: Go to api.slack.com/apps > Create App > Incoming Webhooks > Add New Webhook to Workspace > Choose your channel (e.g., #engineering-alerts).\nIn Discord: Server Settings > Integrations > Webhooks > New Webhook > Copy Webhook URL.',
      },
      {
        title: '2. Paste the Webhook URL into HookLens',
        description: 'Open your HookLens Dashboard, click "Edit Project" (or Settings on your project card), and paste your Slack or Discord webhook URL into the respective field.',
      },
      {
        title: '3. Instant Incident Response',
        description: 'Whenever a critical error (4xx / 5xx or unhandled exception) is captured by HookLens, your team will immediately receive a rich message in your channel containing the error message, affected customer, and Gemini AI’s suggested fix.',
        tip: 'No more checking servers late at night—your team gets notified only when critical issues occur.'
      }
    ]
  }
];
