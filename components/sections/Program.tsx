import type { ProgramItem } from '@/lib/types';

export default function Program({ items }: { items: ProgramItem[] }) {
  if (items.length === 0) return null;

  return (
    <section id="program" className="section">
      <div className="section-inner">
        <h2 className="font-display text-3xl md:text-4xl text-center mb-14">Программа дня</h2>
        <ol className="space-y-6">
          {items.map((item) => (
            <li key={item.id} className="flex gap-6 border-b pb-6" style={{ borderColor: 'var(--color-line)' }}>
              <div className="font-display text-xl w-20 flex-shrink-0" style={{ color: 'var(--color-accent)' }}>
                {item.time_label}
              </div>
              <div>
                <h3 className="font-display text-lg">{item.title}</h3>
                {item.description && <p className="opacity-75 text-sm mt-1">{item.description}</p>}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
