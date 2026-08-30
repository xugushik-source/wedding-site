'use client';

import { useState, useRef, FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';

// Та же защита от ботов, что в components/sections/RSVPForm.tsx —
// приём переиспользован, не изобретён заново. Поля формы здесь —
// укороченный набор по ТЗ (имя, буду/не смогу, количество гостей,
// комментарий), пишут в ту же таблицу rsvp_responses, остальные её
// колонки (phone, dietary_restrictions, additional_guest_names)
// просто не заполняются.
const MIN_FILL_TIME_MS = 1500;

export default function InvitationRSVPForm() {
  const [revealed, setRevealed] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [attending, setAttending] = useState<'yes' | 'no' | ''>('');
  const renderedAt = useRef(Date.now());

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    const honeypot = String(data.get('website') || '');
    const tooFast = Date.now() - renderedAt.current < MIN_FILL_TIME_MS;
    if (honeypot || tooFast) {
      setStatus('done');
      return;
    }

    setStatus('loading');
    const supabase = createClient();
    const { error } = await supabase.from('rsvp_responses').insert({
      guest_name: String(data.get('guest_name') || ''),
      attending: data.get('attending') === 'yes',
      guests_count: Number(data.get('guests_count') || 1),
      message: String(data.get('message') || ''),
    });

    if (error) {
      setStatus('error');
      return;
    }
    setStatus('done');
    form.reset();
  }

  if (status === 'done') {
    return (
      <div className="text-center py-8">
        <p className="font-display text-2xl mb-2">Спасибо!</p>
        <p className="opacity-80">Ваш ответ получен.</p>
      </div>
    );
  }

  if (!revealed) {
    return (
      <button
        type="button"
        onClick={() => setRevealed(true)}
        className="w-full py-3 rounded font-display text-lg"
        style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-bg)' }}
      >
        Подтвердить присутствие
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
      />
      <div>
        <label htmlFor="guest_name" className="block text-sm mb-1">
          Имя *
        </label>
        <input
          id="guest_name"
          name="guest_name"
          required
          className="w-full border rounded px-4 py-2 bg-transparent"
          style={{ borderColor: 'var(--color-line)' }}
        />
      </div>

      <fieldset>
        <legend className="text-sm mb-2">Сможете прийти? *</legend>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="attending"
              value="yes"
              required
              onChange={() => setAttending('yes')}
            />
            Буду
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="attending"
              value="no"
              onChange={() => setAttending('no')}
            />
            Не смогу
          </label>
        </div>
      </fieldset>

      {attending === 'yes' && (
        <div>
          <label htmlFor="guests_count" className="block text-sm mb-1">
            Количество гостей
          </label>
          <input
            id="guests_count"
            name="guests_count"
            type="number"
            min={1}
            max={10}
            defaultValue={1}
            className="w-full border rounded px-4 py-2 bg-transparent"
            style={{ borderColor: 'var(--color-line)' }}
          />
        </div>
      )}

      <div>
        <label htmlFor="message" className="block text-sm mb-1">
          Комментарий
        </label>
        <textarea
          id="message"
          name="message"
          rows={2}
          className="w-full border rounded px-4 py-2 bg-transparent"
          style={{ borderColor: 'var(--color-line)' }}
        />
      </div>

      {status === 'error' && (
        <p className="text-sm" style={{ color: 'var(--color-accent)' }}>
          Не получилось отправить ответ. Попробуйте ещё раз.
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full py-3 rounded font-display text-lg disabled:opacity-50"
        style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-bg)' }}
      >
        {status === 'loading' ? 'Отправляем…' : 'Отправить ответ'}
      </button>
    </form>
  );
}
