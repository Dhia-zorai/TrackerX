// Server-side only helper to check admin session cookie
// Never import this in client components
import { cookies } from 'next/headers'

export function isAdmin() {
  const store = cookies()
  const val = store.get('trackerx_admin')?.value
  return val === process.env.ADMIN_COOKIE_SECRET
}
