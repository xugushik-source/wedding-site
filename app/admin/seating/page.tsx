'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { SeatingTable, SeatingGuest, RsvpResponse } from '@/lib/types';

export default function SeatingAdminPage() {
  const [tables, setTables] = useState<SeatingTable[]>([]);
  const [guests, setGuests] = useState<SeatingGuest[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [manualName, setManualName] = useState('');
  const [importing, setImporting] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    const supabase = createClient();
    const [{ data: t }, { data: g }] = await Promise.all([
      supabase.from('seating_tables').select('*').order('sort_order'),
      supabase.from('seating_guests').select('*').order('sort_order'),
    ]);
    setTables((t as SeatingTable[]) || []);
    setGuests((g as SeatingGuest[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  // ------------------------------------------------------------
  // Импорт гостей из подтверждённых RSVP-ответов. Пропускает
  // ответы, которые уже импортировали раньше (проверяем по
  // rsvp_response_id — на этот id может ссылаться несколько
  // гостей сразу, основной + дополнительные из одной анкеты).
  // ------------------------------------------------------------
  async function importFromRsvp() {
    setImporting(true);
    const supabase = createClient();
    const { data: rsvps } = await supabase
      .from('rsvp_responses')
      .select('*')
      .eq('attending', true);

    const alreadyImported = new Set(
      guests.map((g) => g.rsvp_response_id).filter(Boolean)
    );

    const toInsert: { full_name: string; rsvp_response_id: string; sort_order: number }[] = [];
    let order = guests.length;

    ((rsvps as RsvpResponse[]) || []).forEach((rsvp) => {
      if (alreadyImported.has(rsvp.id)) return;
      toInsert.push({ full_name: rsvp.guest_name, rsvp_response_id: rsvp.id, sort_order: order++ });
      if (rsvp.additional_guest_names) {
        rsvp.additional_guest_names
          .split('\n')
          .map((n) => n.trim())
          .filter(Boolean)
          .forEach((name) => {
            toInsert.push({ full_name: name, rsvp_response_id: rsvp.id, sort_order: order++ });
          });
      }
    });

    if (toInsert.length > 0) {
      await supabase.from('seating_guests').insert(toInsert);
    }
    setImporting(false);
    load();
  }

  async function addTable() {
    const supabase = createClient();
    await supabase.from('seating_tables').insert({
      name: `Стол ${tables.length + 1}`,
      capacity: 10,
      sort_order: tables.length,
    });
    load();
  }

  async function updateTable(id: string, patch: Partial<SeatingTable>) {
    setTables((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    const supabase = createClient();
    await supabase.from('seating_tables').update(patch).eq('id', id);
  }

  async function deleteTable(id: string) {
    const supabase = createClient();
    await supabase.from('seating_guests').update({ table_id: null }).eq('table_id', id);
    await supabase.from('seating_tables').delete().eq('id', id);
    setSelectedTableId(null);
    load();
  }

  // Перестановка местами вместо пиксельного перетаскивания — два
  // стола просто меняются sort_order. Надёжно работает пальцем,
  // не требует точного попадания в координаты.
  async function moveTable(id: string, direction: -1 | 1) {
    const idx = tables.findIndex((t) => t.id === id);
    const swapIdx = idx + direction;
    if (idx === -1 || swapIdx < 0 || swapIdx >= tables.length) return;
    const a = tables[idx];
    const b = tables[swapIdx];
    const supabase = createClient();
    await Promise.all([
      supabase.from('seating_tables').update({ sort_order: b.sort_order }).eq('id', a.id),
      supabase.from('seating_tables').update({ sort_order: a.sort_order }).eq('id', b.id),
    ]);
    load();
  }

  async function assignGuest(guestId: string, tableId: string | null) {
    const supabase = createClient();
    await supabase.from('seating_guests').update({ table_id: tableId }).eq('id', guestId);
    setGuests((prev) => prev.map((g) => (g.id === guestId ? { ...g, table_id: tableId } : g)));
  }

  async function addManualGuest() {
    if (!manualName.trim()) return;
    const supabase = createClient();
    await supabase.from('seating_guests').insert({
      full_name: manualName.trim(),
      table_id: selectedTableId,
      sort_order: guests.length,
    });
    setManualName('');
    load();
  }

  async function removeGuest(guestId: string) {
    const supabase = createClient();
    await supabase.from('seating_guests').delete().eq('id', guestId);
    setGuests((prev) => prev.filter((g) => g.id !== guestId));
  }

  const selectedTable = tables.find((t) => t.id === selectedTableId) || null;
  const unassigned = guests.filter((g) => !g.table_id);
  const guestsAtSelected = guests.filter((g) => g.table_id === selectedTableId);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">Рассадка гостей</h1>
      <p className="text-sm text-gray-600 mb-4">
        Столы расставляются автоматически в ряд — стрелочками ▲▼ на карточке
        меняешь порядок. Нажми на карточку, чтобы назначить гостей. Размер
        стола не ограничен: карточка сама растёт под список гостей, ничего
        не наезжает друг на друга.
      </p>

      <div className="flex gap-3 mb-4">
        <button
          onClick={addTable}
          className="text-sm border border-gray-300 rounded px-3 py-1.5"
        >
          + Добавить стол
        </button>
        <button
          onClick={importFromRsvp}
          disabled={importing}
          className="text-sm border border-gray-300 rounded px-3 py-1.5 disabled:opacity-50"
        >
          {importing ? 'Импортируем…' : 'Импортировать из RSVP'}
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Загрузка…</p>
      ) : (
        <>
          {tables.length === 0 ? (
            <p className="text-sm text-gray-400 border border-dashed border-gray-300 rounded p-6 text-center mb-4">
              Пока нет столов — нажми «Добавить стол»
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
              {tables.map((table, idx) => {
                const tableGuests = guests.filter((g) => g.table_id === table.id);
                const over = tableGuests.length > table.capacity;
                return (
                  <div
                    key={table.id}
                    className={`border-2 rounded-lg p-3 flex flex-col cursor-pointer transition-colors ${
                      selectedTableId === table.id
                        ? 'border-black bg-white'
                        : over
                          ? 'border-red-400 bg-red-50'
                          : 'border-gray-200 bg-white hover:border-gray-400'
                    }`}
                    onClick={() => setSelectedTableId(table.id)}
                  >
                    <div className="flex items-start justify-between gap-1 mb-2">
                      <span className="font-semibold text-sm truncate">{table.name}</span>
                      <div className="flex flex-col shrink-0 -mt-1 -mr-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveTable(table.id, -1);
                          }}
                          disabled={idx === 0}
                          className="text-gray-400 hover:text-black disabled:opacity-20 leading-none text-xs px-1"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveTable(table.id, 1);
                          }}
                          disabled={idx === tables.length - 1}
                          className="text-gray-400 hover:text-black disabled:opacity-20 leading-none text-xs px-1"
                        >
                          ▼
                        </button>
                      </div>
                    </div>
                    <span className={`text-xs mb-2 ${over ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                      {tableGuests.length}/{table.capacity} мест
                    </span>
                    {tableGuests.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {tableGuests.map((g) => (
                          <span
                            key={g.id}
                            className="text-[11px] bg-gray-100 rounded px-1.5 py-0.5 leading-tight"
                          >
                            {g.full_name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] text-gray-400">Пусто</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {!selectedTable && unassigned.length > 0 && (
            <div className="border border-gray-200 rounded p-4 mb-4">
              <h2 className="font-semibold mb-2 text-sm">
                Гости без стола ({unassigned.length})
              </h2>
              <p className="text-xs text-gray-500 mb-2">Нажми на карточку стола, чтобы назначить</p>
              <ul className="text-sm space-y-1">
                {unassigned.map((g) => (
                  <li key={g.id} className="flex justify-between items-center">
                    <span>{g.full_name}</span>
                    <button onClick={() => removeGuest(g.id)} className="text-xs text-red-600 underline">
                      Удалить
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {selectedTable && (
            <div className="border border-gray-300 rounded p-4">
              <div className="flex justify-between items-start mb-3">
                <input
                  className="font-semibold text-lg border-b border-transparent focus:border-gray-300 outline-none"
                  value={selectedTable.name}
                  onChange={(e) => updateTable(selectedTable.id, { name: e.target.value })}
                />
                <button onClick={() => setSelectedTableId(null)} className="text-sm text-gray-500">
                  Закрыть ✕
                </button>
              </div>

              <div className="flex gap-4 mb-3 text-sm">
                <label className="flex items-center gap-2">
                  Мест:
                  <input
                    type="number"
                    min={1}
                    className="w-16 border border-gray-300 rounded px-2 py-1"
                    value={selectedTable.capacity}
                    onChange={(e) =>
                      updateTable(selectedTable.id, { capacity: Number(e.target.value) || 1 })
                    }
                  />
                </label>
                <button
                  onClick={() => deleteTable(selectedTable.id)}
                  className="text-red-600 underline ml-auto"
                >
                  Удалить стол
                </button>
              </div>

              <input
                placeholder="Заметка (например «у окна»)"
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm mb-4"
                value={selectedTable.note || ''}
                onChange={(e) => updateTable(selectedTable.id, { note: e.target.value })}
              />

              <h3 className="text-sm font-semibold mb-2">
                За этим столом ({guestsAtSelected.length})
              </h3>
              <ul className="text-sm space-y-1 mb-4">
                {guestsAtSelected.map((g) => (
                  <li key={g.id} className="flex justify-between items-center">
                    <span>{g.full_name}</span>
                    <button
                      onClick={() => assignGuest(g.id, null)}
                      className="text-xs underline text-gray-500"
                    >
                      Убрать со стола
                    </button>
                  </li>
                ))}
                {guestsAtSelected.length === 0 && (
                  <li className="text-gray-400">Пока никто не назначен</li>
                )}
              </ul>

              {unassigned.length > 0 && (
                <>
                  <h3 className="text-sm font-semibold mb-2">Добавить из списка без стола</h3>
                  <ul className="text-sm space-y-1 mb-4">
                    {unassigned.map((g) => (
                      <li key={g.id} className="flex justify-between items-center">
                        <span>{g.full_name}</span>
                        <button
                          onClick={() => assignGuest(g.id, selectedTable.id)}
                          className="text-xs underline"
                        >
                          Добавить сюда
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              <div className="flex gap-2">
                <input
                  placeholder="Имя гостя вручную"
                  className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                />
                <button
                  onClick={addManualGuest}
                  className="text-sm border border-gray-300 rounded px-3"
                >
                  Добавить
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
