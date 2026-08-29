'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Wish {
  guest_name: string;
  message: string;
}

const SHOW_MS = 6000; // сколько показывается одно пожелание
const GAP_MS = 9000; // пауза между появлениями

// Периодически показывает в углу экрана случайное одобренное
// пожелание гостя. Ничего не показывает, пока пара не одобрит
// хотя бы одно пожелание в /admin/rsvp (чекбокс «На сайте»).
export default function WishesPopup() {
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [current, setCurrent] = useState<Wish | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('public_wishes')
      .select('guest_name, message')
      .then(({ data }) => {
        setWishes(((data as Wish[]) || []).filter((w) => w.message?.trim()));
      });
  }, []);

  useEffect(() => {
    if (wishes.length === 0) return;

    let timeoutId: ReturnType<typeof setTimeout>;

    function cycle() {
      const next = wishes[Math.floor(Math.random() * wishes.length)];
      setCurrent(next);
      timeoutId = setTimeout(() => {
        setCurrent(null);
        timeoutId = setTimeout(cycle, GAP_MS);
      }, SHOW_MS);
    }

    timeoutId = setTimeout(cycle, 3000); // первое появление чуть позже загрузки

    return () => clearTimeout(timeoutId);
  }, [wishes]);

  if (!current) return null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-xs z-50 rounded-lg shadow-lg p-4 transition-opacity"
      style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-line)' }}
      role="status"
    >
      <p className="text-sm leading-relaxed whitespace-pre-line">{current.message}</p>
      <p className="text-xs mt-2 opacity-60 font-display">— {current.guest_name}</p>
    </div>
  );
}
