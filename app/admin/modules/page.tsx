'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MODULES, DEFAULT_MODULES, type EnabledModules, type ModuleId } from '@/lib/modules';

export default function ModulesPage() {
  const [modules, setModules] = useState<EnabledModules | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('site_config')
      .select('enabled_modules')
      .eq('id', 1)
      .single()
      .then(({ data }) =>
        setModules((data?.enabled_modules as EnabledModules) || DEFAULT_MODULES)
      );
  }, []);

  // guestBook — зарезервированный модуль без компонента (см. lib/modules.ts),
  // переключатель для него отключён на уровне UI (disabled в JSX ниже);
  // эта проверка — дополнительная защита на уровне логики.
  function toggle(id: ModuleId) {
    if (id === 'guestBook') return;
    setModules((m) => (m ? { ...m, [id]: !m[id] } : m));
  }

  async function handleSave() {
    if (!modules) return;
    setSaving(true);
    setSaved(false);
    const supabase = createClient();
    await supabase.from('site_config').update({ enabled_modules: modules }).eq('id', 1);
    setSaving(false);
    setSaved(true);
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">Модули</h1>
      <p className="text-sm text-gray-600 mb-6">
        Включённые модули видны на публичном сайте и в меню сразу после
        сохранения — без пересборки и деплоя, так же как смена темы.
        Этот переключатель только показывает или прячет уже существующие
        разделы сайта, сами разделы им не создаются и не удаляются.
      </p>

      {!modules ? (
        <p className="text-sm text-gray-500">Загрузка…</p>
      ) : (
        <div className="border border-gray-200 rounded p-2 mb-6">
          {MODULES.map((mod) => {
            const isGuestBook = mod.id === 'guestBook';
            return (
              <label
                key={mod.id}
                className={`flex items-center justify-between gap-3 py-2 px-2 rounded ${
                  isGuestBook ? 'opacity-50' : 'hover:bg-gray-50 cursor-pointer'
                }`}
              >
                <span className="text-sm">
                  {mod.label}
                  {isGuestBook && (
                    <span className="ml-2 text-xs text-gray-400">(не реализовано)</span>
                  )}
                </span>
                <input
                  type="checkbox"
                  checked={modules[mod.id]}
                  disabled={isGuestBook || saving}
                  onChange={() => toggle(mod.id)}
                />
              </label>
            );
          })}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={!modules || saving}
        className="text-sm border border-gray-300 rounded px-4 py-2 disabled:opacity-50"
      >
        {saving ? 'Сохраняем…' : 'Сохранить'}
      </button>
      {saved && <span className="ml-3 text-sm text-green-700">Сохранено</span>}
    </div>
  );
}
