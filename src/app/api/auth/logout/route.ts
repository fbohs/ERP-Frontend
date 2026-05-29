import 'server-only'
import { NextRequest, NextResponse } from 'next/server'

const BACKEND = process.env.BACKEND_URL ?? ''
const COOKIE_NAME = 'auth-token'
const ROLE_COOKIE_NAME = 'auth-role'

export async function DELETE(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value

  if (token) {
    await fetch(`${BACKEND}/auth/logout`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {
      // Best-effort — cookie is cleared regardless.
    })
  }

  const response = new NextResponse(null, { status: 204 })
  response.cookies.delete(COOKIE_NAME)
  response.cookies.delete(ROLE_COOKIE_NAME)
  return response
}
