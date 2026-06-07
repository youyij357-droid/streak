import { NextRequest, NextResponse } from 'next/server';

// ダッシュボード保護: streak-session Cookie の有無で確認
// Cookie は login 時にクライアントから document.cookie で設定される
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isDashboard = pathname.startsWith('/dashboard');
  if (!isDashboard) return NextResponse.next();

  const sessionCookie = request.cookies.get('streak-session');

  if (!sessionCookie?.value) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
