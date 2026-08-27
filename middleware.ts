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

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
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

  const isLoginPage = request.nextUrl.pathname === '/admin/login';

  if (!user && !isLoginPage) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*'],
};
