// ============================================================
// СИСТЕМА ТЕМ
// Три готовых визуальных стиля. Активная тема хранится в
// site_config.active_theme и выбирается парой в админке
// (/admin/theme). Чтобы продать сайт с другим стилем —
// просто сменить это поле, код переделывать не нужно.
// ============================================================

export type ThemeId = 'classic' | 'modern' | 'botanical';

export interface ThemeMeta {
  id: ThemeId;
  label: string;
  description: string;
}

export const THEMES: ThemeMeta[] = [
  {
    id: 'classic',
    label: 'Классика',
    description:
      'Глубокий чернильный + античное золото на слоновой кости. Playfair Display + EB Garamond. Тонкие золотые линии как в леттерпресс-приглашениях.',
  },
  {
    id: 'modern',
    label: 'Минимализм',
    description:
      'Белый + графит + пыльная роза. Space Grotesk + Inter. Крупная монограмма инициалов, много воздуха.',
  },
  {
    id: 'botanical',
    label: 'Природа',
    description:
      'Оливковый + пыльная роза на пергаменте. Cormorant + Lora. Ботанические линии-разделители между блоками.',
  },
];

export function isValidTheme(value: string | null | undefined): value is ThemeId {
  return THEMES.some((t) => t.id === value);
}
