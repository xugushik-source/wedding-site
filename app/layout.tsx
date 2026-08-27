import type { Metadata } from 'next';
import {
  Playfair_Display,
  EB_Garamond,
  Montserrat,
  Inter,
  Cormorant,
  Lora,
  Yeseva_One,
  Jost,
  Prata,
  Vollkorn,
} from 'next/font/google';
import { createClient } from '@/lib/supabase/server';
import './globals.css';

// Шрифты темы «Классика»
const playfair = Playfair_Display({ subsets: ['latin', 'cyrillic'], variable: '--font-playfair' });
const garamond = EB_Garamond({ subsets: ['latin', 'cyrillic'], variable: '--font-garamond' });

// Шрифты темы «Минимализм»
// Space Grotesk не поддерживает кириллицу — имена пары показывались бы
// не тем шрифтом. Montserrat официально расширен Google Fonts под кириллицу.
const montserrat = Montserrat({ subsets: ['latin', 'cyrillic'], variable: '--font-montserrat' });
const inter = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font-inter' });

// Шрифты темы «Природа»
const cormorant = Cormorant({ subsets: ['latin', 'cyrillic'], variable: '--font-cormorant' });
const lora = Lora({ subsets: ['latin', 'cyrillic'], variable: '--font-lora' });

// Шрифты темы «Полночь»
// Cinzel не имеет кириллицы в официальной версии Google Fonts — заменён на
// Yeseva One, свадебный дисплейный шрифт с полной поддержкой кириллицы.
const yesevaOne = Yeseva_One({ subsets: ['latin', 'cyrillic'], weight: '400', variable: '--font-yeseva' });
const jost = Jost({ subsets: ['latin', 'cyrillic'], variable: '--font-jost' });

// Шрифты темы «Винтаж»
const prata = Prata({ subsets: ['latin', 'cyrillic'], weight: '400', variable: '--font-prata' });
const vollkorn = Vollkorn({ subsets: ['latin', 'cyrillic'], variable: '--font-vollkorn' });

export const metadata: Metadata = {
  title: 'Наша свадьба',
  description: 'Приглашаем вас разделить с нами этот особенный день',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Тема читается из site_config, чтобы её можно было менять
  // из админки без пересборки и деплоя.
  let activeTheme = 'classic';
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from('site_config')
      .select('active_theme')
      .eq('id', 1)
      .single();
    if (data?.active_theme) activeTheme = data.active_theme;
  } catch {
    // Supabase ещё не настроен (например, при первом запуске без .env.local) —
    // используем тему по умолчанию, чтобы страница всё равно отрендерилась.
  }

  const fontVars = [
    playfair.variable,
    garamond.variable,
    montserrat.variable,
    inter.variable,
    cormorant.variable,
    lora.variable,
    yesevaOne.variable,
    jost.variable,
    prata.variable,
    vollkorn.variable,
  ].join(' ');

  return (
    <html lang="ru" data-theme={activeTheme}>
      <body className={fontVars}>{children}</body>
    </html>
  );
}
