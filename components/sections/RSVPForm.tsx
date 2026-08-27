'use client';

import { useState, useRef, FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';

// Минимальное время (мс) между показом формы и отправкой.
// Боты обычно заполняют форму мгновенно — человек так быстро не успевает.
const MIN_FILL_TIME_MS = 1500;

export default function RSVPForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [attending, setAttending] = useState<'yes' | 'no' | ''>('');
  const [guestsCount, setGuestsCount] = useState(1);
  const renderedAt = useRef(Date.now());

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    // Honeypot: обычные пользователи это поле не видят и не заполняют.
    // Если оно заполнено — это бот, тихо "успешно" завершаем без записи в БД.
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
      additional_guest_names: String(data.get('additional_guest_names') || '') || null,
      dietary_restrictions: String(data.get('dietary_restrictions') || ''),
      message: String(data.get('message') || ''),
      phone: String(data.get('phone') || ''),
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
      <section id="rsvp" className="section" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="section-inner text-center">
          <h2 className="font-display text-3xl md:text-4xl mb-4">Спасибо!</h2>
          <p className="opacity-80">Ваш ответ получен. Мы очень ждём встречи с вами.</p>
        </div>
      </section>
    );
  }

  return (
    <section id="rsvp" className="section" style={{ backgroundColor: 'var(--color-surface)' }}>
      <div className="section-inner">
        <h2 className="font-display text-3xl md:text-4xl text-center mb-4">Подтвердите присутствие</h2>
        <p className="text-center opacity-70 text-sm mb-10">
          Пожалуйста, ответьте до наступления даты свадьбы
        </p>

        <form onSubmit={handleSubmit} className="space-y-5 max-w-md mx-auto">
          {/* Honeypot: скрыто от людей CSS и aria-hidden, но видно ботам */}
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
              Ваше имя *
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
                Да, буду
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
            <>
              <div>
                <label htmlFor="guests_count" className="block text-sm mb-1">
                  Количество гостей (с вами)
                </label>
                <input
                  id="guests_count"
                  name="guests_count"
                  type="number"
                  min={1}
                  max={10}
                  defaultValue={1}
                  onChange={(e) => setGuestsCount(Number(e.target.value) || 1)}
                  className="w-full border rounded px-4 py-2 bg-transparent"
                  style={{ borderColor: 'var(--color-line)' }}
                />
              </div>
              {guestsCount > 1 && (
                <div>
                  <label htmlFor="additional_guest_names" className="block text-sm mb-1">
                    Имена остальных гостей (по одному на строке)
                  </label>
                  <textarea
                    id="additional_guest_names"
                    name="additional_guest_names"
                    rows={Math.min(guestsCount - 1, 4)}
                    placeholder={'Например:\nМария Иванова\nПётр Иванов'}
                    className="w-full border rounded px-4 py-2 bg-transparent"
                    style={{ borderColor: 'var(--color-line)' }}
                  />
                  <p className="text-xs opacity-60 mt-1">
                    Нужно для рассадки — чтобы каждому подписать место за столом
                  </p>
                </div>
              )}
              <div>
                <label htmlFor="dietary_restrictions" className="block text-sm mb-1">
                  Пищевые ограничения / аллергии
                </label>
                <input
                  id="dietary_restrictions"
                  name="dietary_restrictions"
                  className="w-full border rounded px-4 py-2 bg-transparent"
                  style={{ borderColor: 'var(--color-line)' }}
                />
              </div>
            </>
          )}

          <div>
            <label htmlFor="phone" className="block text-sm mb-1">
              Телефон для связи
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              className="w-full border rounded px-4 py-2 bg-transparent"
              style={{ borderColor: 'var(--color-line)' }}
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm mb-1">
              Пожелание молодожёнам
            </label>
            <textarea
              id="message"
              name="message"
              rows={3}
              className="w-full border rounded px-4 py-2 bg-transparent"
              style={{ borderColor: 'var(--color-line)' }}
            />
          </div>

          {status === 'error' && (
            <p className="text-sm" style={{ color: 'var(--color-accent)' }}>
              Не получилось отправить ответ. Проверьте соединение и попробуйте ещё раз.
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
      </div>
    </section>
  );
}
