export function getWelcomeEmailHtml(userEmail: string) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Welcome to HookLens</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #020617; color: #f8fafc; padding: 40px 20px; margin: 0;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 32px;">
      <h1 style="color: #ffffff; font-size: 24px; margin-top: 0; font-weight: 800; letter-spacing: -0.5px;">
        Welcome to Hook<span style="color: #3b82f6;">Lens</span>
      </h1>
      <p style="color: #94a3b8; font-size: 15px; line-height: 1.6;">
        Hi there,
      </p>
      <p style="color: #cbd5e1; font-size: 15px; line-height: 1.6;">
        Thanks for signing up! Your <strong>14-day free trial</strong> is now active. You have full access to live webhook logging, instant AI error diagnostics, and team alerts.
      </p>

      <div style="background-color: #020617; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <h3 style="color: #38bdf8; margin: 0 0 8px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
          🚀 Quick Setup in 2 Minutes
        </h3>
        <ol style="color: #94a3b8; font-size: 14px; line-height: 1.6; padding-left: 20px; margin: 0;">
          <li>Copy your Ingestion URL from your <a href="https://usehooklens.com/dashboard" style="color: #38bdf8;">Dashboard</a>.</li>
          <li>Paste it into Stripe, Shopify, or GitHub webhooks settings.</li>
          <li>Check our step-by-step guides at <a href="https://usehooklens.com/docs" style="color: #38bdf8;">usehooklens.com/docs</a>.</li>
        </ol>
      </div>

      <div style="text-align: center; margin: 32px 0;">
        <a href="https://usehooklens.com/dashboard" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 600; font-size: 14px; display: inline-block;">
          Open Your Dashboard &rarr;
        </a>
      </div>

      <p style="color: #64748b; font-size: 13px; line-height: 1.5; border-top: 1px solid #1e293b; padding-top: 20px; margin-bottom: 0;">
        Need help connecting your first webhook? Simply reply directly to this email.<br>
        Allan, Founder of HookLens
      </p>
    </div>
  </body>
  </html>
  `;
}
