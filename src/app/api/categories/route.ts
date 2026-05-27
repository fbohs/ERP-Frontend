import 'server-only'
import { NextRequest, NextResponse } from 'next/server'

const BACKEND = process.env.BACKEND_URL ?? ''
const COOKIE_NAME = 'auth-token'

export async function GET(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'No session' } },
      { status: 401 },
    )
  }

  const res = await fetch(`${BACKEND}/categories`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
