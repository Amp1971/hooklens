import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getWelcomeEmailHtml } from '@/lib/emails/welcome';

const resend = new Resend(process.env.RESEND_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (!process.env.RESEND_API_KEY) {
      console.warn('⚠️ RESEND_API_KEY is not configured. Skipping welcome email.');
      return NextResponse.json({ message: 'Email skipped (no API key)' }, { status: 200 });
    }

    const { data, error } = await resend.emails.send({
      from: 'Allan from HookLens <allan@usehooklens.com>',
      to: [email],
      subject: 'Welcome to HookLens (Your 14-day trial is active)',
      html: getWelcomeEmailHtml(email),
    });

    if (error) {
      console.error('Error sending welcome email with Resend:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('Failed in welcome email endpoint:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
