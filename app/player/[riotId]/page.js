import { cookies } from 'next/headers';
import { PlayerClient } from './PlayerClient';

async function checkAdminCookie() {
  try {
    const cookieStore = await cookies();
    const val = cookieStore.get('trackerx_admin')?.value;
    return val === process.env.ADMIN_PASSWORD;
  } catch {
    return false;
  }
}

export default async function PlayerPage({ params }) {
  const resolvedParams = await params;
  const isAdmin = await checkAdminCookie();

  return <PlayerClient resolvedParams={resolvedParams} isAdmin={isAdmin} />;
}
