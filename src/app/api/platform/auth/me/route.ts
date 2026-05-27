import 'server-only'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const BACKEND = process.env.BACKEND_URL ?? ''
const COOKIE_NAME = 'platform-auth-token'

export async function GET(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  let res: Response
  try {
    res = await fetch(`${BACKEND}/platform/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  } catch {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  if (!res.ok) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const admin = await res.json()
  return NextResponse.json(admin)
}
