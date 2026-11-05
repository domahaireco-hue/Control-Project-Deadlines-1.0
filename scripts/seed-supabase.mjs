/**
 * Script de Carga Inicial (Seed) do Supabase
 * Quest Deadline Control • Quest Consult
 * 
 * Uso:
 *   node scripts/seed-supabase.mjs
 *   ou
 *   npm run seed:supabase
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Função auxiliar para carregar variáveis do .env ou .env.local manualmente
function loadEnv() {
  const envFiles = ['.env.local', '.env'];
  for (const file of envFiles) {
    const fullPath = path.join(rootDir, file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      content.split('\n').forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx !== -1) {
            const key = trimmed.substring(0, eqIdx).trim();
            const val = trimmed.substring(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      });
    }
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project') || supabaseKey.includes('your-anon-key')) {
  console.error('\n❌ ERRO: Variáveis do Supabase não encontradas ou inválidas.');
  console.error('Certifique-se de configurar o arquivo .env.local com:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co');
  console.error('  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsIn...\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSeed() {
  console.log('====================================================');
  console.log('🚀 Iniciando Carga Inicial (Seed) no Supabase...');
  console.log(`🌐 Supabase URL: ${supabaseUrl}`);
  console.log('====================================================\n');

  const jsonPath = path.join(rootDir, 'src', 'data', 'initialProjects.json');
  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ Arquivo initialProjects.json não encontrado em: ${jsonPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(jsonPath, 'utf8');
  const projects = JSON.parse(raw);
  console.log(`📦 Carregados ${projects.length} projetos do arquivo JSON local.\n`);

  // Converte para o schema do PostgreSQL
  const rows = projects.map((p) => ({
    id: p.id,
    code: p.code || 'Sem informação Migrada',
    name: p.name || 'Sem informação Migrada',
    client: p.client || 'Sem informação Migrada',
    sponsor: p.sponsor || 'Sem informação Migrada',
    responsible: p.responsible || 'Quest Consult',
    start_date: p.startDate || null,
    target_date: p.targetDate || null,
    days_remaining: typeof p.daysRemaining === 'number' ? p.daysRemaining : null,
    status: p.status || 'Em Execução',
    law_mechanism: p.lawMechanism || 'Geral',
    column_id: p.columnId || 'col_90',
    is_manual_column: Boolean(p.isManualColumn),
    notes: p.notes || '',
    tags: Array.isArray(p.tags) ? p.tags : [],
    kv_status: p.kvStatus || 'nao_enviado',
    kv_sent: Boolean(p.kvSent),
    agenda_viva_registered: Boolean(p.agendaVivaRegistered),
    proac_system_registered: Boolean(p.proacSystemRegistered),
    is_in_treaty: Boolean(p.isInTreaty),
    is_completed: Boolean(p.isCompleted),
    readequation_date: p.readequationDate || null,
    readequation_notes: p.readequationNotes || '',
    original_status_col_c: p.originalStatusColC || '',
    history: Array.isArray(p.history) ? p.history : [],
    created_at: p.createdAt || new Date().toISOString(),
    updated_at: p.updatedAt || new Date().toISOString(),
  }));

  const BATCH_SIZE = 50;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const chunk = rows.slice(i, i + BATCH_SIZE);
    process.stdout.write(`⏳ Enviando lote ${Math.floor(i / BATCH_SIZE) + 1} de ${Math.ceil(rows.length / BATCH_SIZE)} (${chunk.length} registros)... `);

    const { error } = await supabase
      .from('projects')
      .upsert(chunk, { onConflict: 'id' });

    if (error) {
      console.log('❌');
      console.error(`\nErro ao inserir lote no Supabase:`, error);
      process.exit(1);
    } else {
      console.log('✅');
      inserted += chunk.length;
    }
  }

  console.log('\n====================================================');
  console.log(`🎉 Sucesso! ${inserted} projetos sincronizados no Supabase.`);
  console.log('Agora todos os membros da equipe verão os dados em tempo real!');
  console.log('====================================================\n');
}

runSeed().catch((err) => {
  console.error('\n❌ Erro fatal durante a execução:', err);
  process.exit(1);
});

