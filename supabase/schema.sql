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
  active_theme text not null default 'classic' check (active_theme in ('classic','modern','botanical','midnight','vintage','luxury')),
  updated_at timestamptz default now(),
  constraint single_row check (id = 1)
);

insert into site_config (id) values (1) on conflict (id) do nothing;

-- Безопасно добавляет новые поля, если таблица уже была создана
-- раньше версией схемы без них (например, на уже работающем сайте).
alter table site_config add column if not exists guest_photos_url text;
alter table site_config add column if not exists guest_photos_text text
  default 'Есть свои фотографии со свадьбы? Поделитесь ими — соберём все воспоминания в одном месте.';

-- Расширяет список допустимых тем на уже существующих базах —
-- без этого новые темы "Полночь" и "Винтаж" не сохранятся в старом проекте.
alter table site_config drop constraint if exists site_config_active_theme_check;
alter table site_config add constraint site_config_active_theme_check
  check (active_theme in ('classic','modern','botanical','midnight','vintage','luxury'));

-- Module System: какие секции публичной страницы показывать.
-- Дефолт воспроизводит поведение до Module System — всё включено
-- (кроме guestBook, у которого пока нет компонента вообще, это
-- зарезервированный на будущее ключ). Hero и Transport сюда не
-- входят: Hero всегда включён, Transport исключён из Module System
-- по решению клиента.
alter table site_config add column if not exists enabled_modules jsonb not null default
  '{"story":true,"program":true,"venue":true,"dressCode":true,"rsvp":true,"seating":true,"hotels":true,"gallery":true,"guestUploads":true,"guestBook":false,"gifts":true,"contacts":true}'::jsonb;

-- Digital Wedding Invitation (продукт №2) — короткая ссылка вида
-- /i/anna-artur на отдельную мобильную страницу-приглашение.
-- Использует те же данные пары (bride_name/groom_name/wedding_date/
-- venue_name/venue_address/intro_text/cover_photo_url), новых
-- колонок под них не создавалось — только 2 новых поля, которых
-- реально не хватало: включён ли продукт и какой у него slug.
alter table site_config add column if not exists invitation_enabled boolean not null default false;
alter table site_config add column if not exists invitation_slug text;
alter table site_config drop constraint if exists site_config_invitation_slug_format;
alter table site_config add constraint site_config_invitation_slug_format
  check (invitation_slug is null or invitation_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*
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
  additional_guest_names text,
  dietary_restrictions text,
  message text,
  phone text,
  show_wish_publicly boolean not null default false,
  created_at timestamptz default now()
);

-- Безопасно добавляет поле, если таблица создана более ранней версией схемы.
alter table rsvp_responses add column if not exists additional_guest_names text;
alter table rsvp_responses add column if not exists show_wish_publicly boolean not null default false;

-- ------------------------------------------------------------
-- 9. Рассадка гостей — столы на схеме зала
-- ------------------------------------------------------------
create table if not exists seating_tables (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  capacity int not null default 8,
  note text,
  pos_x double precision not null default 50,
  pos_y double precision not null default 50,
  sort_order int not null default 0,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 10. Рассадка гостей — конкретные гости за столами
-- ------------------------------------------------------------
create table if not exists seating_guests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  table_id uuid references seating_tables(id) on delete set null,
  rsvp_response_id uuid references rsvp_responses(id) on delete set null,
  sort_order int not null default 0,
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
alter table seating_tables enable row level security;
alter table seating_guests enable row level security;

-- Публичное чтение контента
drop policy if exists "public read site_config" on site_config;
create policy "public read site_config" on site_config for select using (true);
drop policy if exists "public read story_events" on story_events;
create policy "public read story_events" on story_events for select using (true);
drop policy if exists "public read program_items" on program_items;
create policy "public read program_items" on program_items for select using (true);
drop policy if exists "public read hotels" on hotels;
create policy "public read hotels" on hotels for select using (true);
drop policy if exists "public read transport_options" on transport_options;
create policy "public read transport_options" on transport_options for select using (true);
drop policy if exists "public read gift_registry" on gift_registry;
create policy "public read gift_registry" on gift_registry for select using (true);
drop policy if exists "public read gallery_photos" on gallery_photos;
create policy "public read gallery_photos" on gallery_photos for select using (true);
drop policy if exists "public read seating_tables" on seating_tables;
create policy "public read seating_tables" on seating_tables for select using (true);
drop policy if exists "public read seating_guests" on seating_guests;
create policy "public read seating_guests" on seating_guests for select using (true);

-- Запись/изменение контента — только авторизованный пользователь (пара)
drop policy if exists "auth write site_config" on site_config;
create policy "auth write site_config" on site_config for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
drop policy if exists "auth write story_events" on story_events;
create policy "auth write story_events" on story_events for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
drop policy if exists "auth write program_items" on program_items;
create policy "auth write program_items" on program_items for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
drop policy if exists "auth write hotels" on hotels;
create policy "auth write hotels" on hotels for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
drop policy if exists "auth write transport_options" on transport_options;
create policy "auth write transport_options" on transport_options for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
drop policy if exists "auth write gift_registry" on gift_registry;
create policy "auth write gift_registry" on gift_registry for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
drop policy if exists "auth write gallery_photos" on gallery_photos;
create policy "auth write gallery_photos" on gallery_photos for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
drop policy if exists "auth write seating_tables" on seating_tables;
create policy "auth write seating_tables" on seating_tables for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
drop policy if exists "auth write seating_guests" on seating_guests;
create policy "auth write seating_guests" on seating_guests for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- RSVP: любой гость может отправить форму (insert),
-- но читать/менять/удалять ответы может только пара
drop policy if exists "public insert rsvp" on rsvp_responses;
create policy "public insert rsvp" on rsvp_responses for insert
  with check (true);
-- Публичного select на rsvp_responses больше нет вообще — анонимный
-- пользователь не может прочитать ни одной колонки этой таблицы
-- напрямую, даже guest_name/message. Вместо этого — view
-- public_wishes ниже, отдающая только эти две колонки для
-- одобренных пожеланий (было: policy "public read approved wishes",
-- разрешавшая select всей строки, включая phone и
-- dietary_restrictions, для любой строки с show_wish_publicly = true).
drop policy if exists "public read approved wishes" on rsvp_responses;
drop policy if exists "auth read rsvp" on rsvp_responses;
create policy "auth read rsvp" on rsvp_responses for select
  using (auth.role() = 'authenticated');
drop policy if exists "auth update rsvp" on rsvp_responses;
create policy "auth update rsvp" on rsvp_responses for update
  using (auth.role() = 'authenticated');
drop policy if exists "auth delete rsvp" on rsvp_responses;
create policy "auth delete rsvp" on rsvp_responses for delete
  using (auth.role() = 'authenticated');

-- ------------------------------------------------------------
-- Публичный просмотр одобренных пожеланий — только 2 колонки.
-- View выполняется с правами владельца (postgres), поэтому RLS
-- таблицы rsvp_responses не блокирует select внутри её же
-- определения, но наружу отдаются только guest_name и message —
-- phone, dietary_restrictions и остальные поля недостижимы для
-- анонимного пользователя даже напрямую через REST API.
-- ------------------------------------------------------------
create or replace view public_wishes as
  select guest_name, message
  from rsvp_responses
  where show_wish_publicly = true;

grant select on public_wishes to anon;

-- ------------------------------------------------------------
-- Storage bucket для фотографий (выполнить один раз)
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

drop policy if exists "public read photos" on storage.objects;
create policy "public read photos" on storage.objects for select
  using (bucket_id = 'photos');
drop policy if exists "auth upload photos" on storage.objects;
create policy "auth upload photos" on storage.objects for insert
  with check (bucket_id = 'photos' and auth.role() = 'authenticated');
drop policy if exists "auth delete photos" on storage.objects;
create policy "auth delete photos" on storage.objects for delete
  using (bucket_id = 'photos' and auth.role() = 'authenticated');
);

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
  additional_guest_names text,
  dietary_restrictions text,
  message text,
  phone text,
  show_wish_publicly boolean not null default false,
  created_at timestamptz default now()
);

-- Безопасно добавляет поле, если таблица создана более ранней версией схемы.
alter table rsvp_responses add column if not exists additional_guest_names text;
alter table rsvp_responses add column if not exists show_wish_publicly boolean not null default false;

-- ------------------------------------------------------------
-- 9. Рассадка гостей — столы на схеме зала
-- ------------------------------------------------------------
create table if not exists seating_tables (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  capacity int not null default 8,
  note text,
  pos_x double precision not null default 50,
  pos_y double precision not null default 50,
  sort_order int not null default 0,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 10. Рассадка гостей — конкретные гости за столами
-- ------------------------------------------------------------
create table if not exists seating_guests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  table_id uuid references seating_tables(id) on delete set null,
  rsvp_response_id uuid references rsvp_responses(id) on delete set null,
  sort_order int not null default 0,
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
alter table seating_tables enable row level security;
alter table seating_guests enable row level security;

-- Публичное чтение контента
drop policy if exists "public read site_config" on site_config;
create policy "public read site_config" on site_config for select using (true);
drop policy if exists "public read story_events" on story_events;
create policy "public read story_events" on story_events for select using (true);
drop policy if exists "public read program_items" on program_items;
create policy "public read program_items" on program_items for select using (true);
drop policy if exists "public read hotels" on hotels;
create policy "public read hotels" on hotels for select using (true);
drop policy if exists "public read transport_options" on transport_options;
create policy "public read transport_options" on transport_options for select using (true);
drop policy if exists "public read gift_registry" on gift_registry;
create policy "public read gift_registry" on gift_registry for select using (true);
drop policy if exists "public read gallery_photos" on gallery_photos;
create policy "public read gallery_photos" on gallery_photos for select using (true);
drop policy if exists "public read seating_tables" on seating_tables;
create policy "public read seating_tables" on seating_tables for select using (true);
drop policy if exists "public read seating_guests" on seating_guests;
create policy "public read seating_guests" on seating_guests for select using (true);

-- Запись/изменение контента — только авторизованный пользователь (пара)
drop policy if exists "auth write site_config" on site_config;
create policy "auth write site_config" on site_config for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
drop policy if exists "auth write story_events" on story_events;
create policy "auth write story_events" on story_events for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
drop policy if exists "auth write program_items" on program_items;
create policy "auth write program_items" on program_items for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
drop policy if exists "auth write hotels" on hotels;
create policy "auth write hotels" on hotels for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
drop policy if exists "auth write transport_options" on transport_options;
create policy "auth write transport_options" on transport_options for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
drop policy if exists "auth write gift_registry" on gift_registry;
create policy "auth write gift_registry" on gift_registry for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
drop policy if exists "auth write gallery_photos" on gallery_photos;
create policy "auth write gallery_photos" on gallery_photos for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
drop policy if exists "auth write seating_tables" on seating_tables;
create policy "auth write seating_tables" on seating_tables for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
drop policy if exists "auth write seating_guests" on seating_guests;
create policy "auth write seating_guests" on seating_guests for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- RSVP: любой гость может отправить форму (insert),
-- но читать/менять/удалять ответы может только пара
drop policy if exists "public insert rsvp" on rsvp_responses;
create policy "public insert rsvp" on rsvp_responses for insert
  with check (true);
-- Публичного select на rsvp_responses больше нет вообще — анонимный
-- пользователь не может прочитать ни одной колонки этой таблицы
-- напрямую, даже guest_name/message. Вместо этого — view
-- public_wishes ниже, отдающая только эти две колонки для
-- одобренных пожеланий (было: policy "public read approved wishes",
-- разрешавшая select всей строки, включая phone и
-- dietary_restrictions, для любой строки с show_wish_publicly = true).
drop policy if exists "public read approved wishes" on rsvp_responses;
drop policy if exists "auth read rsvp" on rsvp_responses;
create policy "auth read rsvp" on rsvp_responses for select
  using (auth.role() = 'authenticated');
drop policy if exists "auth update rsvp" on rsvp_responses;
create policy "auth update rsvp" on rsvp_responses for update
  using (auth.role() = 'authenticated');
drop policy if exists "auth delete rsvp" on rsvp_responses;
create policy "auth delete rsvp" on rsvp_responses for delete
  using (auth.role() = 'authenticated');

-- ------------------------------------------------------------
-- Публичный просмотр одобренных пожеланий — только 2 колонки.
-- View выполняется с правами владельца (postgres), поэтому RLS
-- таблицы rsvp_responses не блокирует select внутри её же
-- определения, но наружу отдаются только guest_name и message —
-- phone, dietary_restrictions и остальные поля недостижимы для
-- анонимного пользователя даже напрямую через REST API.
-- ------------------------------------------------------------
create or replace view public_wishes as
  select guest_name, message
  from rsvp_responses
  where show_wish_publicly = true;

grant select on public_wishes to anon;

-- ------------------------------------------------------------
-- Storage bucket для фотографий (выполнить один раз)
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

drop policy if exists "public read photos" on storage.objects;
create policy "public read photos" on storage.objects for select
  using (bucket_id = 'photos');
drop policy if exists "auth upload photos" on storage.objects;
create policy "auth upload photos" on storage.objects for insert
  with check (bucket_id = 'photos' and auth.role() = 'authenticated');
drop policy if exists "auth delete photos" on storage.objects;
create policy "auth delete photos" on storage.objects for delete
  using (bucket_id = 'photos' and auth.role() = 'authenticated');
