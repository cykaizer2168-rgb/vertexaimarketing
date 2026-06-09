import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Prepare a response we can attach refreshed auth cookies to
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

  // IMPORTANT: refreshes the session token if expired
  const { data: { user } } = await supabase.auth.getUser();

  const isLogin = pathname === '/crm/login';
  // /crm/set-password is reached from an invite link before a session cookie
  // exists (the client establishes it from the URL), so it must stay public.
  const isPublic = isLogin || pathname === '/crm/set-password';
  const isProtected = pathname.startsWith('/crm') && !isPublic;

  // Not logged in → redirect to login
  if (isProtected && !user) {
    const loginUrl = new URL('/crm/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Already logged in but visiting /crm/login → send to dashboard
  if (isLogin && user) {
    return NextResponse.redirect(new URL('/crm', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/crm/:path*'],
};
