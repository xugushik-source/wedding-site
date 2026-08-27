import type { SiteConfig } from '@/lib/types';

export default function Contacts({ config }: { config: SiteConfig }) {
  return (
    <section id="contacts" className="section">
      <div className="section-inner text-center">
        <h2 className="font-display text-3xl md:text-4xl mb-6">Контакты</h2>
        <p className="opacity-80">Если возникнут вопросы — пишите или звоните</p>
        <div className="mt-4 space-y-1">
          {config.contact_phone && <p>{config.contact_phone}</p>}
          {config.contact_email && <p>{config.contact_email}</p>}
        </div>
      </div>
    </section>
  );
}
