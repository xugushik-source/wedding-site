import Image from 'next/image';
import Countdown from '@/components/Countdown';
import type { SiteConfig } from '@/lib/types';

export default function Hero({ config }: { config: SiteConfig }) {
  const date = new Date(config.wedding_date);
  const formattedDate = date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <section id="top" className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {config.cover_photo_url && (
        <>
          <Image
            src={config.cover_photo_url}
            alt=""
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0" style={{ backgroundColor: 'color-mix(in srgb, var(--color-ink) 45%, transparent)' }} />
        </>
      )}
      <div
        className="relative z-10 text-center px-6"
        style={config.cover_photo_url ? { color: '#fff' } : undefined}
      >
        <p className="uppercase tracking-[0.3em] text-xs md:text-sm mb-4 opacity-80">
          Мы приглашаем вас на нашу свадьбу
        </p>
        <h1 className="font-display text-5xl md:text-7xl leading-tight">
          {config.bride_name}
          <span className="mx-3 md:mx-5" style={{ color: 'var(--color-accent)' }}>
            &
          </span>
          {config.groom_name}
        </h1>
        <p className="mt-4 text-lg md:text-xl">{formattedDate}</p>
        <div className="mt-10">
          <Countdown weddingDate={config.wedding_date} />
        </div>
        {config.intro_text && (
          <p className="mt-10 max-w-lg mx-auto text-sm md:text-base opacity-90">
            {config.intro_text}
          </p>
        )}
      </div>
    </section>
  );
}
