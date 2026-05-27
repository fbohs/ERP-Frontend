import 'server-only'
import { NextRequest, NextResponse } from 'next/server'

const BACKEND = process.env.BACKEND_URL ?? ''

export async function POST(req: NextRequest) {
  const body = await req.json()

  const res = await fetch(`${BACKEND}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  // Backend always returns 200 regardless of whether the email is known.
  // Mirror that — never reveal registration status to the caller.
  const data = res.status === 200 ? await res.json().catch(() => null) : null
  return NextResponse.json(data ?? {}, { status: 200 })
}
