/**
 * Supabase Server / Admin Client (Node.js / Vercel Serverless)
 * Quest Deadline Control • Quest Consult
 * 
 * ATENÇÃO: Use este arquivo exclusivamente no servidor (API routes e Cron Jobs).
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

export const isSupabaseAdminConfigured: boolean = Boolean(
  supabaseUrl &&
  supabaseKey &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-project') &&
  !supabaseKey.includes('your-anon-key')
);

let adminClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient | null {
  if (!isSupabaseAdminConfigured) {
    return null;
  }

  if (!adminClient) {
    adminClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return adminClient;
}

