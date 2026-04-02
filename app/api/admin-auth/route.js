import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const body = await request.json();
    const { password } = body;

    if (password !== process.env.ADMIN_PASSWORD) {
      return Response.json({ error: 'unauthorized' }, { status: 401 });
    }

    const cookieStore = await cookies();
    cookieStore.set('trackerx_admin', process.env.ADMIN_PASSWORD, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: 'internal error' }, { status: 500 });
  }
}
