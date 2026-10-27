/**
 * Client Authentication Service
 * Desenvolvido para Quest Consult
 * 
 * Comunica-se exclusivamente com a API de segurança no servidor (/api/auth/*).
 * Nenhuma senha ou hash é exposta no código do cliente.
 */

import { AuthUser } from '@/types';

export class AuthService {
  /**
   * Dispara autenticação segura para o servidor
   */
  public static async login(
    emailInput: string,
    passwordInput: string
  ): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    const trimmedEmail = emailInput.trim().toLowerCase();
    const trimmedPassword = passwordInput.trim();

    if (!trimmedEmail || !trimmedPassword) {
      return { success: false, error: 'Por favor, preencha o e-mail e a senha corporativa.' };
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: trimmedEmail,
          password: trimmedPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'Credenciais inválidas ou acesso não autorizado.',
        };
      }

      return { success: true, user: data.user };
    } catch (err) {
      console.error('Erro na requisição de autenticação:', err);
      return {
        success: false,
        error: 'Erro de conexão com o servidor. Verifique sua conexão e tente novamente.',
      };
    }
  }

  /**
   * Obtém a sessão ativa validada pelo servidor via Cookie HttpOnly
   */
  public static async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.user || null;
    } catch (err) {
      return null;
    }
  }

  /**
   * Realiza logout invalidando o cookie HttpOnly no servidor
   */
  public static async logout(): Promise<void> {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
    } catch (err) {
      console.error('Erro ao encerrar sessão no servidor:', err);
    }
  }
}
