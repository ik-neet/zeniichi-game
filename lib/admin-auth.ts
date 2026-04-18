export const ADMIN_COOKIE = 'admin_session'

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

export async function createSessionToken(secret: string): Promise<string> {
  const key = await hmacKey(secret)
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode('admin-session'))
  return toHex(sig)
}

export async function verifySessionToken(token: string, secret: string): Promise<boolean> {
  try {
    const expected = await createSessionToken(secret)
    // constant-time comparison
    if (token.length !== expected.length) return false
    let diff = 0
    for (let i = 0; i < token.length; i++) diff |= token.charCodeAt(i) ^ expected.charCodeAt(i)
    return diff === 0
  } catch {
    return false
  }
}
