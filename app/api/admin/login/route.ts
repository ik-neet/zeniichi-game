import { NextRequest, NextResponse } from 'next/server'
import { createSessionToken, ADMIN_COOKIE } from '@/lib/admin-auth'

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()

  const adminUsername = process.env.ADMIN_USERNAME
  const adminPassword = process.env.ADMIN_PASSWORD

  if (!adminUsername || !adminPassword) {
    return NextResponse.json({ error: '管理者が設定されていません' }, { status: 500 })
  }

  if (username !== adminUsername || password !== adminPassword) {
    return NextResponse.json({ error: 'IDまたはパスワードが正しくありません' }, { status: 401 })
  }

  const token = await createSessionToken(adminPassword)

  const res = NextResponse.json({ ok: true })
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
  return res
}
