import 'server-only'
import { NextRequest, NextResponse } from 'next/server'

const BACKEND = process.env.BACKEND_URL ?? ''

export async function DELETE(req: NextRequest) {
  const authorization = req.headers.get('Authorization')

  await fetch(`${BACKEND}/auth/logout`, {
    method: 'DELETE',
    headers: {
      ...(authorization ? { Authorization: authorization } : {}),
    },
  }).catch(() => {
    // Best-effort — client has already cleared its local state before calling this.
  })

  return new NextResponse(null, { status: 204 })
}
