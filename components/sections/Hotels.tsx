import type { Hotel } from '@/lib/types';

export default function Hotels({ hotels }: { hotels: Hotel[] }) {
  if (hotels.length === 0) return null;

  return (
    <section id="hotels" className="section">
      <div className="section-inner">
        <h2 className="font-display text-3xl md:text-4xl text-center mb-14">Где остановиться</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {hotels.map((hotel) => (
            <div key={hotel.id} className="border rounded p-5" style={{ borderColor: 'var(--color-line)' }}>
              <h3 className="font-display text-lg">{hotel.name}</h3>
              {hotel.address && <p className="text-sm opacity-75 mt-1">{hotel.address}</p>}
              {hotel.phone && <p className="text-sm opacity-75">{hotel.phone}</p>}
              {hotel.notes && <p className="text-sm opacity-75 mt-2 whitespace-pre-line">{hotel.notes}</p>}
              {hotel.website && (
                <a
                  href={hotel.website}
                  className="text-sm underline mt-2 inline-block"
                  style={{ color: 'var(--color-accent)' }}
                >
                  Сайт отеля
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
