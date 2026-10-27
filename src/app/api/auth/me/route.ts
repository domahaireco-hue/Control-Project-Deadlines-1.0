import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('quest_session_token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, user: null }, { status: 401 });
    }

    const user = verifySessionToken(token);

    if (!user) {
      // Se o token for inválido ou estiver expirado, limpa o cookie
      const res = NextResponse.json({ success: false, user: null }, { status: 401 });
      res.cookies.set({
        name: 'quest_session_token',
        value: '',
        path: '/',
        maxAge: 0,
      });
      return res;
    }

    return NextResponse.json({ success: true, user });
  } catch (err) {
    console.error('Erro na rota /api/auth/me:', err);
    return NextResponse.json({ success: false, user: null }, { status: 500 });
  }
}
