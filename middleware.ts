import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'stockflow-dev-secret-change-in-production'
);

const PUBLIC_PATHS = ['/login', '/signup'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  const token = request.cookies.get('stockflow_session')?.value;

  if (token) {
    try {
      await jwtVerify(token, JWT_SECRET);
      // Valid session — redirect away from auth pages
      if (isPublic) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      return NextResponse.next();
    } catch {
      // Invalid/expired token — clear cookie and continue
      const response = isPublic
        ? NextResponse.next()
        : NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('stockflow_session');
      return response;
    }
  }

  if (!isPublic) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
};
