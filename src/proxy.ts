import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const TENANT_PUBLIC_PATHS = ['/login']
const PLATFORM_PUBLIC_PATHS = ['/platform/login', '/platform/verify']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // API routes handle their own auth — proxy does not intercept them
  if (pathname.startsWith('/api/')) return NextResponse.next()

  // Platform admin surface (/platform/*)
  if (pathname.startsWith('/platform')) {
    const token = request.cookies.get('platform-auth-token')?.value
    const isPublic = PLATFORM_PUBLIC_PATHS.some(
      (p) => pathname === p || pathname.startsWith(p + '/'),
    )

    if (token && isPublic) {
      return NextResponse.redirect(new URL('/platform/dashboard', request.url))
    }

    if (!token && !isPublic) {
      return NextResponse.redirect(new URL('/platform/login', request.url))
    }

    return NextResponse.next()
  }

  // Tenant / merchant surface
  const token = request.cookies.get('auth-token')?.value
  const isPublic = TENANT_PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  )

  if (token && isPublic) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (!token && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
