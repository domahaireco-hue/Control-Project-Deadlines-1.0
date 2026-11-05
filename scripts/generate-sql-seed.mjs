import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const jsonPath = path.join(rootDir, 'src', 'data', 'initialProjects.json');
const raw = fs.readFileSync(jsonPath, 'utf8');
const data = JSON.parse(raw);

function escapeSql(str) {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

function escapeJson(obj) {
  if (obj === null || obj === undefined) return "'[]'::jsonb";
  return `'${JSON.stringify(obj).replace(/'/g, "''")}'::jsonb`;
}

const lines = [];
lines.push('-- ==============================================================================');
lines.push('-- CARGA INICIAL (SEED) DOS PROJETOS QUEST CONSULT');
lines.push('-- Execute este script no SQL Editor do Supabase após executar o schema.sql');
lines.push('-- ==============================================================================');
lines.push('');

for (const p of data) {
  const fields = [
    escapeSql(p.id),
    escapeSql(p.code || 'Sem informação Migrada'),
    escapeSql(p.name || 'Sem informação Migrada'),
    escapeSql(p.client || 'Sem informação Migrada'),
    escapeSql(p.sponsor || 'Sem informação Migrada'),
    escapeSql(p.responsible || 'Quest Consult'),
    escapeSql(p.startDate || null),
    escapeSql(p.targetDate || null),
    typeof p.daysRemaining === 'number' ? p.daysRemaining : 'NULL',
    escapeSql(p.status || 'Em Execução'),
    escapeSql(p.lawMechanism || 'Geral'),
    escapeSql(p.columnId || 'col_90'),
    p.isManualColumn ? 'TRUE' : 'FALSE',
    escapeSql(p.notes || ''),
    escapeJson(p.tags || []),
    escapeSql(p.kvStatus || 'nao_enviado'),
    p.kvSent ? 'TRUE' : 'FALSE',
    p.agendaVivaRegistered ? 'TRUE' : 'FALSE',
    p.proacSystemRegistered ? 'TRUE' : 'FALSE',
    p.isInTreaty ? 'TRUE' : 'FALSE',
    p.isCompleted ? 'TRUE' : 'FALSE',
    escapeSql(p.readequationDate || null),
    escapeSql(p.readequationNotes || ''),
    escapeSql(p.originalStatusColC || ''),
    escapeJson(p.history || []),
    escapeSql(p.createdAt || new Date().toISOString()),
    escapeSql(p.updatedAt || new Date().toISOString())
  ];

  lines.push(`INSERT INTO public.projects (id, code, name, client, sponsor, responsible, start_date, target_date, days_remaining, status, law_mechanism, column_id, is_manual_column, notes, tags, kv_status, kv_sent, agenda_viva_registered, proac_system_registered, is_in_treaty, is_completed, readequation_date, readequation_notes, original_status_col_c, history, created_at, updated_at) VALUES (${fields.join(', ')}) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, column_id = EXCLUDED.column_id, status = EXCLUDED.status, days_remaining = EXCLUDED.days_remaining, target_date = EXCLUDED.target_date, updated_at = NOW();`);
}

const outputPath = path.join(rootDir, 'supabase', 'seed.sql');
fs.writeFileSync(outputPath, lines.join('\n'), 'utf8');
console.log(`✅ Arquivo supabase/seed.sql gerado com sucesso (${data.length} projetos).`);

