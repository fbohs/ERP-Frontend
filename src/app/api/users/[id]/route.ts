import 'server-only'
import { NextRequest, NextResponse } from 'next/server'

const BACKEND = process.env.BACKEND_URL ?? ''
const COOKIE_NAME = 'auth-token'

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` }
}

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: RouteContext) {
  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'No session' } }, { status: 401 })

  const { id } = await params
  const res = await fetch(`${BACKEND}/users/${id}`, {
    headers: authHeader(token),
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'No session' } }, { status: 401 })

  const { id } = await params
  const idempotencyKey = request.headers.get('Idempotency-Key')
  const body = await request.json()

  const res = await fetch(`${BACKEND}/users/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(token),
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
    },
    body: JSON.stringify(body),
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'No session' } }, { status: 401 })

  const { id } = await params
  const idempotencyKey = request.headers.get('Idempotency-Key')

  const res = await fetch(`${BACKEND}/users/${id}`, {
    method: 'DELETE',
    headers: {
      ...authHeader(token),
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
    },
  })

  if (res.status === 204) return new NextResponse(null, { status: 204 })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
