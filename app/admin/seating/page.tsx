'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { SeatingTable, SeatingGuest, RsvpResponse } from '@/lib/types';

export default function SeatingAdminPage() {
  const [tables, setTables] = useState<SeatingTable[]>([]);
  const [guests, setGuests] = useState<SeatingGuest[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [manualName, setManualName] = useState('');
  const [importing, setImporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ id: string; startedDrag: boolean } | null>(null);

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
      capacity: 8,
      pos_x: 20 + ((tables.length * 15) % 60),
      pos_y: 20 + ((tables.length * 23) % 60),
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

  // ------------------------------------------------------------
  // Перетаскивание столов по схеме (мышь и палец — Pointer Events)
  // ------------------------------------------------------------
  const handlePointerDown = useCallback((tableId: string) => {
    dragState.current = { id: tableId, startedDrag: false };
  }, []);

  useEffect(() => {
    function toPercent(clientX: number, clientY: number) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return null;
      const x = Math.min(96, Math.max(4, ((clientX - rect.left) / rect.width) * 100));
      const y = Math.min(92, Math.max(8, ((clientY - rect.top) / rect.height) * 100));
      return { x, y };
    }

    function handleMove(e: PointerEvent) {
      if (!dragState.current) return;
      const pos = toPercent(e.clientX, e.clientY);
      if (!pos) return;
      dragState.current.startedDrag = true;
      setTables((prev) =>
        prev.map((t) => (t.id === dragState.current!.id ? { ...t, pos_x: pos.x, pos_y: pos.y } : t))
      );
    }

    async function handleUp() {
      if (!dragState.current) return;
      const { id, startedDrag } = dragState.current;
      if (startedDrag) {
        const table = tables.find((t) => t.id === id);
        if (table) {
          const supabase = createClient();
          await supabase
            .from('seating_tables')
            .update({ pos_x: table.pos_x, pos_y: table.pos_y })
            .eq('id', id);
        }
      } else {
        // Не двигали — значит это был клик, открываем панель стола
        setSelectedTableId(id);
      }
      dragState.current = null;
    }

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tables]);

  const selectedTable = tables.find((t) => t.id === selectedTableId) || null;
  const unassigned = guests.filter((g) => !g.table_id);
  const guestsAtSelected = guests.filter((g) => g.table_id === selectedTableId);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">Рассадка гостей</h1>
      <p className="text-sm text-gray-600 mb-4">
        Перетащи стол, чтобы расставить по залу. Нажми на стол (без перетаскивания),
        чтобы назначить гостей. На сайте гости увидят эту же схему и смогут найти свой стол по имени.
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
          <div
            ref={canvasRef}
            className="relative w-full h-[420px] border border-gray-300 rounded bg-gray-50 mb-4 touch-none"
          >
            {tables.length === 0 && (
              <p className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">
                Пока нет столов — нажми «Добавить стол»
              </p>
            )}
            {tables.map((table) => {
              const count = guests.filter((g) => g.table_id === table.id).length;
              const over = count > table.capacity;
              return (
                <div
                  key={table.id}
                  onPointerDown={() => handlePointerDown(table.id)}
                  style={{ left: `${table.pos_x}%`, top: `${table.pos_y}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full flex flex-col items-center justify-center text-xs cursor-grab active:cursor-grabbing select-none border-2 ${
                    selectedTableId === table.id
                      ? 'border-black bg-white'
                      : over
                        ? 'border-red-400 bg-red-50'
                        : 'border-gray-400 bg-white'
                  }`}
                >
                  <span className="font-semibold truncate max-w-[3.5rem]">{table.name}</span>
                  <span className="text-gray-500">
                    {count}/{table.capacity}
                  </span>
                </div>
              );
            })}
          </div>

          {!selectedTable && unassigned.length > 0 && (
            <div className="border border-gray-200 rounded p-4 mb-4">
              <h2 className="font-semibold mb-2 text-sm">
                Гости без стола ({unassigned.length})
              </h2>
              <p className="text-xs text-gray-500 mb-2">Нажми на стол на схеме, чтобы назначить</p>
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
