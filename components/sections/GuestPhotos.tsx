import type { SiteConfig } from '@/lib/types';

// Показывается только если пара указала ссылку в админке —
// пустой блок не рендерится. Сама папка (Google Диск, Google Фото,
// Яндекс.Диск — что угодно) создаётся и настраивается на доступ
// «по ссылке» парой самостоятельно, сайт лишь на неё ссылается.
export default function GuestPhotos({ config }: { config: SiteConfig }) {
  if (!config.guest_photos_url) return null;

  return (
    <section id="guest-photos" className="section">
      <div className="section-inner text-center">
        <h2 className="font-display text-3xl md:text-4xl mb-6">Ваши фотографии</h2>
        <p className="opacity-80 leading-relaxed max-w-md mx-auto mb-6 whitespace-pre-line">
          {config.guest_photos_text}
        </p>
        <a
          href={config.guest_photos_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-6 py-3 rounded font-display text-lg"
          style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-bg)' }}
        >
          Загрузить фото
        </a>
      </div>
    </section>
  );
}
