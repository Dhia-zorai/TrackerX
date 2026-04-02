// Hidden admin page to set admin session cookie
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';

export default function AdminPage({ params }) {
  const { slug } = params;
  
  // If slug doesn't match, return 404 immediately - no UI rendered, no indication
  if (slug !== process.env.ADMIN_SLUG) {
    notFound();
  }
  
  // Set admin cookie
  cookies().set('trackerx_admin', process.env.ADMIN_COOKIE_SECRET, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });
  
  // Redirect to home
  redirect('/');
}
