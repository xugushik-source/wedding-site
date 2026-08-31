'use client';

import { useMemo, useRef, useState } from 'react';
import type { SeatingTable, SeatingGuest } from '@/lib/types';

export default function SeatingChart({
  tables,
  guests,
}: {
  tables: SeatingTable[];
  guests: SeatingGuest[];
}) {
  const [query, setQuery] = useState('');
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

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
          onChange={(e) => {
            setQuery(e.target.value);
            const q = e.target.value.trim().toLowerCase();
            if (q.length < 2) return;
            const g = guests.find((g) => g.full_name.toLowerCase().includes(q));
            const tableId = g?.table_id;
            if (tableId && cardRefs.current[tableId]) {
              cardRefs.current[tableId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }}
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

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {tables.map((table) => {
            const isMatch = matchedTable?.id === table.id;
            const tableGuests = guests.filter((g) => g.table_id === table.id);
            return (
              <div
                key={table.id}
                ref={(el) => {
                  cardRefs.current[table.id] = el;
                }}
                style={{
                  borderColor: isMatch ? 'var(--color-accent)' : 'var(--color-line)',
                  backgroundColor: isMatch ? 'var(--color-accent)' : 'var(--color-bg)',
                  color: isMatch ? 'var(--color-bg)' : 'var(--color-ink)',
                }}
                className="rounded-lg border-2 p-3 transition-colors"
              >
                <div className="font-display text-base font-semibold mb-1">{table.name}</div>
                {table.note && <div className="text-[11px] opacity-70 mb-1">{table.note}</div>}
                {tableGuests.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {tableGuests.map((g) => (
                      <span
                        key={g.id}
                        className="text-[11px] rounded px-1.5 py-0.5 leading-tight"
                        style={{
                          backgroundColor: isMatch ? 'rgba(255,255,255,0.25)' : 'var(--color-surface)',
                        }}
                      >
                        {g.full_name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-[11px] opacity-50">Пусто</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
