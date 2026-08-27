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
  active_theme: 'classic' | 'modern' | 'botanical';
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
  dietary_restrictions: string | null;
  message: string | null;
  phone: string | null;
  created_at: string;
}
