import type { EnabledModules } from './modules';

export interface SiteConfig {
  id: number;
  groom_name: string;
  bride_name: string;
  wedding_date: string;
  cover_photo_url: string | null;
  intro_text: string;
  venue_name: string;
  venue_address: string;
  venue_lat: number;
  venue_lng: number;
  dress_code: string;
  contact_phone: string;
  contact_email: string;
  guest_photos_url: string | null;
  guest_photos_text: string;
  active_theme: 'classic' | 'modern' | 'botanical' | 'midnight' | 'vintage' | 'luxury';
  // Опционально: на уже задеплоенных сайтах, где schema.sql ещё не
  // обновлён, колонки может не быть — код должен подставлять
  // DEFAULT_MODULES (см. lib/modules.ts), а не полагаться на это поле.
  enabled_modules?: EnabledModules;
  invitation_enabled: boolean;
  invitation_slug: string | null;
}

export interface StoryEvent {
  id: string;
  event_date: string | null;
  title: string;
  description: string | null;
  photo_url: string | null;
  sort_order: number;
}

export interface ProgramItem {
  id: string;
  time_label: string;
  title: string;
  description: string | null;
  sort_order: number;
}

export interface Hotel {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  notes: string | null;
  sort_order: number;
}

export interface TransportOption {
  id: string;
  title: string;
  description: string | null;
  sort_order: number;
}

export interface GiftRegistryItem {
  id: string;
  title: string;
  description: string | null;
  link: string | null;
  sort_order: number;
}

export interface GalleryPhoto {
  id: string;
  photo_url: string;
  caption: string | null;
  sort_order: number;
}

export interface RsvpResponse {
  id: string;
  guest_name: string;
  attending: boolean;
  guests_count: number;
  additional_guest_names: string | null;
  dietary_restrictions: string | null;
  message: string | null;
  phone: string | null;
  show_wish_publicly: boolean;
  created_at: string;
}

export interface SeatingTable {
  id: string;
  name: string;
  capacity: number;
  note: string | null;
  pos_x: number;
  pos_y: number;
  sort_order: number;
}

export interface SeatingGuest {
  id: string;
  full_name: string;
  table_id: string | null;
  rsvp_response_id: string | null;
  sort_order: number;
}
