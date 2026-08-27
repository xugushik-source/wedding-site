'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';

const LINKS = [
  { href: '#story', label: 'История' },
  { href: '#program', label: 'Программа' },
  { href: '#venue', label: 'Место' },
  { href: '#dresscode', label: 'Дресс-код' },
  { href: '#rsvp', label: 'RSVP' },
  { href: '#seating', label: 'Рассадка' },
  { href: '#hotels', label: 'Гостиницы' },
  { href: '#gallery', label: 'Фото' },
  { href: '#guest-photos', label: 'Ваши фото' },
  { href: '#gifts', label: 'Подарки' },
  { href: '#contacts', label: 'Контакты' },
];

export default function Navigation() {
  const [open, setOpen] = useState(false);

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
          {LINKS.map((link) => (
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
          {LINKS.map((link) => (
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
