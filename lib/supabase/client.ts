'use client';

import { createBrowserClient } from '@supabase/ssr';

// Клиент для использования в браузере (клиентские компоненты).
// Использует публичный anon-ключ — безопасен для фронтенда,
// доступ к данным ограничивается политиками RLS в Supabase.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
