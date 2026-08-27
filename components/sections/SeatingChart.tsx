'use client';

import { useMemo, useState } from 'react';
import type { SeatingTable, SeatingGuest } from '@/lib/types';

export default function SeatingChart({
  tables,
  guests,
}: {
  tables: SeatingTable[];
  guests: SeatingGuest[];
}) {
  const [query, setQuery] = useState('');

  const match = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return null;
    return guests.find((g) => g.full_name.toLowerCase().includes(q)) || null;
  }, [query, guests]);

  const matchedTable = match ? tables.find((t) => t.id === match.table_id) : null;

  if (tables.length === 0) return null;

  return (
    <section id="seating" className="section" style={{ backgroundColor: 'var(--color-surface)' }}>
      <div className="section-inner">
        <h2 className="font-display text-3xl md:text-4xl text-center mb-4">Рассадка</h2>
        <p className="text-center opacity-70 text-sm mb-6">
          Введите своё имя, чтобы найти свой стол
        </p>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ваше имя"
          className="w-full max-w-sm mx-auto block border rounded px-4 py-2 bg-transparent mb-3"
          style={{ borderColor: 'var(--color-line)' }}
        />

        {query.trim().length >= 2 && (
          <p className="text-center mb-6">
            {match && matchedTable ? (
              <>
                <span className="opacity-70">{match.full_name} — </span>
                <span className="font-display text-xl" style={{ color: 'var(--color-accent)' }}>
                  {matchedTable.name}
                </span>
                {matchedTable.note && <span className="opacity-70"> ({matchedTable.note})</span>}
              </>
            ) : match ? (
              <span className="opacity-70">{match.full_name} — стол пока не назначен</span>
            ) : (
              <span className="opacity-60">Не нашли — проверьте написание имени</span>
            )}
          </p>
        )}

        <div className="relative w-full h-72 md:h-96 rounded border" style={{ borderColor: 'var(--color-line)' }}>
          {tables.map((table) => {
            const isMatch = matchedTable?.id === table.id;
            return (
              <div
                key={table.id}
                style={{
                  left: `${table.pos_x}%`,
                  top: `${table.pos_y}%`,
                  borderColor: isMatch ? 'var(--color-accent)' : 'var(--color-line)',
                  backgroundColor: isMatch ? 'var(--color-accent)' : 'var(--color-bg)',
                  color: isMatch ? 'var(--color-bg)' : 'var(--color-ink)',
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 w-12 h-12 md:w-14 md:h-14 rounded-full border-2 flex items-center justify-center text-[10px] md:text-xs font-semibold text-center transition-colors"
              >
                {table.name}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
