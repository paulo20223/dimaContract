import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const TOKEN_KEY = 'auth_token'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export async function POST(request: Request) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const cookieStore = await cookies()
    cookieStore.set(TOKEN_KEY, token, {
      path: '/',
      maxAge: COOKIE_MAX_AGE,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete(TOKEN_KEY)

  return NextResponse.json({ success: true })
}
