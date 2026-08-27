import type { TransportOption } from '@/lib/types';

export default function Transport({ options }: { options: TransportOption[] }) {
  if (options.length === 0) return null;

  return (
    <section id="transport" className="section" style={{ backgroundColor: 'var(--color-surface)' }}>
      <div className="section-inner">
        <h2 className="font-display text-3xl md:text-4xl text-center mb-14">Как добраться</h2>
        <div className="space-y-6">
          {options.map((option) => (
            <div key={option.id}>
              <h3 className="font-display text-lg">{option.title}</h3>
              {option.description && <p className="opacity-75 mt-1 whitespace-pre-line">{option.description}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
