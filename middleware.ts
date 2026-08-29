import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Проверка входа для раздела /admin. Вынесена сюда из layout.tsx,
// потому что там она зацикливала редиректы: /admin/login тоже лежит
// внутри /admin, и layout пытался перенаправить страницу логина
// саму на себя — отсюда была ошибка ERR_TOO_MANY_REDIRECTS.
// Middleware, в отличие от layout, видит точный путь запроса и может
// корректно исключить именно /admin/login из проверки.
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const isLoginPage = request.nextUrl.pathname === '/admin/login';

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(
            cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]
          ) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user && !isLoginPage) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    return response;
  } catch {
    // NEXT_PUBLIC_SUPABASE_URL/ANON_KEY отсутствуют или некорректны
    // (например, забыли задать при деплое нового клиента) — раньше
    // это роняло весь /admin с непонятным 500. Теперь: страница
    // логина всё равно рендерится (сама она не обращается к
    // Supabase при загрузке, только по кнопке "Войти"), а любая
    // другая страница /admin — отправляется на неё же. Доступ при
    // этом не открывается сам по себе: это тот же "не залогинен",
    // что и обычно, а не дыра в проверке.
    if (isLoginPage) {
      return NextResponse.next({ request });
    }
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }
}

export const config = {
  matcher: ['/admin/:path*'],
};
