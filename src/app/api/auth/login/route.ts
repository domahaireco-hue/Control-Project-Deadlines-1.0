import { NextRequest, NextResponse } from 'next/server';
import { SERVER_USERS, verifyPassword, createSessionToken } from '@/lib/serverAuth';

// In-memory rate limiting para proteção contra ataques de força bruta
const loginAttempts = new Map<string, { count: number; blockedUntil: number }>();

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers.get('x-real-ip') || 'unknown-ip';
}

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const now = Date.now();

    // 1. Checa bloqueio por excesso de tentativas
    const ipRecord = loginAttempts.get(ip);
    if (ipRecord && ipRecord.blockedUntil > now) {
      const waitMinutes = Math.ceil((ipRecord.blockedUntil - now) / 60000);
      return NextResponse.json(
        { 
          success: false, 
          error: `Muitas tentativas incorretas. Acesso temporariamente bloqueado por segurança. Tente novamente em ${waitMinutes} minuto(s).` 
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { email, password } = body || {};

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Por favor, informe o e-mail corporativo e a senha.' },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    // 2. Busca usuário na base restrita do servidor
    const userRecord = SERVER_USERS.find((u) => u.email.toLowerCase() === trimmedEmail);

    if (!userRecord || !verifyPassword(trimmedPassword, userRecord.passwordHash)) {
      // Registra falha para rate limiting
      const currentCount = (ipRecord?.count || 0) + 1;
      if (currentCount >= 5) {
        loginAttempts.set(ip, {
          count: currentCount,
          blockedUntil: now + 5 * 60 * 1000, // Bloqueia por 5 minutos
        });
      } else {
        loginAttempts.set(ip, {
          count: currentCount,
          blockedUntil: 0,
        });
      }

      return NextResponse.json(
        { 
          success: false, 
          error: 'Credenciais inválidas. Verifique seu e-mail corporativo e sua senha.' 
        },
        { status: 401 }
      );
    }

    // 3. Sucesso: limpa tentativas do IP
    loginAttempts.delete(ip);

    const safeUser = {
      id: userRecord.id,
      email: userRecord.email,
      name: userRecord.name,
      role: userRecord.role,
      avatarInitials: userRecord.avatarInitials,
    };

    // 4. Gera token criptografado para a sessão
    const sessionToken = createSessionToken(safeUser);

    const isProduction = process.env.NODE_ENV === 'production';

    // 5. Configura Cookie HttpOnly Seguro
    const response = NextResponse.json({
      success: true,
      user: safeUser,
    });

    response.cookies.set({
      name: 'quest_session_token',
      value: sessionToken,
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    });

    return response;
  } catch (error) {
    console.error('Erro na rota /api/auth/login:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno ao processar autenticação.' },
      { status: 500 }
    );
  }
}
