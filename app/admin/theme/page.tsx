'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { THEMES, type ThemeId } from '@/lib/themes';

export default function ThemePage() {
  const [current, setCurrent] = useState<ThemeId | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('site_config')
      .select('active_theme')
      .eq('id', 1)
      .single()
      .then(({ data }) => setCurrent((data?.active_theme as ThemeId) || 'classic'));
  }, []);

  async function selectTheme(id: ThemeId) {
    setSaving(true);
    setSaved(false);
    const supabase = createClient();
    await supabase.from('site_config').update({ active_theme: id }).eq('id', 1);
    setCurrent(id);
    setSaving(false);
    setSaved(true);
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">Тема оформления</h1>
      <p className="text-sm text-gray-600 mb-6">
        Меняется мгновенно на живом сайте — код переписывать не нужно. Полезно, если
        этот шаблон используется повторно для разных пар с разным стилем.
      </p>
      <div className="space-y-3">
        {THEMES.map((theme) => (
          <button
            key={theme.id}
            onClick={() => selectTheme(theme.id)}
            disabled={saving}
            className={`w-full text-left border rounded p-4 transition-colors ${
              current === theme.id ? 'border-black bg-gray-50' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold">{theme.label}</span>
              {current === theme.id && <span className="text-xs">✓ активна</span>}
            </div>
            <p className="text-sm text-gray-600 mt-1">{theme.description}</p>
          </button>
        ))}
      </div>
      {saved && <p className="text-sm text-green-700 mt-4">Тема сохранена.</p>}
    </div>
  );
}
