'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface FieldDef {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'date';
}

interface Props {
  table: string;
  title: string;
  itemNoun: string; // например "событие", "гостиницу"
  fields: FieldDef[];
}

type Row = Record<string, any>;

export default function ListEditor({ table, title, itemNoun, fields }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Row>({});

  async function load() {
    const supabase = createClient();
    const { data } = await supabase.from(table).select('*').order('sort_order');
    setRows(data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);

  async function addRow() {
    const supabase = createClient();
    await supabase.from(table).insert({ ...draft, sort_order: rows.length });
    setDraft({});
    load();
  }

  async function updateRow(id: string, key: string, value: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
  }

  async function saveRow(id: string) {
    const row = rows.find((r) => r.id === id);
    if (!row) return;
    const supabase = createClient();
    const payload: Row = {};
    fields.forEach((f) => (payload[f.key] = row[f.key]));
    await supabase.from(table).update(payload).eq('id', id);
  }

  async function deleteRow(id: string) {
    const supabase = createClient();
    await supabase.from(table).delete().eq('id', id);
    load();
  }

  async function move(id: string, direction: -1 | 1) {
    const index = rows.findIndex((r) => r.id === id);
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= rows.length) return;
    const supabase = createClient();
    const a = rows[index];
    const b = rows[swapIndex];
    await Promise.all([
      supabase.from(table).update({ sort_order: swapIndex }).eq('id', a.id),
      supabase.from(table).update({ sort_order: index }).eq('id', b.id),
    ]);
    load();
  }

  function renderInput(
    field: FieldDef,
    value: string,
    onChange: (v: string) => void
  ) {
    if (field.type === 'textarea') {
      return (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.label}
          rows={2}
          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
        />
      );
    }
    return (
      <input
        type={field.type === 'date' ? 'date' : 'text'}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.label}
        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
      />
    );
  }

  return (
    <div className="border border-gray-200 rounded p-4 mb-8">
      <h2 className="font-semibold mb-3">{title}</h2>

      {loading ? (
        <p className="text-sm text-gray-500">Загрузка…</p>
      ) : (
        <div className="space-y-3 mb-4">
          {rows.map((row) => (
            <div key={row.id} className="border border-gray-100 rounded p-3">
              <div className="grid gap-2">
                {fields.map((f) => (
                  <div key={f.key}>
                    <label className="text-xs text-gray-500">{f.label}</label>
                    {renderInput(f, row[f.key], (v) => updateRow(row.id, f.key, v))}
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-2 text-xs">
                <button onClick={() => saveRow(row.id)} className="underline">
                  Сохранить
                </button>
                <button onClick={() => move(row.id, -1)} className="underline">
                  Выше
                </button>
                <button onClick={() => move(row.id, 1)} className="underline">
                  Ниже
                </button>
                <button onClick={() => deleteRow(row.id)} className="underline text-red-600">
                  Удалить
                </button>
              </div>
            </div>
          ))}
          {rows.length === 0 && (
            <p className="text-sm text-gray-400">Пока пусто.</p>
          )}
        </div>
      )}

      <div className="border-t border-gray-200 pt-3">
        <p className="text-xs text-gray-500 mb-2">Добавить {itemNoun}:</p>
        <div className="grid gap-2 mb-2">
          {fields.map((f) => (
            <div key={f.key}>
              {renderInput(f, draft[f.key], (v) => setDraft((d) => ({ ...d, [f.key]: v })))}
            </div>
          ))}
        </div>
        <button
          onClick={addRow}
          className="text-sm border border-gray-300 rounded px-3 py-1.5"
        >
          Добавить
        </button>
      </div>
    </div>
  );
}
