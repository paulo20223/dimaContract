const TOKEN_KEY = 'auth_token'

export function getToken(): string | null {
  if (typeof document === 'undefined') return null

  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=')
    if (name === TOKEN_KEY) {
      return decodeURIComponent(value)
    }
  }
  return null
}

export async function setToken(token: string): Promise<void> {
  await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  })
}

export async function removeToken(): Promise<void> {
  await fetch('/api/auth', { method: 'DELETE' })
}

export function isAuthenticated(): boolean {
  return !!getToken()
}
