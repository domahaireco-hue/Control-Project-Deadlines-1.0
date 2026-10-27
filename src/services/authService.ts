/**
 * Authentication Service
 * Desenvolvido para Quest Consult
 * 
 * Gerencia a autenticação dos 4 usuários oficiais da Quest Consult
 */

import { AuthUser } from '@/types';

export interface UserCredentials {
  email: string;
  passwordHash: string; // senha em texto/hash para validação
  user: AuthUser;
}

export const VALID_CREDENTIALS: UserCredentials[] = [
  {
    email: 'catelani@questconsult.com.br',
    passwordHash: 'Catelani@2026',
    user: {
      id: 'usr_catelani',
      email: 'catelani@questconsult.com.br',
      name: 'Thiago Catelani',
      role: 'Diretoria / Coordenação Geral',
      avatarInitials: 'TC',
    },
  },
  {
    email: 'tk@questconsult.com.br',
    passwordHash: 'Tk@2026',
    user: {
      id: 'usr_tk',
      email: 'tk@questconsult.com.br',
      name: 'Thiago Kling',
      role: 'Gestão Estratégica & Projetos',
      avatarInitials: 'TK',
    },
  },
  {
    email: 'lucas@questconsult.com.br',
    passwordHash: 'Lucas@2026',
    user: {
      id: 'usr_lucas',
      email: 'lucas@questconsult.com.br',
      name: 'Lucas',
      role: 'Operações & Prestação de Contas',
      avatarInitials: 'LU',
    },
  },
  {
    email: 'bruno.britto@questconsult.com.br',
    passwordHash: 'Bruno@2026',
    user: {
      id: 'usr_bruno',
      email: 'bruno.britto@questconsult.com.br',
      name: 'Bruno Britto',
      role: 'Gestão de Prazos & Compliance',
      avatarInitials: 'BB',
    },
  },
];

const AUTH_STORAGE_KEY = 'quest_deadline_auth_user_v1';

export class AuthService {
  /**
   * Tenta realizar o login com email e senha
   */
  public static login(emailInput: string, passwordInput: string): { success: boolean; user?: AuthUser; error?: string } {
    const trimmedEmail = emailInput.trim().toLowerCase();
    const trimmedPassword = passwordInput.trim();

    if (!trimmedEmail || !trimmedPassword) {
      return { success: false, error: 'Por favor, preencha o e-mail e a senha corporativa.' };
    }

    const matched = VALID_CREDENTIALS.find(
      (c) => c.email.toLowerCase() === trimmedEmail
    );

    if (!matched) {
      return { 
        success: false, 
        error: 'E-mail não autorizado. Utilize um dos endereços corporativos autorizados da Quest Consult.' 
      };
    }

    if (matched.passwordHash !== trimmedPassword) {
      return { 
        success: false, 
        error: 'Senha incorreta. Verifique maiúsculas e caracteres especiais.' 
      };
    }

    // Salva na sessão local
    this.saveSession(matched.user);

    return { success: true, user: matched.user };
  }

  /**
   * Obtém o usuário atualmente logado (se houver sessão válida)
   */
  public static getCurrentUser(): AuthUser | null {
    if (typeof window === 'undefined') return null;

    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!stored) return null;
      const parsed = JSON.parse(stored) as AuthUser;
      
      // Valida se o usuário salvo ainda pertence à lista autorizada
      const isValid = VALID_CREDENTIALS.some((c) => c.user.id === parsed.id && c.user.email === parsed.email);
      return isValid ? parsed : null;
    } catch {
      return null;
    }
  }

  /**
   * Salva a sessão no localStorage
   */
  public static saveSession(user: AuthUser): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } catch (err) {
      console.error('Erro ao salvar sessão de usuário:', err);
    }
  }

  /**
   * Encerra a sessão
   */
  public static logout(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (err) {
      console.error('Erro ao encerrar sessão:', err);
    }
  }

  /**
   * Retorna os usuários corporativos disponíveis
   */
  public static getAvailableUsers(): AuthUser[] {
    return VALID_CREDENTIALS.map((c) => c.user);
  }
}
