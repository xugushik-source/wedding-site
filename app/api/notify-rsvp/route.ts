import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================================
// Уведомление паре на почту о новом RSVP-ответе.
//
// Вызывается Supabase Database Webhook при INSERT в rsvp_responses.
// Настройка: Supabase → Database → Webhooks → Create a new hook
//   Table: rsvp_responses, Events: Insert
//   URL: https://<домен-сайта>/api/notify-rsvp
//   HTTP Header: x-webhook-secret = <тот же RSVP_WEBHOOK_SECRET из .env>
//
// Нужен аккаунт на resend.com (бесплатно) и переменные окружения
// RESEND_API_KEY, RESEND_FROM_EMAIL, RSVP_WEBHOOK_SECRET — см. README.
// Если RESEND_API_KEY не задан, письмо просто не отправляется —
// RSVP при этом всё равно нормально сохраняется в базу.
// ============================================================

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-webhook-secret');
  if (!process.env.RSVP_WEBHOOK_SECRET || secret !== process.env.RSVP_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const payload = await req.json().catch(() => null);
  const record = payload?.record;
  if (!record?.guest_name) {
    return NextResponse.json({ error: 'bad payload' }, { status: 400 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ skipped: 'RESEND_API_KEY не настроен' });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: config } = await supabase
    .from('site_config')
    .select('contact_email')
    .eq('id', 1)
    .single();

  if (!config?.contact_email) {
    return NextResponse.json({ skipped: 'contact_email не заполнен в /admin' });
  }

  const name = escapeHtml(record.guest_name);
  const subject = record.attending
    ? `${record.guest_name} подтвердил(а) присутствие`
    : `${record.guest_name} не сможет прийти`;

  const rows: string[] = [
    `<p><strong>${name}</strong> ${record.attending ? 'придёт на свадьбу' : 'не сможет прийти'}.</p>`,
  ];
  if (record.attending && record.guests_count) {
    rows.push(`<p>Количество гостей: ${Number(record.guests_count)}</p>`);
  }
  if (record.dietary_restrictions) {
    rows.push(`<p>Пищевые ограничения: ${escapeHtml(String(record.dietary_restrictions))}</p>`);
  }
  if (record.phone) {
    rows.push(`<p>Телефон: ${escapeHtml(String(record.phone))}</p>`);
  }
  if (record.message) {
    rows.push(`<p>Пожелание: ${escapeHtml(String(record.message))}</p>`);
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: config.contact_email,
      subject,
      html: rows.join(''),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: 'resend failed', detail: text }, { status: 502 });
  }

  return NextResponse.json({ sent: true });
}
