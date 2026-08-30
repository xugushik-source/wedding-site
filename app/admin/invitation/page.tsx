'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export default function InvitationAdminPage() {
  const [enabled, setEnabled] = useState(false);
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [slugError, setSlugError] = useState('');
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
    const supabase = createClient();
    supabase
      .from('site_config')
      .select('invitation_enabled, invitation_slug')
      .eq('id', 1)
      .single()
      .then(({ data }) => {
        setEnabled(Boolean(data?.invitation_enabled));
        setSlug(data?.invitation_slug || '');
        setLoading(false);
      });
  }, []);

  function handleSlugChange(value: string) {
    setSlug(value);
    if (value && !SLUG_PATTERN.test(value)) {
      setSlugError('Только латинские буквы, цифры и дефис, без пробелов');
    } else {
      setSlugError('');
    }
  }

  async function handleSave() {
    if (enabled && (!slug || slugError)) {
      setSlugError(slug ? slugError : 'Укажите short link, чтобы включить приглашение');
      return;
    }
    setSaving(true);
    setSaved(false);
    const supabase = createClient();
    await supabase
      .from('site_config')
      .update({ invitation_enabled: enabled, invitation_slug: slug || null })
      .eq('id', 1);
    setSaving(false);
    setSaved(true);
  }

  const link = slug ? `${origin}/i/${slug}` : '';

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">Digital Invitation</h1>
      <p className="text-sm text-gray-600 mb-6">
        Короткая ссылка-приглашение на отдельной мобильной странице. Использует
        те же имена, дату, место и фото обложки, что уже заполнены на вкладке
        «Контент» — здесь только включение и short link.
      </p>

      {loading ? (
        <p className="text-sm text-gray-500">Загрузка…</p>
      ) : (
        <div className="space-y-4 max-w-md">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
            <span className="text-sm">Включить приглашение</span>
          </label>

          <div>
            <label htmlFor="slug" className="block text-sm mb-1">
              Short link
            </label>
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-500 whitespace-nowrap">/i/</span>
              <input
                id="slug"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value.toLowerCase())}
                placeholder="anna-artur"
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              />
            </div>
            {slugError && <p className="text-xs text-red-600 mt-1">{slugError}</p>}
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="text-sm border border-gray-300 rounded px-4 py-2 disabled:opacity-50"
          >
            {saving ? 'Сохраняем…' : 'Сохранить'}
          </button>
          {saved && <span className="ml-3 text-sm text-green-700">Сохранено</span>}

          {slug && !slugError && (
            <div className="border border-gray-200 rounded p-4 mt-2 space-y-3">
              <p className="text-sm break-all">{link}</p>
              <div className="flex flex-wrap gap-2">
                <a
                  href={`/i/${slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs border border-gray-300 rounded px-3 py-1.5"
                >
                  Открыть приглашение
                </a>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(link)}
                  className="text-xs border border-gray-300 rounded px-3 py-1.5"
                >
                  Копировать ссылку
                </button>
              </div>
              {origin && (
                <div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(link)}`}
                    alt="QR-код на приглашение"
                    width={160}
                    height={160}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    QR ведёт на ту же ссылку — можно распечатать для гостей
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
