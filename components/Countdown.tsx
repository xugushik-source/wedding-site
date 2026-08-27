'use client';

import { useEffect, useState } from 'react';

function getTimeLeft(target: Date) {
  const diff = Math.max(0, target.getTime() - Date.now());
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export default function Countdown({ weddingDate }: { weddingDate: string }) {
  const target = new Date(weddingDate);
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(target));

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getTimeLeft(target)), 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weddingDate]);

  const units: [string, number][] = [
    ['дней', timeLeft.days],
    ['часов', timeLeft.hours],
    ['минут', timeLeft.minutes],
    ['секунд', timeLeft.seconds],
  ];

  return (
    <div className="flex gap-4 md:gap-8 justify-center" aria-label="Обратный отсчёт до свадьбы">
      {units.map(([label, value]) => (
        <div key={label} className="text-center min-w-[3.5rem]">
          <div className="font-display text-3xl md:text-5xl tabular-nums" style={{ color: 'var(--color-accent)' }}>
            {String(value).padStart(2, '0')}
          </div>
          <div className="text-xs md:text-sm uppercase tracking-wide mt-1 opacity-70">{label}</div>
        </div>
      ))}
    </div>
  );
}
