'use client';

import { useEffect, useState, ChangeEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { GalleryPhoto } from '@/lib/types';

const MAX_DIMENSION = 2000; // px по длинной стороне
const JPEG_QUALITY = 0.82;

// Сжимает фото в браузере перед загрузкой: уменьшает разрешение
// и пережимает в JPEG. Экономит место в Supabase Storage и ускоряет
// загрузку сайта — без потери заметного качества на экране.
async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') {
    return file; // gif (анимации) не трогаем
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY)
  );
  if (!blob) return file;

  const newName = file.name.replace(/\.[^.]+$/, '') + '.jpg';
  return new File([blob], newName, { type: 'image/jpeg' });
}

export default function GalleryAdminPage() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase.from('gallery_photos').select('*').order('sort_order');
    setPhotos((data as GalleryPhoto[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleUpload(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    const supabase = createClient();

    for (const rawFile of Array.from(files)) {
      const file = await compressImage(rawFile);
      const path = `${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('photos').upload(path, file);
      if (uploadError) continue;

      const { data: pub } = supabase.storage.from('photos').getPublicUrl(path);
      await supabase.from('gallery_photos').insert({
        photo_url: pub.publicUrl,
        sort_order: photos.length,
      });
    }

    setUploading(false);
    e.target.value = '';
    load();
  }

  async function handleDelete(photo: GalleryPhoto) {
    const supabase = createClient();
    await supabase.from('gallery_photos').delete().eq('id', photo.id);
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">Фотографии</h1>
      <p className="text-sm text-gray-600 mb-6">
        Загруженные фото сразу появляются в разделе «Фотографии» на сайте.
      </p>

      <label className="inline-block border border-gray-300 rounded px-4 py-2 text-sm cursor-pointer mb-6">
        {uploading ? 'Загружаем…' : 'Загрузить фото'}
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleUpload}
          disabled={uploading}
        />
      </label>

      {loading && <p className="text-sm text-gray-500">Загрузка…</p>}

      <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
        {photos.map((photo) => (
          <div key={photo.id} className="relative group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.photo_url}
              alt={photo.caption || ''}
              className="w-full aspect-square object-cover rounded"
            />
            <button
              onClick={() => handleDelete(photo)}
              className="absolute top-1 right-1 bg-black/70 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              Удалить
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
