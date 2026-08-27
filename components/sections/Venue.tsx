import type { SiteConfig } from '@/lib/types';

export default function Venue({ config }: { config: SiteConfig }) {
  const { venue_lat: lat, venue_lng: lng } = config;
  const delta = 0.01;
  const bbox = `${lng - delta}%2C${lat - delta}%2C${lng + delta}%2C${lat + delta}`;
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&marker=${lat}%2C${lng}&layer=mapnik`;

  return (
    <section id="venue" className="section" style={{ backgroundColor: 'var(--color-surface)' }}>
      <div className="section-inner">
        <h2 className="font-display text-3xl md:text-4xl text-center mb-10">Место проведения</h2>
        <div className="text-center mb-8">
          <p className="font-display text-2xl">{config.venue_name}</p>
          {config.venue_address && <p className="opacity-75 mt-1">{config.venue_address}</p>}
        </div>
        <div className="w-full h-80 rounded overflow-hidden border" style={{ borderColor: 'var(--color-line)' }}>
          <iframe
            title="Карта места проведения"
            src={mapSrc}
            className="w-full h-full"
            loading="lazy"
          />
        </div>
        <p className="text-xs opacity-60 mt-2 text-center">
          Карта: © участники{' '}
          <a href="https://www.openstreetmap.org/copyright" className="underline">
            OpenStreetMap
          </a>
          . Координаты и адрес редактируются в админке.
        </p>
      </div>
    </section>
  );
}
