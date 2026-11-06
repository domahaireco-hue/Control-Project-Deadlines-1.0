/**
 * Project Service - Integração Supabase PostgreSQL & Realtime
 * Quest Deadline Control • Quest Consult
 */

import { Project, KanbanColumnId, KvStatus, LawMechanism } from '@/types';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { getSupabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabaseAdmin';

export interface DbProjectRow {
  id: string;
  code: string;
  name: string;
  client: string;
  sponsor: string;
  responsible: string;
  start_date: string | null;
  target_date: string | null;
  days_remaining: number | null;
  status: string;
  law_mechanism: string;
  column_id: string;
  is_manual_column: boolean;
  notes: string;
  tags: any;
  kv_status: string;
  kv_sent: boolean;
  agenda_viva_registered: boolean;
  proac_system_registered: boolean;
  is_in_treaty: boolean;
  is_completed: boolean;
  readequation_date: string | null;
  readequation_notes: string;
  original_status_col_c: string;
  amendment_type?: string | null;
  last_treaty_alert_at?: string | null;
  history: any;
  created_at: string;
  updated_at: string;
}

/**
 * Estado interno de compatibilidade com colunas recentes do Supabase.
 * Inicia como true. Caso o schema do Supabase ainda não tenha as colunas novas,
 * ativa automaticamente o fallback tolerante a falhas (sem erro 400).
 */
let hasNewColumnsSupport = true;

const NEW_COLUMNS_TO_STRIP: (keyof DbProjectRow)[] = ['amendment_type', 'last_treaty_alert_at'];

function sanitizeRowForDb(row: DbProjectRow): Partial<DbProjectRow> {
  if (hasNewColumnsSupport) return row;
  const sanitized = { ...row };
  for (const col of NEW_COLUMNS_TO_STRIP) {
    delete sanitized[col];
  }
  return sanitized;
}

function isMissingColumnError(error: any): boolean {
  if (!error) return false;
  return (
    error.code === 'PGRST204' ||
    (typeof error.message === 'string' && (error.message.includes('schema cache') || error.message.includes('amendment_type') || error.message.includes('last_treaty_alert_at')))
  );
}

/**
 * Converte registro do banco (snake_case) para a entidade de domínio Project (camelCase)
 */
export function projectFromDb(row: DbProjectRow): Project {
  // Extrai amendmentType do campo dedicado ou da tag de contingência
  const tagAmendment = Array.isArray(row.tags) 
    ? row.tags.find((t: any) => typeof t === 'string' && t.startsWith('emenda:'))?.replace('emenda:', '')
    : undefined;

  return {
    id: row.id,
    code: row.code || 'Sem informação Migrada',
    name: row.name || 'Sem informação Migrada',
    client: row.client || 'Sem informação Migrada',
    sponsor: row.sponsor || 'Sem informação Migrada',
    responsible: row.responsible || 'Quest Consult',
    startDate: row.start_date || null,
    targetDate: row.target_date || null,
    daysRemaining: typeof row.days_remaining === 'number' ? row.days_remaining : null,
    status: row.status || 'Em Execução',
    lawMechanism: (row.law_mechanism || 'Geral') as LawMechanism,
    columnId: (row.column_id || 'col_90') as KanbanColumnId,
    isManualColumn: Boolean(row.is_manual_column),
    notes: row.notes || '',
    tags: Array.isArray(row.tags) ? row.tags : [],
    kvStatus: (row.kv_status || 'nao_enviado') as KvStatus,
    kvSent: Boolean(row.kv_sent),
    agendaVivaRegistered: Boolean(row.agenda_viva_registered),
    proacSystemRegistered: Boolean(row.proac_system_registered),
    isInTreaty: Boolean(row.is_in_treaty),
    isCompleted: Boolean(row.is_completed),
    readequationDate: row.readequation_date || null,
    readequationNotes: row.readequation_notes || '',
    originalStatusColC: row.original_status_col_c || '',
    amendmentType: row.amendment_type || tagAmendment || (row.law_mechanism?.includes('Emenda') ? row.law_mechanism : undefined),
    lastTreatyAlertAt: row.last_treaty_alert_at || undefined,
    history: Array.isArray(row.history) ? row.history : [],
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

/**
 * Converte entidade de domínio Project (camelCase) para o formato do Supabase (snake_case)
 */
export function projectToDb(p: Project): DbProjectRow {
  // Preserva amendmentType nas tags para compatibilidade caso a coluna ainda não exista
  let tags = Array.isArray(p.tags) ? [...p.tags] : [];
  if (p.amendmentType) {
    tags = tags.filter((t) => typeof t !== 'string' || !t.startsWith('emenda:'));
    tags.push(`emenda:${p.amendmentType}`);
  }

  return {
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
    tags,
    kv_status: p.kvStatus || 'nao_enviado',
    kv_sent: Boolean(p.kvSent),
    agenda_viva_registered: Boolean(p.agendaVivaRegistered),
    proac_system_registered: Boolean(p.proacSystemRegistered),
    is_in_treaty: Boolean(p.isInTreaty),
    is_completed: Boolean(p.isCompleted),
    readequation_date: p.readequationDate || null,
    readequation_notes: p.readequationNotes || '',
    original_status_col_c: p.originalStatusColC || '',
    amendment_type: p.amendmentType || null,
    last_treaty_alert_at: p.lastTreatyAlertAt || null,
    history: Array.isArray(p.history) ? p.history : [],
    created_at: p.createdAt || new Date().toISOString(),
    updated_at: p.updatedAt || new Date().toISOString(),
  };
}

export class ProjectService {
  /**
   * Busca todos os projetos salvos no Supabase
   */
  public static async fetchAllProjects(): Promise<{ data: Project[] | null; error: Error | null }> {
    const supabase = getSupabase();
    if (!supabase) {
      return { data: null, error: new Error('Supabase não configurado') };
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[ProjectService] Erro ao buscar projetos no Supabase:', error);
        return { data: null, error: new Error(error.message) };
      }

      const projects = (data as DbProjectRow[]).map(projectFromDb);
      return { data: projects, error: null };
    } catch (err: any) {
      console.error('[ProjectService] Falha na consulta de projetos:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Salva ou atualiza um único projeto no Supabase
   */
  public static async saveProject(project: Project): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabase();
    if (!supabase) {
      return { success: false, error: 'Supabase não configurado' };
    }

    try {
      let row = sanitizeRowForDb(projectToDb(project));
      let { error } = await supabase
        .from('projects')
        .upsert(row, { onConflict: 'id' });

      // Fallback automático caso o banco de dados ainda não tenha as colunas recentes
      if (error && hasNewColumnsSupport && isMissingColumnError(error)) {
        console.warn('[ProjectService] Colunas recentes ainda não migradas no Supabase. Executando fallback compatível...');
        hasNewColumnsSupport = false;
        row = sanitizeRowForDb(projectToDb(project));
        const retry = await supabase
          .from('projects')
          .upsert(row, { onConflict: 'id' });
        error = retry.error;
      }

      if (error) {
        console.error('[ProjectService] Erro ao salvar projeto:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      console.error('[ProjectService] Falha inesperada ao salvar projeto:', err);
      return { success: false, error: err?.message || 'Erro inesperado' };
    }
  }

  /**
   * Salva múltiplos projetos em lote (Batch Upsert)
   */
  public static async saveProjectsBatch(
    projects: Project[]
  ): Promise<{ success: boolean; insertedOrUpdated: number; error?: string }> {
    const supabase = getSupabase();
    if (!supabase) {
      return { success: false, insertedOrUpdated: 0, error: 'Supabase não configurado' };
    }

    if (projects.length === 0) {
      return { success: true, insertedOrUpdated: 0 };
    }

    try {
      // Processa em blocos de 100 para evitar payload excessivo
      const CHUNK_SIZE = 100;
      let total = 0;

      for (let i = 0; i < projects.length; i += CHUNK_SIZE) {
        const chunkProjects = projects.slice(i, i + CHUNK_SIZE);
        let chunkRows = chunkProjects.map(projectToDb).map(sanitizeRowForDb);

        let { error } = await supabase
          .from('projects')
          .upsert(chunkRows, { onConflict: 'id' });

        // Fallback automático para o lote caso o banco ainda não tenha as colunas recentes
        if (error && hasNewColumnsSupport && isMissingColumnError(error)) {
          console.warn('[ProjectService] Colunas recentes ainda não migradas no Supabase. Executando fallback em lote compatível...');
          hasNewColumnsSupport = false;
          chunkRows = chunkProjects.map(projectToDb).map(sanitizeRowForDb);
          const retry = await supabase
            .from('projects')
            .upsert(chunkRows, { onConflict: 'id' });
          error = retry.error;
        }

        if (error) {
          console.error(`[ProjectService] Erro ao salvar bloco ${i / CHUNK_SIZE}:`, error);
          return { success: false, insertedOrUpdated: total, error: error.message };
        }
        total += chunkRows.length;
      }

      return { success: true, insertedOrUpdated: total };
    } catch (err: any) {
      console.error('[ProjectService] Falha ao salvar projetos em lote:', err);
      return { success: false, insertedOrUpdated: 0, error: err?.message || 'Erro inesperado' };
    }
  }

  /**
   * Exclui um projeto no Supabase
   */
  public static async deleteProject(id: string): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabase();
    if (!supabase) {
      return { success: false, error: 'Supabase não configurado' };
    }

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[ProjectService] Erro ao excluir projeto:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      console.error('[ProjectService] Falha ao excluir projeto:', err);
      return { success: false, error: err?.message || 'Erro inesperado' };
    }
  }

  /**
   * Limpa todos os projetos do banco de dados
   */
  public static async clearAllProjects(): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabase();
    if (!supabase) {
      return { success: false, error: 'Supabase não configurado' };
    }

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .neq('id', '___non_existent___');

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Erro ao limpar banco de dados' };
    }
  }

  /**
   * Inicia a escuta em tempo real (Realtime Channel) do Supabase
   * Notifica sempre que outro usuário inserir, atualizar ou excluir um projeto
   */
  public static subscribeToRealtimeChanges(
    onRemoteChange: (change: {
      eventType: 'INSERT' | 'UPDATE' | 'DELETE';
      project?: Project;
      oldId?: string;
    }) => void
  ): (() => void) | null {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
      const channel = supabase
        .channel('realtime:projects')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'projects' },
          (payload: any) => {
            const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
            if (eventType === 'DELETE') {
              onRemoteChange({
                eventType: 'DELETE',
                oldId: payload.old?.id,
              });
            } else if (payload.new) {
              const project = projectFromDb(payload.new as DbProjectRow);
              onRemoteChange({
                eventType,
                project,
              });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.error('[ProjectService] Falha ao assinar canal Realtime:', err);
      return null;
    }
  }

  // ==========================================
  // MÉTODOS DE SERVIDOR (SERVER-SIDE / ADMIN)
  // ==========================================

  /**
   * Busca projetos no servidor (para API routes / cron)
   */
  public static async serverFetchAllProjects(): Promise<Project[]> {
    const admin = getSupabaseAdmin();
    if (!admin) return [];

    try {
      const { data, error } = await admin
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data) {
        console.error('[ServerProjectService] Erro ao buscar no servidor:', error);
        return [];
      }

      return (data as DbProjectRow[]).map(projectFromDb);
    } catch (err) {
      console.error('[ServerProjectService] Falha inesperada:', err);
      return [];
    }
  }

  /**
   * Salva múltiplos projetos no servidor (para API routes / cron)
   */
  public static async serverSaveProjectsBatch(projects: Project[]): Promise<boolean> {
    const admin = getSupabaseAdmin();
    if (!admin || projects.length === 0) return false;

    try {
      const CHUNK_SIZE = 100;

      for (let i = 0; i < projects.length; i += CHUNK_SIZE) {
        const chunkProjects = projects.slice(i, i + CHUNK_SIZE);
        let chunkRows = chunkProjects.map(projectToDb).map(sanitizeRowForDb);

        let { error } = await admin
          .from('projects')
          .upsert(chunkRows, { onConflict: 'id' });

        if (error && hasNewColumnsSupport && isMissingColumnError(error)) {
          hasNewColumnsSupport = false;
          chunkRows = chunkProjects.map(projectToDb).map(sanitizeRowForDb);
          const retry = await admin
            .from('projects')
            .upsert(chunkRows, { onConflict: 'id' });
          error = retry.error;
        }

        if (error) {
          console.error('[ServerProjectService] Erro ao salvar bloco:', error);
          return false;
        }
      }

      return true;
    } catch (err) {
      console.error('[ServerProjectService] Falha ao salvar no servidor:', err);
      return false;
    }
  }
}

