import 'server-only'
import { NextRequest, NextResponse } from 'next/server'

const BACKEND = process.env.BACKEND_URL ?? ''
const COOKIE_NAME = 'auth-token'

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` }
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'No session' } }, { status: 401 })

  const res = await fetch(`${BACKEND}/users`, {
    headers: authHeader(token),
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'No session' } }, { status: 401 })

  const idempotencyKey = request.headers.get('Idempotency-Key')
  const body = await request.json()

  const res = await fetch(`${BACKEND}/users`, {
    method: 'POST',
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
