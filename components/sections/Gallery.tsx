import Image from 'next/image';
import type { GalleryPhoto } from '@/lib/types';

export default function Gallery({ photos }: { photos: GalleryPhoto[] }) {
  if (photos.length === 0) return null;

  return (
    <section id="gallery" className="section">
      <div className="section-inner">
        <h2 className="font-display text-3xl md:text-4xl text-center mb-14">Фотографии</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {photos.map((photo) => (
            <div key={photo.id} className="relative aspect-square rounded overflow-hidden">
              <Image
                src={photo.photo_url}
                alt={photo.caption || ''}
                fill
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
