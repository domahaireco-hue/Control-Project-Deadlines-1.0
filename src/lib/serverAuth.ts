/**
 * Server-Side Authentication & Cryptography Library
 * Desenvolvido para Quest Consult
 * 
 * ATENÇÃO: Este arquivo roda EXCLUSIVAMENTE no servidor (Node.js/Vercel Serverless).
 * NUNCA importar em componentes cliente ('use client').
 */

import crypto from 'crypto';
import { AuthUser } from '@/types';

const SECRET = process.env.SESSION_SECRET || 'quest_consult_super_secret_session_key_2026_jwt_token';
const SALT = process.env.AUTH_SALT || 'QUEST_CONSULT_SECURE_SALT_2026';

export interface ServerUserRecord {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarInitials: string;
  passwordHash: string;
}

// Hashes calculados no servidor (SHA-256 + Salt)
export const SERVER_USERS: ServerUserRecord[] = [
  {
    id: 'usr_catelani',
    email: 'catelani@questconsult.com.br',
    name: 'Thiago Catelani',
    role: 'Diretoria / Coordenação Geral',
    avatarInitials: 'TC',
    passwordHash: 'c428ac78c86617367b57f001669ea9c4bdd82916c90130a928239ee653f42c9b',
  },
  {
    id: 'usr_tk',
    email: 'tk@questconsult.com.br',
    name: 'Thiago Kling',
    role: 'Gestão Estratégica & Projetos',
    avatarInitials: 'TK',
    passwordHash: '1bb667dc5d3479d8b5fe7c8fb81c8d692f374bda5bd409c94b29574bb1d31b32',
  },
  {
    id: 'usr_lucas',
    email: 'lucas@questconsult.com.br',
    name: 'Lucas',
    role: 'Operações & Prestação de Contas',
    avatarInitials: 'LU',
    passwordHash: '46faa01b8d07d72b4171559ff0b5b44459a2ef847d55d878c6d7a056bbe33c64',
  },
  {
    id: 'usr_bruno',
    email: 'bruno.britto@questconsult.com.br',
    name: 'Bruno Britto',
    role: 'Gestão de Prazos & Compliance',
    avatarInitials: 'BB',
    passwordHash: 'ff98a20bf303b15c455ec1764f7ec3ef054eec924bbfd4d560c6bf8081b93f4a',
  },
];

/**
 * Gera hash SHA-256 seguro com Salt no servidor
 */
export function hashPassword(plainText: string): string {
  return crypto.createHash('sha256').update(plainText + 'QUEST_SALT_2026').digest('hex');
}

/**
 * Validação com proteção contra Timing Attacks (timingSafeEqual)
 */
export function verifyPassword(plainText: string, storedHash: string): boolean {
  const computedHash = hashPassword(plainText);
  try {
    return crypto.timingSafeEqual(Buffer.from(computedHash, 'utf8'), Buffer.from(storedHash, 'utf8'));
  } catch {
    return false;
  }
}

/**
 * Cria token assinado HMAC-SHA256 para o cookie de sessão HttpOnly
 */
export function createSessionToken(user: AuthUser): string {
  const payload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatarInitials: user.avatarInitials,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7), // Validade: 7 dias
  };

  const payloadEncoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', SECRET).update(payloadEncoded).digest('base64url');

  return `${payloadEncoded}.${signature}`;
}

/**
 * Verifica integridade e expiração do token de sessão
 */
export function verifySessionToken(token: string): AuthUser | null {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;

  const [payloadEncoded, signature] = token.split('.');
  if (!payloadEncoded || !signature) return null;

  const expectedSignature = crypto.createHmac('sha256', SECRET).update(payloadEncoded).digest('base64url');

  try {
    const isValidSignature = crypto.timingSafeEqual(Buffer.from(signature, 'utf8'), Buffer.from(expectedSignature, 'utf8'));
    if (!isValidSignature) return null;

    const payload = JSON.parse(Buffer.from(payloadEncoded, 'base64url').toString('utf8'));
    
    // Verifica se expirou
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      avatarInitials: payload.avatarInitials,
    };
  } catch {
    return null;
  }
}
