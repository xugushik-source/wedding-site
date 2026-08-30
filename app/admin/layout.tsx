import Link from 'next/link';
import LogoutButton from './LogoutButton';

const ADMIN_LINKS = [
  { href: '/admin', label: 'Обзор' },
  { href: '/admin/content', label: 'Контент' },
  { href: '/admin/gallery', label: 'Фотографии' },
  { href: '/admin/rsvp', label: 'Ответы гостей' },
  { href: '/admin/seating', label: 'Рассадка' },
  { href: '/admin/theme', label: 'Тема оформления' },
  { href: '/admin/modules', label: 'Модули' },
  { href: '/admin/invitation', label: 'Digital Invitation' },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white text-black">
      <div className="border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex gap-5 text-sm">
          {ADMIN_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:underline">
              {link.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <Link href="/" className="hover:underline">
            Открыть сайт →
          </Link>
          <LogoutButton />
        </div>
      </div>
      <main className="p-6 max-w-3xl">{children}</main>
    </div>
  );
}
