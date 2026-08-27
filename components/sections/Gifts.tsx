import type { GiftRegistryItem } from '@/lib/types';

export default function Gifts({ items }: { items: GiftRegistryItem[] }) {
  if (items.length === 0) return null;

  return (
    <section id="gifts" className="section" style={{ backgroundColor: 'var(--color-surface)' }}>
      <div className="section-inner">
        <h2 className="font-display text-3xl md:text-4xl text-center mb-14">Подарки</h2>
        <div className="space-y-6">
          {items.map((item) => (
            <div key={item.id} className="text-center">
              <h3 className="font-display text-lg">{item.title}</h3>
              {item.description && <p className="opacity-75 mt-1 whitespace-pre-line">{item.description}</p>}
              {item.link && (
                <a
                  href={item.link}
                  className="text-sm underline mt-2 inline-block"
                  style={{ color: 'var(--color-accent)' }}
                >
                  Подробнее
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
