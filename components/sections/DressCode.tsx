import type { SiteConfig } from '@/lib/types';

export default function DressCode({ config }: { config: SiteConfig }) {
  return (
    <section id="dresscode" className="section">
      <div className="section-inner text-center">
        <h2 className="font-display text-3xl md:text-4xl mb-6">Дресс-код</h2>
        <p className="opacity-80 leading-relaxed max-w-md mx-auto">{config.dress_code}</p>
      </div>
    </section>
  );
}
