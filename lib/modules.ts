// ============================================================
// MODULE SYSTEM
// Реестр функций сайта, которые можно включать/выключать по
// клиенту через site_config.enabled_modules. Управляет только
// видимостью существующих секций — сами компоненты не меняются.
//
// Hero и Transport сознательно НЕ входят в этот тип:
//   - Hero всегда включён, флаг был бы фиктивным.
//   - Transport исключён из Module System по решению клиента.
//     Компонент остаётся в кодовой базе (components/sections/
//     Transport.tsx), но не вызывается из app/page.tsx и не
//     управляется этой системой. Не добавлять без отдельного
//     запроса.
// ============================================================

export type ModuleId =
  | 'story'
  | 'program'
  | 'venue'
  | 'dressCode'
  | 'rsvp'
  | 'seating'
  | 'hotels'
  | 'gallery'
  | 'guestUploads'
  | 'guestBook'
  | 'gifts'
  | 'contacts';

export interface ModuleMeta {
  id: ModuleId;
  label: string;
}

export const MODULES: ModuleMeta[] = [
  { id: 'story', label: 'История знакомства' },
  { id: 'program', label: 'Программа дня' },
  { id: 'venue', label: 'Место проведения' },
  { id: 'dressCode', label: 'Дресс-код' },
  { id: 'rsvp', label: 'RSVP' },
  { id: 'seating', label: 'Рассадка' },
  { id: 'hotels', label: 'Гостиницы' },
  { id: 'gallery', label: 'Фотогалерея' },
  { id: 'guestUploads', label: 'Гостевые фото (внешняя ссылка)' },
  { id: 'guestBook', label: 'Гостевая книга (зарезервировано, не реализовано)' },
  { id: 'gifts', label: 'Подарки' },
  { id: 'contacts', label: 'Контакты' },
];

export type EnabledModules = Record<ModuleId, boolean>;

// Воспроизводит сегодняшнее поведение (всё видно), кроме guestBook —
// он всё равно ни на что не влияет, т.к. компонента не существует.
export const DEFAULT_MODULES: EnabledModules = {
  story: true,
  program: true,
  venue: true,
  dressCode: true,
  rsvp: true,
  seating: true,
  hotels: true,
  gallery: true,
  guestUploads: true,
  guestBook: false,
  gifts: true,
  contacts: true,
};

export function isValidModule(value: string): value is ModuleId {
  return MODULES.some((m) => m.id === value);
}
