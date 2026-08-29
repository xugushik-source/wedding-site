'use client';

import { useEffect, useState, FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { SiteConfig } from '@/lib/types';
import ListEditor from './ListEditor';
import PhotoPicker from '../PhotoPicker';

export default function ContentPage() {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [saved, setSaved] = useState(false);
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('site_config')
      .select('*')
      .eq('id', 1)
      .single()
      .then(({ data }) => setConfig(data as SiteConfig));
  }, []);

  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!config) return;
    const supabase = createClient();
    const { id, ...payload } = config;
    await supabase.from('site_config').update(payload).eq('id', 1);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function field<K extends keyof SiteConfig>(key: K, value: SiteConfig[K]) {
    setConfig((c) => (c ? { ...c, [key]: value } : c));
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Контент сайта</h1>

      {config && (
        <form onSubmit={handleSave} className="border border-gray-200 rounded p-4 mb-8 space-y-3">
          <h2 className="font-semibold mb-1">Основное</h2>

          <Row label="Имя невесты">
            <input
              className="input"
              value={config.bride_name}
              onChange={(e) => field('bride_name', e.target.value)}
            />
          </Row>
          <Row label="Имя жениха">
            <input
              className="input"
              value={config.groom_name}
              onChange={(e) => field('groom_name', e.target.value)}
            />
          </Row>
          <Row label="Дата и время свадьбы">
            <input
              type="datetime-local"
              className="input"
              value={config.wedding_date?.slice(0, 16) || ''}
              onChange={(e) => field('wedding_date', new Date(e.target.value).toISOString())}
            />
          </Row>
          <Row label="Ссылка на фото обложки (URL)">
            <div className="flex gap-2">
              <input
                className="input"
                value={config.cover_photo_url || ''}
                onChange={(e) => field('cover_photo_url', e.target.value)}
                placeholder="Загрузите фото на вкладке «Фотографии» и вставьте ссылку сюда"
              />
              <button
                type="button"
                onClick={() => setCoverPickerOpen(true)}
                className="text-xs border border-gray-300 rounded px-3 whitespace-nowrap"
              >
                Выбрать фото
              </button>
            </div>
          </Row>
          <Row label="Приветственный текст">
            <textarea
              className="input"
              rows={2}
              value={config.intro_text}
              onChange={(e) => field('intro_text', e.target.value)}
            />
          </Row>
          <Row label="Название места проведения">
            <input
              className="input"
              value={config.venue_name}
              onChange={(e) => field('venue_name', e.target.value)}
            />
          </Row>
          <Row label="Адрес места проведения">
            <input
              className="input"
              value={config.venue_address}
              onChange={(e) => field('venue_address', e.target.value)}
            />
          </Row>
          <Row label="Широта (latitude)">
            <input
              type="number"
              step="any"
              className="input"
              value={config.venue_lat}
              onChange={(e) => field('venue_lat', Number(e.target.value))}
            />
          </Row>
          <Row label="Долгота (longitude)">
            <input
              type="number"
              step="any"
              className="input"
              value={config.venue_lng}
              onChange={(e) => field('venue_lng', Number(e.target.value))}
            />
          </Row>
          <Row label="Дресс-код">
            <textarea
              className="input"
              rows={2}
              value={config.dress_code}
              onChange={(e) => field('dress_code', e.target.value)}
            />
          </Row>
          <Row label="Контактный телефон">
            <input
              className="input"
              value={config.contact_phone}
              onChange={(e) => field('contact_phone', e.target.value)}
            />
          </Row>
          <Row label="Контактный email">
            <input
              className="input"
              value={config.contact_email}
              onChange={(e) => field('contact_email', e.target.value)}
            />
          </Row>
          <Row label="Ссылка на папку для гостевых фото (Google Диск/Фото, необязательно)">
            <input
              className="input"
              value={config.guest_photos_url || ''}
              onChange={(e) => field('guest_photos_url', e.target.value)}
              placeholder="https://drive.google.com/... — оставьте пустым, чтобы блок не показывался"
            />
          </Row>
          <Row label="Текст приглашения поделиться фото">
            <textarea
              className="input"
              rows={2}
              value={config.guest_photos_text}
              onChange={(e) => field('guest_photos_text', e.target.value)}
            />
          </Row>

          <button type="submit" className="text-sm border border-gray-300 rounded px-4 py-2 mt-2">
            Сохранить основное
          </button>
          {saved && <span className="ml-3 text-sm text-green-700">Сохранено</span>}
        </form>
      )}

      <ListEditor
        table="story_events"
        title="История знакомства"
        itemNoun="событие"
        fields={[
          { key: 'event_date', label: 'Дата', type: 'date' },
          { key: 'title', label: 'Заголовок', type: 'text' },
          { key: 'description', label: 'Описание', type: 'textarea' },
          { key: 'photo_url', label: 'Ссылка на фото (необязательно)', type: 'photo' },
        ]}
      />

      <ListEditor
        table="program_items"
        title="Программа свадьбы"
        itemNoun="пункт программы"
        fields={[
          { key: 'time_label', label: 'Время (например 16:00)', type: 'text' },
          { key: 'title', label: 'Название', type: 'text' },
          { key: 'description', label: 'Описание', type: 'textarea' },
        ]}
      />

      <ListEditor
        table="hotels"
        title="Гостиницы"
        itemNoun="гостиницу"
        fields={[
          { key: 'name', label: 'Название', type: 'text' },
          { key: 'address', label: 'Адрес', type: 'text' },
          { key: 'phone', label: 'Телефон', type: 'text' },
          { key: 'website', label: 'Сайт (URL)', type: 'text' },
          { key: 'notes', label: 'Заметка', type: 'textarea' },
        ]}
      />

      <ListEditor
        table="transport_options"
        title="Транспорт"
        itemNoun="вариант транспорта"
        fields={[
          { key: 'title', label: 'Название', type: 'text' },
          { key: 'description', label: 'Описание', type: 'textarea' },
        ]}
      />

      <ListEditor
        table="gift_registry"
        title="Подарки"
        itemNoun="пункт"
        fields={[
          { key: 'title', label: 'Название', type: 'text' },
          { key: 'description', label: 'Описание', type: 'textarea' },
          { key: 'link', label: 'Ссылка (URL)', type: 'text' },
        ]}
      />

      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid #d1d5db;
          border-radius: 0.25rem;
          padding: 0.4rem 0.6rem;
          font-size: 0.875rem;
        }
      `}</style>

      <PhotoPicker
        open={coverPickerOpen}
        onClose={() => setCoverPickerOpen(false)}
        onSelect={(url) => field('cover_photo_url', url)}
      />
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  );
}
