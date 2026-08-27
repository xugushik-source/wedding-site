-- ============================================================
-- СХЕМА БАЗЫ ДАННЫХ СВАДЕБНОГО САЙТА
-- Выполнить целиком в Supabase → SQL Editor → New query → Run
-- ============================================================

-- Расширение для генерации UUID
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- 1. Основные настройки сайта (одна строка на сайт)
-- ------------------------------------------------------------
create table if not exists site_config (
  id int primary key default 1,
  groom_name text not null default 'Жених',
  bride_name text not null default 'Невеста',
  wedding_date timestamptz not null default (now() + interval '180 days'),
  cover_photo_url text,
  intro_text text default 'Мы рады пригласить вас разделить с нами этот особенный день',
  venue_name text default 'Место проведения',
  venue_address text default '',
  venue_lat double precision default 55.751244,
  venue_lng double precision default 37.618423,
  dress_code text default 'Нарядный casual. Просим избегать белого и чёрного цветов.',
  contact_phone text default '',
  contact_email text default '',
  guest_photos_url text,
  guest_photos_text text default 'Есть свои фотографии со свадьбы? Поделитесь ими — соберём все воспоминания в одном месте.',
  active_theme text not null default 'classic' check (active_theme in ('classic','modern','botanical')),
  updated_at timestamptz default now(),
  constraint single_row check (id = 1)
);

insert into site_config (id) values (1) on conflict (id) do nothing;

-- Безопасно добавляет новые поля, если таблица уже была создана
-- раньше версией схемы без них (например, на уже работающем сайте).
alter table site_config add column if not exists guest_photos_url text;
alter table site_config add column if not exists guest_photos_text text
  default 'Есть свои фотографии со свадьбы? Поделитесь ими — соберём все воспоминания в одном месте.';

-- ------------------------------------------------------------
-- 2. История знакомства
-- ------------------------------------------------------------
create table if not exists story_events (
  id uuid primary key default gen_random_uuid(),
  event_date date,
  title text not null,
  description text,
  photo_url text,
  sort_order int not null default 0,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 3. Программа свадьбы
-- ------------------------------------------------------------
create table if not exists program_items (
  id uuid primary key default gen_random_uuid(),
  time_label text not null,
  title text not null,
  description text,
  sort_order int not null default 0,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 4. Гостиницы
-- ------------------------------------------------------------
create table if not exists hotels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  phone text,
  website text,
  notes text,
  sort_order int not null default 0,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 5. Транспорт
-- ------------------------------------------------------------
create table if not exists transport_options (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  sort_order int not null default 0,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 6. Подарки / список желаний
-- ------------------------------------------------------------
create table if not exists gift_registry (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  link text,
  sort_order int not null default 0,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 7. Фотогалерея
-- ------------------------------------------------------------
create table if not exists gallery_photos (
  id uuid primary key default gen_random_uuid(),
  photo_url text not null,
  caption text,
  sort_order int not null default 0,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 8. Подтверждения присутствия (RSVP)
-- ------------------------------------------------------------
create table if not exists rsvp_responses (
  id uuid primary key default gen_random_uuid(),
  guest_name text not null,
  attending boolean not null,
  guests_count int not null default 1,
  dietary_restrictions text,
  message text,
  phone text,
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- Публичные данные — читать может любой (анонимный) посетитель.
-- Изменять контент может только авторизованный пользователь (пара).
-- RSVP — любой может отправить форму, но видеть ответы может
-- только авторизованный пользователь.
-- ============================================================

alter table site_config enable row level security;
alter table story_events enable row level security;
alter table program_items enable row level security;
alter table hotels enable row level security;
alter table transport_options enable row level security;
alter table gift_registry enable row level security;
alter table gallery_photos enable row level security;
alter table rsvp_responses enable row level security;

-- Публичное чтение контента
create policy "public read site_config" on site_config for select using (true);
create policy "public read story_events" on story_events for select using (true);
create policy "public read program_items" on program_items for select using (true);
create policy "public read hotels" on hotels for select using (true);
create policy "public read transport_options" on transport_options for select using (true);
create policy "public read gift_registry" on gift_registry for select using (true);
create policy "public read gallery_photos" on gallery_photos for select using (true);

-- Запись/изменение контента — только авторизованный пользователь (пара)
create policy "auth write site_config" on site_config for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "auth write story_events" on story_events for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "auth write program_items" on program_items for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "auth write hotels" on hotels for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "auth write transport_options" on transport_options for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "auth write gift_registry" on gift_registry for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "auth write gallery_photos" on gallery_photos for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- RSVP: любой гость может отправить форму (insert),
-- но читать/менять/удалять ответы может только пара
create policy "public insert rsvp" on rsvp_responses for insert
  with check (true);
create policy "auth read rsvp" on rsvp_responses for select
  using (auth.role() = 'authenticated');
create policy "auth update rsvp" on rsvp_responses for update
  using (auth.role() = 'authenticated');
create policy "auth delete rsvp" on rsvp_responses for delete
  using (auth.role() = 'authenticated');

-- ------------------------------------------------------------
-- Storage bucket для фотографий (выполнить один раз)
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

create policy "public read photos" on storage.objects for select
  using (bucket_id = 'photos');
create policy "auth upload photos" on storage.objects for insert
  with check (bucket_id = 'photos' and auth.role() = 'authenticated');
create policy "auth delete photos" on storage.objects for delete
  using (bucket_id = 'photos' and auth.role() = 'authenticated');
