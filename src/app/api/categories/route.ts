import 'server-only'
import { NextRequest, NextResponse } from 'next/server'

const BACKEND = process.env.BACKEND_URL ?? ''
const COOKIE_NAME = 'auth-token'

function unauthorized() {
  return NextResponse.json(
    { error: { code: 'UNAUTHORIZED', message: 'No session' } },
    { status: 401 },
  )
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token) return unauthorized()

  const res = await fetch(`${BACKEND}/categories`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token) return unauthorized()

  const idempotencyKey = request.headers.get('Idempotency-Key') ?? ''
  const body = await request.json()

  const res = await fetch(`${BACKEND}/categories`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify(body),
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
