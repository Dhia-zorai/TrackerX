import { cookies } from 'next/headers'

export function isAdmin() {
  const store = cookies()
  const val = store.get('trackerx_admin')?.value
  return val === process.env.ADMIN_PASSWORD
}
