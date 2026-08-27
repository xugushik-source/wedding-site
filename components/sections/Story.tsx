import Image from 'next/image';
import type { StoryEvent } from '@/lib/types';

export default function Story({ events }: { events: StoryEvent[] }) {
  if (events.length === 0) return null;

  return (
    <section id="story" className="section" style={{ backgroundColor: 'var(--color-surface)' }}>
      <div className="section-inner">
        <h2 className="font-display text-3xl md:text-4xl text-center mb-14">Наша история</h2>
        <div className="space-y-12">
          {events.map((event, i) => (
            <div key={event.id} className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex-shrink-0 w-full md:w-40">
                {event.event_date && (
                  <p className="text-sm uppercase tracking-wide opacity-60">
                    {new Date(event.event_date).toLocaleDateString('ru-RU', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                )}
                <p className="font-display text-2xl" style={{ color: 'var(--color-accent)' }}>
                  {String(i + 1).padStart(2, '0')}
                </p>
              </div>
              <div className="flex-1">
                <h3 className="font-display text-xl mb-2">{event.title}</h3>
                {event.description && <p className="opacity-80 leading-relaxed">{event.description}</p>}
                {event.photo_url && (
                  <div className="relative w-full max-w-sm h-56 mt-4 rounded overflow-hidden">
                    <Image src={event.photo_url} alt={event.title} fill className="object-cover" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
