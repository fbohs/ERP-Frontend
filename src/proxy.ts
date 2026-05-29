import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const TENANT_PUBLIC_PATHS = ['/login', '/setup-password', '/forgot-password', '/reset-password']
const PLATFORM_PUBLIC_PATHS = ['/platform/login', '/platform/verify']

// Mirrors the `roles` restrictions in src/constants/navigation.ts.
// Routes absent from this map are accessible to all authenticated users.
const ROUTE_ROLES: ReadonlyArray<{ prefix: string; roles: readonly string[] }> = [
  { prefix: '/users',      roles: ['ADMIN'] },
  { prefix: '/categories', roles: ['ADMIN'] },
  { prefix: '/products',   roles: ['ADMIN'] },
  { prefix: '/orders',     roles: ['ADMIN', 'SALES_MANAGER', 'WAREHOUSE_OPERATOR', 'PURCHASING_MANAGER'] },
  { prefix: '/customers',  roles: ['ADMIN', 'SALES_MANAGER'] },
  { prefix: '/reports',    roles: ['ADMIN', 'SALES_MANAGER', 'INVENTORY_MANAGER', 'PURCHASING_MANAGER', 'PRODUCT_VERIFIER', 'CONTENT_MANAGER', 'REPORT_VIEWER'] },
]

function isRoleRestricted(pathname: string, role: string): boolean {
  for (const { prefix, roles } of ROUTE_ROLES) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) {
      return !roles.includes(role)
    }
  }
  return false
}

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

  // Role-based route guard — only enforced when auth-role cookie is present.
  // If absent (e.g. session predates this feature), API routes still protect data.
  if (token) {
    const role = request.cookies.get('auth-role')?.value
    if (role && isRoleRestricted(pathname, role)) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
