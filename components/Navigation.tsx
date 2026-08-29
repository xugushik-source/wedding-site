'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import type { EnabledModules, ModuleId } from '@/lib/modules';

// Transport намеренно не входит сюда — модуль исключён из Module
// System по решению клиента, ссылки на него не было и раньше.
const NAV_LINKS: { module: ModuleId; href: string; label: string }[] = [
  { module: 'story', href: '#story', label: 'История' },
  { module: 'program', href: '#program', label: 'Программа' },
  { module: 'venue', href: '#venue', label: 'Место' },
  { module: 'dressCode', href: '#dresscode', label: 'Дресс-код' },
  { module: 'rsvp', href: '#rsvp', label: 'RSVP' },
  { module: 'seating', href: '#seating', label: 'Рассадка' },
  { module: 'hotels', href: '#hotels', label: 'Гостиницы' },
  { module: 'gallery', href: '#gallery', label: 'Фото' },
  { module: 'guestUploads', href: '#guest-photos', label: 'Ваши фото' },
  { module: 'gifts', href: '#gifts', label: 'Подарки' },
  { module: 'contacts', href: '#contacts', label: 'Контакты' },
];

export default function Navigation({ enabledModules }: { enabledModules: EnabledModules }) {
  const [open, setOpen] = useState(false);
  const links = NAV_LINKS.filter((link) => enabledModules[link.module]);

  return (
    <nav
      className="sticky top-0 z-40 backdrop-blur border-b"
      style={{ backgroundColor: 'color-mix(in srgb, var(--color-bg) 92%, transparent)', borderColor: 'var(--color-line)' }}
    >
      <div className="flex items-center justify-between px-5 py-3 md:px-8">
        <a href="#top" className="font-display text-lg tracking-wide">
          Мы женимся
        </a>
        <button
          className="md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
          aria-expanded={open}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
        <ul className="hidden md:flex gap-6 text-sm">
          {links.map((link) => (
            <li key={link.href}>
              <a href={link.href} className="hover:opacity-70 transition-opacity">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
      {open && (
        <ul className="md:hidden flex flex-col gap-1 px-5 pb-4 text-sm">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="block py-2"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}
