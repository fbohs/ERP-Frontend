import 'server-only'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const BACKEND = process.env.BACKEND_URL ?? ''
const COOKIE_NAME = 'platform-auth-token'

function getToken(request: NextRequest): string | null {
  return request.cookies.get(COOKIE_NAME)?.value ?? null
}

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: RouteContext) {
  const token = getToken(request)
  if (!token) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'No session' } }, { status: 401 })

  const { id } = await params

  let res: Response
  try {
    res = await fetch(`${BACKEND}/platform/tenants/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  } catch {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Upstream unreachable' } }, { status: 502 })
  }

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const token = getToken(request)
  if (!token) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'No session' } }, { status: 401 })

  const { id } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid JSON' } }, { status: 422 })
  }

  const idempotencyKey = request.headers.get('Idempotency-Key') ?? crypto.randomUUID()

  let res: Response
  try {
    res = await fetch(`${BACKEND}/platform/tenants/${id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(body),
    })
  } catch {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Upstream unreachable' } }, { status: 502 })
  }

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
