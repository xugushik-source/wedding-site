'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { GalleryPhoto } from '@/lib/types';

// Модальное окно выбора уже загруженной фотографии. Читает
// существующую таблицу gallery_photos (те же данные, что показаны
// на /admin/gallery) — не загружает новые файлы, не создаёт новых
// записей, не меняет Storage. Единственная задача — вернуть URL
// уже существующего фото через onSelect, чтобы не копировать его
// вручную.
export default function PhotoPicker({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}) {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const supabase = createClient();
    supabase
      .from('gallery_photos')
      .select('*')
      .order('sort_order')
      .then(({ data }) => {
        setPhotos((data as GalleryPhoto[]) || []);
        setLoading(false);
      });
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded max-w-2xl w-full max-h-[80vh] overflow-y-auto p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Выбрать фото из галереи</h2>
          <button onClick={onClose} className="text-sm text-gray-500 underline">
            Закрыть
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Загрузка…</p>
        ) : photos.length === 0 ? (
          <p className="text-sm text-gray-400">
            В галерее пока нет фотографий. Сначала загрузите их на вкладке
            «Фотографии».
          </p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {photos.map((photo) => (
              <button
                key={photo.id}
                type="button"
                onClick={() => {
                  onSelect(photo.photo_url);
                  onClose();
                }}
                className="aspect-square rounded overflow-hidden border border-gray-200 hover:border-black transition-colors"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.photo_url}
                  alt={photo.caption || ''}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
