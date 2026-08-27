import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function AdminOverview() {
  const supabase = createClient();

  const [{ count: totalRsvp }, { count: attendingCount }] = await Promise.all([
    supabase.from('rsvp_responses').select('*', { count: 'exact', head: true }),
    supabase
      .from('rsvp_responses')
      .select('*', { count: 'exact', head: true })
      .eq('attending', true),
  ]);

  const cards = [
    { label: 'Всего ответов RSVP', value: totalRsvp ?? 0 },
    { label: 'Подтвердили присутствие', value: attendingCount ?? 0 },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Обзор</h1>
      <div className="grid grid-cols-2 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="border border-gray-200 rounded p-4">
            <p className="text-3xl font-semibold">{card.value}</p>
            <p className="text-sm text-gray-600 mt-1">{card.label}</p>
          </div>
        ))}
      </div>
      <div className="space-y-2 text-sm">
        <Link href="/admin/content" className="block underline">
          Редактировать тексты, программу, историю, гостиницы, транспорт, подарки →
        </Link>
        <Link href="/admin/gallery" className="block underline">
          Загрузить и упорядочить фотографии →
        </Link>
        <Link href="/admin/rsvp" className="block underline">
          Посмотреть и выгрузить список гостей →
        </Link>
        <Link href="/admin/theme" className="block underline">
          Сменить визуальную тему сайта →
        </Link>
      </div>
    </div>
  );
}
