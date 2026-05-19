import {getToken} from 'next-auth/jwt';
import {NextResponse} from 'next/server';
import type {NextRequest} from 'next/server';

export async function middleware(request: NextRequest) {
  const token = await getToken({req: request});

  if (!token || token.orgRoleKey !== 'admin') {
    const url = new URL('/', request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
