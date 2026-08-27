import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Клиент для использования в серверных компонентах / route handlers.
// Читает сессию из cookies, нужен для проверки "пара залогинена ли"
// в защищённых /admin страницах.
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll вызван из серверного компонента — можно игнорировать,
            // если есть middleware, обновляющий сессию (см. README).
          }
        },
      },
    }
  );
}
