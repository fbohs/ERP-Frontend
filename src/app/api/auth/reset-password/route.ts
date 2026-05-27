import 'server-only'
import { NextRequest, NextResponse } from 'next/server'

const BACKEND = process.env.BACKEND_URL ?? ''

export async function POST(req: NextRequest) {
  const body = await req.json()

  const res = await fetch(`${BACKEND}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const text = await res.text()
  const data = text.length > 0 ? JSON.parse(text) : {}
  return NextResponse.json(data, { status: res.status })
}
