import { createClient } from '@/lib/supabase/server';
import Navigation from '@/components/Navigation';
import WishesPopup from '@/components/WishesPopup';
import Hero from '@/components/sections/Hero';
import Story from '@/components/sections/Story';
import Program from '@/components/sections/Program';
import Venue from '@/components/sections/Venue';
import DressCode from '@/components/sections/DressCode';
import RSVPForm from '@/components/sections/RSVPForm';
import Hotels from '@/components/sections/Hotels';
import Gallery from '@/components/sections/Gallery';
import GuestPhotos from '@/components/sections/GuestPhotos';
import SeatingChart from '@/components/sections/SeatingChart';
import Gifts from '@/components/sections/Gifts';
import Contacts from '@/components/sections/Contacts';
import type {
  SiteConfig,
  StoryEvent,
  ProgramItem,
  Hotel,
  GalleryPhoto,
  GiftRegistryItem,
  SeatingTable,
  SeatingGuest,
} from '@/lib/types';
import { DEFAULT_MODULES } from '@/lib/modules';

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
  enabled_modules: DEFAULT_MODULES,
  invitation_enabled: false,
  invitation_slug: null,
};

export default async function HomePage() {
  let config: unknown = null;
  let story: unknown = null;
  let program: unknown = null;
  let hotels: unknown = null;
  let gallery: unknown = null;
  let gifts: unknown = null;
  let seatingTables: unknown = null;
  let seatingGuests: unknown = null;

  try {
    const supabase = createClient();
    const results = await Promise.all([
      supabase.from('site_config').select('*').eq('id', 1).single(),
      supabase.from('story_events').select('*').order('sort_order'),
      supabase.from('program_items').select('*').order('sort_order'),
      supabase.from('hotels').select('*').order('sort_order'),
      supabase.from('gallery_photos').select('*').order('sort_order'),
      supabase.from('gift_registry').select('*').order('sort_order'),
      supabase.from('seating_tables').select('*').order('sort_order'),
      supabase.from('seating_guests').select('*').order('sort_order'),
    ]);
    [
      { data: config },
      { data: story },
      { data: program },
      { data: hotels },
      { data: gallery },
      { data: gifts },
      { data: seatingTables },
      { data: seatingGuests },
    ] = results;
  } catch {
    // Supabase не настроен или недоступен — ниже используются
    // значения по умолчанию, сайт всё равно откроется.
  }

  const siteConfig = (config as SiteConfig) || FALLBACK_CONFIG;
  // Module System: соответствует site_config.enabled_modules; если
  // колонки ещё нет на конкретном Supabase-проекте (старый деплой,
  // schema.sql не обновлён) — подставляется DEFAULT_MODULES,
  // воспроизводящий сегодняшнее поведение "всё включено".
  const modules = siteConfig.enabled_modules ?? DEFAULT_MODULES;

  return (
    <>
      <Navigation enabledModules={modules} />
      <WishesPopup />
      <Hero config={siteConfig} />
      {modules.story && <Story events={(story as StoryEvent[]) || []} />}
      {modules.program && <Program items={(program as ProgramItem[]) || []} />}
      {modules.venue && <Venue config={siteConfig} />}
      {modules.dressCode && <DressCode config={siteConfig} />}
      {modules.rsvp && <RSVPForm />}
      {modules.seating && (
        <SeatingChart
          tables={(seatingTables as SeatingTable[]) || []}
          guests={(seatingGuests as SeatingGuest[]) || []}
        />
      )}
      {modules.hotels && <Hotels hotels={(hotels as Hotel[]) || []} />}
      {modules.gallery && <Gallery photos={(gallery as GalleryPhoto[]) || []} />}
      {modules.guestUploads && <GuestPhotos config={siteConfig} />}
      {modules.gifts && <Gifts items={(gifts as GiftRegistryItem[]) || []} />}
      {modules.contacts && <Contacts config={siteConfig} />}
    </>
  );
}
