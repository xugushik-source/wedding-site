'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RsvpResponse } from '@/lib/types';

function toCsv(rows: RsvpResponse[]): string {
  const headers = ['Имя', 'Придёт', 'Гостей', 'Имена доп. гостей', 'Ограничения', 'Телефон', 'Сообщение', 'Дата ответа'];
  const lines = rows.map((r) =>
    [
      r.guest_name,
      r.attending ? 'Да' : 'Нет',
      r.guests_count,
      (r.additional_guest_names || '').replace(/\n/g, '; '),
      r.dietary_restrictions || '',
      r.phone || '',
      (r.message || '').replace(/\n/g, ' '),
      new Date(r.created_at).toLocaleString('ru-RU'),
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(',')
  );
  return [headers.join(','), ...lines].join('\n');
}

export default function RsvpPage() {
  const [rows, setRows] = useState<RsvpResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('rsvp_responses')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setRows((data as RsvpResponse[]) || []);
        setLoading(false);
      });
  }, []);

  function downloadCsv() {
    const csv = '\uFEFF' + toCsv(rows); // BOM для корректной кириллицы в Excel
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rsvp-guests.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function togglePublic(row: RsvpResponse) {
    const supabase = createClient();
    const next = !row.show_wish_publicly;
    setRows((prev) =>
      prev.map((r) => (r.id === row.id ? { ...r, show_wish_publicly: next } : r))
    );
    await supabase.from('rsvp_responses').update({ show_wish_publicly: next }).eq('id', row.id);
  }

  const totalGuests = rows
    .filter((r) => r.attending)
    .reduce((sum, r) => sum + r.guests_count, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Ответы гостей</h1>
        <button
          onClick={downloadCsv}
          disabled={rows.length === 0}
          className="text-sm border border-gray-300 rounded px-3 py-1.5 disabled:opacity-40"
        >
          Скачать CSV
        </button>
      </div>

      {loading && <p className="text-sm text-gray-500">Загрузка…</p>}

      {!loading && rows.length === 0 && (
        <p className="text-sm text-gray-500">Пока никто не ответил.</p>
      )}

      {!loading && rows.length > 0 && (
        <>
          <p className="text-sm text-gray-600 mb-4">
            Всего ответов: {rows.length} · Подтверждено гостей: {totalGuests}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-300 text-left">
                  <th className="py-2 pr-4">Имя</th>
                  <th className="py-2 pr-4">Придёт</th>
                  <th className="py-2 pr-4">Гостей</th>
                  <th className="py-2 pr-4">Имена доп. гостей</th>
                  <th className="py-2 pr-4">Ограничения</th>
                  <th className="py-2 pr-4">Телефон</th>
                  <th className="py-2 pr-4">Сообщение</th>
                  <th className="py-2 pr-4">На сайте</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-gray-100">
                    <td className="py-2 pr-4">{r.guest_name}</td>
                    <td className="py-2 pr-4">{r.attending ? 'Да' : 'Нет'}</td>
                    <td className="py-2 pr-4">{r.guests_count}</td>
                    <td className="py-2 pr-4 whitespace-pre-line">{r.additional_guest_names || '—'}</td>
                    <td className="py-2 pr-4">{r.dietary_restrictions || '—'}</td>
                    <td className="py-2 pr-4">{r.phone || '—'}</td>
                    <td className="py-2 pr-4">{r.message || '—'}</td>
                    <td className="py-2 pr-4">
                      {r.message ? (
                        <input
                          type="checkbox"
                          checked={r.show_wish_publicly}
                          onChange={() => togglePublic(r)}
                          title="Показывать это пожелание всплывающим на сайте"
                        />
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
