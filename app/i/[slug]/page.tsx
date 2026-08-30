import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { SiteConfig } from '@/lib/types';
import Countdown from '@/components/Countdown';
import InvitationRSVPForm from './InvitationRSVPForm';

// Продукт №2: Digital Wedding Invitation. Одна мобильная страница
// на короткой ссылке /i/[slug]. Никакой отдельной инфраструктуры —
// те же site_config, та же rsvp_responses, та же Theme System
// (тема наследуется от <html data-theme> в app/layout.tsx, здесь
// её не нужно подключать заново).
export const dynamic = 'force-dynamic';

async function getConfigForSlug(slug: string): Promise<SiteConfig | null> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from('site_config')
      .select('*')
      .eq('id', 1)
      .single();
    const config = data as SiteConfig | null;
    // Приглашение доступно только если явно включено в админке И
    // запрошенный slug совпадает с сохранённым — иначе страница не
    // существует. Это не мультитенантность: конфиг всегда один и
    // тот же (id=1), slug — просто ключ доступа к этой единственной
    // странице, а не идентификатор записи среди многих.
    if (!config?.invitation_enabled || !config.invitation_slug) return null;
    if (config.invitation_slug !== slug) return null;
    return config;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const config = await getConfigForSlug(params.slug);
  if (!config) {
    return { title: 'Приглашение' };
  }
  const title = `${config.bride_name} & ${config.groom_name}`;
  const description = config.intro_text;
  return {
    title,
    description,
    openGraph: {
      type: 'website',
      title,
      description,
      ...(config.cover_photo_url ? { images: [config.cover_photo_url] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(config.cover_photo_url ? { images: [config.cover_photo_url] } : {}),
    },
  };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

// Google Calendar "render" ссылка — без сторонних зависимостей и
// без генерации .ics-файла. Длительность события не хранится в
// site_config (в минимальном наборе полей её нет), поэтому берём
// разумный дефолт — 3 часа.
function calendarUrl(config: SiteConfig) {
  const start = new Date(config.wedding_date);
  const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Свадьба ${config.bride_name} & ${config.groom_name}`,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: config.intro_text || '',
    location: [config.venue_name, config.venue_address].filter(Boolean).join(', '),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function mapUrl(config: SiteConfig) {
  return `https://www.google.com/maps/search/?api=1&query=${config.venue_lat},${config.venue_lng}`;
}

export default async function InvitationPage({ params }: { params: { slug: string } }) {
  const config = await getConfigForSlug(params.slug);
  if (!config) notFound();

  return (
    <main
      className="min-h-screen"
      style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-ink)' }}
    >
      <section
        className="min-h-[85vh] flex items-center justify-center text-center px-6 py-16"
        style={
          config.cover_photo_url
            ? {
                backgroundImage: `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url(${config.cover_photo_url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                color: '#fff',
                textShadow: '0 1px 6px rgba(0,0,0,0.55)',
              }
            : undefined
        }
      >
        <div>
          <h1 className="font-display text-4xl md:text-6xl leading-tight mb-4">
            {config.bride_name}
            <span className="mx-3" style={config.cover_photo_url ? undefined : { color: 'var(--color-accent)' }}>
              &
            </span>
            {config.groom_name}
          </h1>
          <p className="text-lg mb-6">{formatDate(config.wedding_date)}</p>
          {config.intro_text && <p className="max-w-sm mx-auto opacity-90 mb-8">{config.intro_text}</p>}
          <Countdown weddingDate={config.wedding_date} onPhoto={Boolean(config.cover_photo_url)} />
        </div>
      </section>

      <section className="max-w-md mx-auto px-6 py-12 space-y-12">
        <div className="text-center">
          <h2 className="font-display text-2xl mb-3">Место</h2>
          <p className="font-display text-xl">{config.venue_name}</p>
          {config.venue_address && <p className="opacity-75 mt-1 mb-4">{config.venue_address}</p>}
          <a
            href={mapUrl(config)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block border rounded px-5 py-2 text-sm"
            style={{ borderColor: 'var(--color-line)' }}
          >
            Открыть на карте
          </a>
        </div>

        <div className="text-center">
          <h2 className="font-display text-2xl mb-3">Дата и время</h2>
          <p>{formatDate(config.wedding_date)}</p>
          <p className="opacity-75 mb-4">Начало в {formatTime(config.wedding_date)}</p>
          <a
            href={calendarUrl(config)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block border rounded px-5 py-2 text-sm"
            style={{ borderColor: 'var(--color-line)' }}
          >
            Добавить в календарь
          </a>
        </div>

        <div>
          <h2 className="font-display text-2xl mb-4 text-center">RSVP</h2>
          <InvitationRSVPForm />
        </div>
      </section>
    </main>
  );
}
