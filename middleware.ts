import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken, ADMIN_COOKIE } from '@/lib/admin-auth'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname === '/admin/login') return NextResponse.next()

  const token = req.cookies.get(ADMIN_COOKIE)?.value
  const adminPassword = process.env.ADMIN_PASSWORD

  if (!token || !adminPassword || !(await verifySessionToken(token, adminPassword))) {
    return NextResponse.redirect(new URL('/admin/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
