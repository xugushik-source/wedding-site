import { createClient } from '@/lib/supabase/server';
import Navigation from '@/components/Navigation';
import Hero from '@/components/sections/Hero';
import Story from '@/components/sections/Story';
import Program from '@/components/sections/Program';
import Venue from '@/components/sections/Venue';
import DressCode from '@/components/sections/DressCode';
import RSVPForm from '@/components/sections/RSVPForm';
import Hotels from '@/components/sections/Hotels';
import Transport from '@/components/sections/Transport';
import Gallery from '@/components/sections/Gallery';
import GuestPhotos from '@/components/sections/GuestPhotos';
import Gifts from '@/components/sections/Gifts';
import Contacts from '@/components/sections/Contacts';
import type {
  SiteConfig,
  StoryEvent,
  ProgramItem,
  Hotel,
  TransportOption,
  GalleryPhoto,
  GiftRegistryItem,
} from '@/lib/types';

// Страница рендерится на сервере при каждом запросе, чтобы
// изменения из админки сразу были видны гостям.
export const dynamic = 'force-dynamic';

const FALLBACK_CONFIG: SiteConfig = {
  id: 1,
  groom_name: 'Жених',
  bride_name: 'Невеста',
  wedding_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180).toISOString(),
  cover_photo_url: null,
  intro_text: 'Настройте сайт в /admin — подключите Supabase, чтобы данные сохранялись',
  venue_name: 'Место проведения',
  venue_address: '',
  venue_lat: 55.751244,
  venue_lng: 37.618423,
  dress_code: 'Нарядный casual',
  contact_phone: '',
  contact_email: '',
  guest_photos_url: null,
  guest_photos_text: 'Есть свои фотографии со свадьбы? Поделитесь ими — соберём все воспоминания в одном месте.',
  active_theme: 'classic',
};

export default async function HomePage() {
  // Всё оборачиваем в try/catch: если переменные окружения Supabase
  // не заданы или неверны (например, сайт только что залили в
  // репозиторий/задеплоили, но забыли настроить .env), createClient()
  // падает сразу, синхронно — до того как отработает .catch() у
  // Promise.all ниже. Без этой обёртки вся страница отдавала 500
  // вместо того чтобы показать заглушку с понятной подсказкой.
  let config: unknown = null;
  let story: unknown = null;
  let program: unknown = null;
  let hotels: unknown = null;
  let transport: unknown = null;
  let gallery: unknown = null;
  let gifts: unknown = null;

  try {
    const supabase = createClient();
    const results = await Promise.all([
      supabase.from('site_config').select('*').eq('id', 1).single(),
      supabase.from('story_events').select('*').order('sort_order'),
      supabase.from('program_items').select('*').order('sort_order'),
      supabase.from('hotels').select('*').order('sort_order'),
      supabase.from('transport_options').select('*').order('sort_order'),
      supabase.from('gallery_photos').select('*').order('sort_order'),
      supabase.from('gift_registry').select('*').order('sort_order'),
    ]);
    [
      { data: config },
      { data: story },
      { data: program },
      { data: hotels },
      { data: transport },
      { data: gallery },
      { data: gifts },
    ] = results;
  } catch {
    // Supabase не настроен или недоступен — ниже используются
    // значения по умолчанию, сайт всё равно откроется.
  }

  const siteConfig = (config as SiteConfig) || FALLBACK_CONFIG;

  return (
    <>
      <Navigation />
      <Hero config={siteConfig} />
      <Story events={(story as StoryEvent[]) || []} />
      <Program items={(program as ProgramItem[]) || []} />
      <Venue config={siteConfig} />
      <DressCode config={siteConfig} />
      <RSVPForm />
      <Hotels hotels={(hotels as Hotel[]) || []} />
      <Transport options={(transport as TransportOption[]) || []} />
      <Gallery photos={(gallery as GalleryPhoto[]) || []} />
      <GuestPhotos config={siteConfig} />
      <Gifts items={(gifts as GiftRegistryItem[]) || []} />
      <Contacts config={siteConfig} />
    </>
  );
}
