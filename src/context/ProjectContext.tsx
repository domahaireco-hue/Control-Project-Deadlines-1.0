'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Project, KanbanColumnConfig, KanbanColumnId, CardMoveEvent, NotificationLog, ImportResult, KvStatus, ProjectHistoryEntry } from '@/types';
import { notificationService } from '@/services/notificationService';
import { FunnelService, FunnelAdvanceResult } from '@/services/funnelService';
import { parseSpreadsheetBuffer } from '@/services/spreadsheetService';
import { AuthService } from '@/services/authService';
import initialProjectsData from '@/data/initialProjects.json';

function getActiveUserName(): string {
  return AuthService.getCurrentUser()?.name || 'Equipe Quest';
}

export const KANBAN_COLUMNS: KanbanColumnConfig[] = [
  {
    id: 'col_90',
    title: '90 Dias',
    subtitle: 'Vencimento em torno de 90 dias ou superior (> 60 dias)',
    badgeLabel: 'Prazo Seguro',
    minDays: 61,
    accentColor: '#10b981', // emerald
    lightBg: 'bg-emerald-50/60',
    borderClass: 'border-emerald-200',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    headerBg: 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white',
  },
  {
    id: 'col_60',
    title: '60 Dias',
    subtitle: 'Vencimento entre 46 e 60 dias restantes',
    badgeLabel: 'Atenção Operacional',
    minDays: 46,
    maxDays: 60,
    accentColor: '#0284c7', // sky
    lightBg: 'bg-sky-50/60',
    borderClass: 'border-sky-200',
    badgeClass: 'bg-sky-100 text-sky-800 border-sky-300',
    headerBg: 'bg-gradient-to-r from-sky-600 to-blue-700 text-white',
  },
  {
    id: 'col_45',
    title: '45 Dias',
    subtitle: 'Alerta para preparar prorrogação (33 a 45 dias)',
    badgeLabel: 'Alerta Prorrogação',
    minDays: 33,
    maxDays: 45,
    accentColor: '#f59e0b', // amber
    lightBg: 'bg-amber-50/60',
    borderClass: 'border-amber-200',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
    headerBg: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white',
  },
  {
    id: 'col_risk',
    title: '32 Dias (Risco)',
    subtitle: 'Limite legal para pedir prorrogação (<= 32 dias)',
    badgeLabel: 'Ação Imediata',
    maxDays: 32,
    accentColor: '#ef4444', // red
    lightBg: 'bg-red-50/60',
    borderClass: 'border-red-200',
    badgeClass: 'bg-red-100 text-red-800 border-red-300 animate-pulse',
    headerBg: 'bg-gradient-to-r from-red-600 to-rose-700 text-white',
  },
  {
    id: 'col_completed',
    title: 'Concluídos / Finalizados',
    subtitle: 'Prestação de contas apresentada / Finalizado',
    badgeLabel: 'Finalizado',
    accentColor: '#0d9488', // teal
    lightBg: 'bg-teal-50/60',
    borderClass: 'border-teal-200',
    badgeClass: 'bg-teal-100 text-teal-800 border-teal-300',
    headerBg: 'bg-gradient-to-r from-teal-600 to-emerald-700 text-white',
  },
];

export type TreatyFilter = 'ALL' | 'ACTIVE' | 'TREATY' | 'COMPLETED';

interface ProjectContextType {
  projects: Project[];
  columns: KanbanColumnConfig[];
  selectedMechanism: string;
  setSelectedMechanism: (mech: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  treatyFilter: TreatyFilter;
  setTreatyFilter: (tf: TreatyFilter) => void;
  filteredProjects: Project[];
  availableMechanisms: string[];
  historyLogs: NotificationLog[];
  isAdvancingFunnel: boolean;
  activeToast: NotificationLog | null;
  dismissToast: () => void;
  // Ações
  moveCard: (cardId: string, toColumn: KanbanColumnId, reason?: string) => Promise<void>;
  updateKvStatus: (cardId: string, status: KvStatus) => void;
  toggleProacField: (cardId: string, field: 'agendaViva' | 'proacSystem') => void;
  toggleTreaty: (cardId: string) => void;
  toggleCompleted: (cardId: string) => void;
  addProjectHistoryNote: (cardId: string, noteText: string) => void;
  addProject: (newProj: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProject: (id: string, updates: Partial<Project>, logNote?: string) => void;
  deleteProject: (id: string) => void;
  importSpreadsheet: (buffer: ArrayBuffer, replaceAll?: boolean) => ImportResult;
  clearAllProjects: () => boolean;
  runFunnelAdvance: (force?: boolean) => Promise<FunnelAdvanceResult>;
  sendDailyReportEmail: () => Promise<{ log: NotificationLog; summary: any }>;
  resetToDefault: () => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'quest_deadline_control_projects_v5';

// Normaliza colunas legadas e garante que concluídos fiquem em col_completed
function normalizeColumn(col: string, isCompleted?: boolean): KanbanColumnId {
  if (isCompleted || col === 'col_completed') return 'col_completed';
  if (col === 'col_30') return 'col_45';
  if (col === 'col_32') return 'col_risk';
  if (col === 'col_90' || col === 'col_60' || col === 'col_45' || col === 'col_risk' || col === 'col_completed') return col;
  return 'col_90';
}

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((p: Project) => ({
              ...p,
              columnId: normalizeColumn(p.columnId, p.isCompleted),
            }));
          }
        }
      } catch (err) {
        console.warn('Erro ao carregar do cache local:', err);
      }
    }
    return (initialProjectsData as Project[]).map((p) => ({
      ...p,
      columnId: normalizeColumn(p.columnId, p.isCompleted),
    }));
  });

  const [selectedMechanism, setSelectedMechanism] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [treatyFilter, setTreatyFilter] = useState<TreatyFilter>('ALL');
  const [historyLogs, setHistoryLogs] = useState<NotificationLog[]>([]);
  const [isAdvancingFunnel, setIsAdvancingFunnel] = useState<boolean>(false);
  const [activeToast, setActiveToast] = useState<NotificationLog | null>(null);

  // Salva no localStorage quando mudar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(projects));
      } catch (err) {
        console.warn('Erro ao salvar no localStorage:', err);
      }
    }
  }, [projects]);

  // Registra ouvinte do serviço de notificações
  useEffect(() => {
    const unsubscribe = notificationService.subscribe((log) => {
      setHistoryLogs((prev) => [log, ...prev].slice(0, 50));
      setActiveToast(log);
    });
    return unsubscribe;
  }, []);

  const dismissToast = useCallback(() => {
    setActiveToast(null);
  }, []);

  // Extrai lista única de mecanismos/leis
  const availableMechanisms = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => {
      if (p.lawMechanism && p.lawMechanism !== 'Sem informação Migrada') {
        set.add(p.lawMechanism);
      }
    });
    return ['Todos', ...Array.from(set).sort()];
  }, [projects]);

  // Filtra projetos por mecanismo, filtro de tratativa/concluídos e termo de busca
  const filteredProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return projects.filter((p) => {
      // Filtro de mecanismo
      if (selectedMechanism !== 'Todos' && p.lawMechanism !== selectedMechanism) {
        return false;
      }
      // Filtro de status / tratativa / concluído
      if (treatyFilter === 'ACTIVE' && (p.isCompleted || (p.isInTreaty && !p.status.includes('Prorrogação')))) {
        return false;
      }
      if (treatyFilter === 'TREATY' && (!p.isInTreaty || p.isCompleted)) {
        return false;
      }
      if (treatyFilter === 'COMPLETED' && !p.isCompleted) {
        return false;
      }
      // Filtro de busca textual
      if (!q) return true;
      const matchName = (p.name || '').toLowerCase().includes(q);
      const matchCode = (p.code || '').toLowerCase().includes(q);
      const matchClient = (p.client || '').toLowerCase().includes(q);
      const matchSponsor = (p.sponsor || '').toLowerCase().includes(q);
      const matchResponsible = (p.responsible || '').toLowerCase().includes(q);
      const matchStatus = (p.status || '').toLowerCase().includes(q);
      const matchNotes = (p.notes || '').toLowerCase().includes(q);
      const matchReadeq = (p.readequationNotes || '').toLowerCase().includes(q);
      return matchName || matchCode || matchClient || matchSponsor || matchResponsible || matchStatus || matchNotes || matchReadeq;
    });
  }, [projects, selectedMechanism, treatyFilter, searchQuery]);

  // Movimentação de Card (Drag and Drop ou Manual)
  const moveCard = useCallback(
    async (cardId: string, toColumn: KanbanColumnId, reason?: string) => {
      const normalizedTo = normalizeColumn(toColumn);
      const project = projects.find((p) => p.id === cardId);
      if (!project || project.columnId === normalizedTo) return;

      const fromColumn = project.columnId;
      const isMovingToCompleted = normalizedTo === 'col_completed';
      const isMovingFromCompleted = fromColumn === 'col_completed';
      const now = new Date().toISOString();

      const historyEntry: ProjectHistoryEntry = {
        id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: now,
        user: getActiveUserName(),
        action: `Movido de "${fromColumn}" para "${normalizedTo}"`,
        details: reason || 'Movimentação manual no quadro Kanban',
      };

      setProjects((prev) =>
        prev.map((p) =>
          p.id === cardId
            ? {
                ...p,
                columnId: normalizedTo,
                isCompleted: isMovingToCompleted ? true : (isMovingFromCompleted ? false : p.isCompleted),
                isInTreaty: isMovingToCompleted ? true : p.isInTreaty,
                isManualColumn: true,
                history: [historyEntry, ...(p.history || [])],
                updatedAt: now,
              }
            : p
        )
      );

      const moveEvent: CardMoveEvent = {
        cardId,
        projectName: project.name,
        fromColumn,
        toColumn: normalizedTo,
        timestamp: now,
        movedBy: 'Usuário (Painel Kanban Quest)',
        reason: reason || 'Movimentação manual de ajuste operacional',
      };

      await notificationService.onCardMove(moveEvent);
    },
    [projects]
  );

  // Atualização rápida de KV / Arte Digital
  const updateKvStatus = useCallback((cardId: string, status: KvStatus) => {
    const now = new Date().toISOString();
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== cardId) return p;
        const sent = status !== 'nao_enviado';
        const historyEntry: ProjectHistoryEntry = {
          id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          timestamp: now,
          user: getActiveUserName(),
          action: 'Atualização de KV / Arte Digital',
          details: `Status alterado de "${p.kvStatus || 'nao_enviado'}" para "${status}"`,
        };
        return {
          ...p,
          kvStatus: status,
          kvSent: sent,
          history: [historyEntry, ...(p.history || [])],
          updatedAt: now,
        };
      })
    );
  }, []);

  // Alternar sinalização PROAC ICMS (Agenda Viva ou Sistema PROAC)
  const toggleProacField = useCallback((cardId: string, field: 'agendaViva' | 'proacSystem') => {
    const now = new Date().toISOString();
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== cardId) return p;
        const isAgenda = field === 'agendaViva';
        const newVal = isAgenda ? !p.agendaVivaRegistered : !p.proacSystemRegistered;
        const fieldName = isAgenda ? 'Agenda Viva' : 'Sistema PROAC';
        const historyEntry: ProjectHistoryEntry = {
          id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          timestamp: now,
          user: getActiveUserName(),
          action: `PROAC: ${fieldName}`,
          details: `${fieldName} marcado como ${newVal ? 'Cadastrado' : 'Pendente'}`,
        };
        return {
          ...p,
          agendaVivaRegistered: isAgenda ? newVal : p.agendaVivaRegistered,
          proacSystemRegistered: !isAgenda ? newVal : p.proacSystemRegistered,
          history: [historyEntry, ...(p.history || [])],
          updatedAt: now,
        };
      })
    );
  }, []);

  // Alternar se projeto está em tratativa
  const toggleTreaty = useCallback((cardId: string) => {
    const now = new Date().toISOString();
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== cardId) return p;
        const newInTreaty = !p.isInTreaty;
        let newTags = [...p.tags];
        if (newInTreaty && !newTags.includes('Projetos em Tratativa')) {
          newTags.push('Projetos em Tratativa');
        } else if (!newInTreaty) {
          newTags = newTags.filter((t) => t !== 'Projetos em Tratativa');
        }
        const historyEntry: ProjectHistoryEntry = {
          id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          timestamp: now,
          user: getActiveUserName(),
          action: newInTreaty ? 'Marcado como Em Tratativa' : 'Removido de Tratativa',
          details: newInTreaty ? 'Projeto em prorrogação ou prestação de contas' : 'Retornado ao fluxo normal',
        };
        return {
          ...p,
          isInTreaty: newInTreaty,
          tags: newTags,
          history: [historyEntry, ...(p.history || [])],
          updatedAt: now,
        };
      })
    );
  }, []);

  // Alternar se projeto está concluído
  const toggleCompleted = useCallback((cardId: string) => {
    const now = new Date().toISOString();
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== cardId) return p;
        const newCompleted = !p.isCompleted;
        const newColumn: KanbanColumnId = newCompleted ? 'col_completed' : 'col_90';
        const historyEntry: ProjectHistoryEntry = {
          id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          timestamp: now,
          user: getActiveUserName(),
          action: newCompleted ? 'Conclusão de Projeto' : 'Reabertura de Projeto',
          details: newCompleted 
            ? 'Movido para Concluídos / Finalizados (Prestação de Contas Apresentada)' 
            : 'Removido de Concluídos e retornado para fluxo de prazos',
        };
        return {
          ...p,
          isCompleted: newCompleted,
          isInTreaty: newCompleted ? true : p.isInTreaty,
          columnId: newColumn,
          history: [historyEntry, ...(p.history || [])],
          updatedAt: now,
        };
      })
    );
  }, []);

  // Adicionar anotação manual ao histórico do projeto
  const addProjectHistoryNote = useCallback((cardId: string, noteText: string) => {
    if (!noteText.trim()) return;
    const now = new Date().toISOString();
    const historyEntry: ProjectHistoryEntry = {
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: now,
      user: getActiveUserName(),
      action: 'Anotação / Observação Registrada',
      details: noteText.trim(),
    };
    setProjects((prev) =>
      prev.map((p) =>
        p.id === cardId
          ? {
              ...p,
              history: [historyEntry, ...(p.history || [])],
              updatedAt: now,
            }
          : p
      )
    );
  }, []);

  // Adicionar novo projeto manualmente
  const addProject = useCallback(
    (newProjData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString();
      const newId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const historyEntry: ProjectHistoryEntry = {
        id: `hist_${Date.now()}_init`,
        timestamp: now,
        user: getActiveUserName(),
        action: 'Criação do Projeto',
        details: 'Projeto cadastrado manualmente no sistema',
      };
      const newProj: Project = {
        ...newProjData,
        columnId: normalizeColumn(newProjData.columnId, newProjData.isCompleted),
        id: newId,
        history: [historyEntry],
        createdAt: now,
        updatedAt: now,
      };
      setProjects((prev) => [newProj, ...prev]);
    },
    []
  );

  // Editar projeto existente com registro detalhado de histórico
  const updateProject = useCallback((id: string, updates: Partial<Project>, logNote?: string) => {
    const now = new Date().toISOString();
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;

        let targetCol = updates.columnId || p.columnId;
        if (updates.isCompleted === true) {
          targetCol = 'col_completed';
        } else if (updates.isCompleted === false && targetCol === 'col_completed') {
          targetCol = 'col_90';
        }

        // Mapeia mudanças para histórico
        const changes: { field: string; from: any; to: any }[] = [];
        (Object.keys(updates) as (keyof Project)[]).forEach((key) => {
          if (key !== 'updatedAt' && key !== 'history' && updates[key] !== undefined && updates[key] !== (p as any)[key]) {
            changes.push({ field: key, from: (p as any)[key], to: updates[key] });
          }
        });

        const historyEntry: ProjectHistoryEntry = {
          id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          timestamp: now,
          user: getActiveUserName(),
          action: logNote || (changes.length > 0 ? `Atualizou: ${changes.map(c => c.field).join(', ')}` : 'Edição de dados do projeto'),
          details: changes.map(c => `${c.field}: "${c.from ?? 'vazio'}" ➔ "${c.to ?? 'vazio'}"`).join(' | '),
          changes,
        };

        return {
          ...p,
          ...updates,
          columnId: targetCol,
          history: [historyEntry, ...(p.history || [])],
          updatedAt: now,
        };
      })
    );
  }, []);

  // Excluir projeto
  const deleteProject = useCallback((id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // Importar Planilha Excel (.xlsx / .csv) com opção de substituir base
  const importSpreadsheet = useCallback(
    (buffer: ArrayBuffer, replaceAll: boolean = false): ImportResult => {
      const baseProjects = replaceAll ? [] : projects;
      const { projects: updatedList, result } = parseSpreadsheetBuffer(buffer, baseProjects);
      setProjects(updatedList);
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));
      }
      return result;
    },
    [projects]
  );

  // Limpar toda a base de projetos para importação limpa
  const clearAllProjects = useCallback((): boolean => {
    if (confirm('Tem certeza de que deseja limpar todos os projetos cadastrados? A base ficará zerada para você importar a planilha atualizada.')) {
      setProjects([]);
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([]));
      }
      return true;
    }
    return false;
  }, []);

  // Executar Avanço Automático do Funil
  const runFunnelAdvance = useCallback(
    async (force: boolean = false): Promise<FunnelAdvanceResult> => {
      setIsAdvancingFunnel(true);
      try {
        const { updatedProjects, result } = await FunnelService.checkAndAdvanceFunnel(projects, force);
        setProjects(updatedProjects);
        return result;
      } finally {
        setIsAdvancingFunnel(false);
      }
    },
    [projects]
  );

  // Disparo de Relatório Geral Diário por e-mail para os 4 destinatários
  const sendDailyReportEmail = useCallback(async () => {
    return await notificationService.sendDailySummaryReport(projects);
  }, [projects]);

  // Restaurar dados originais da planilha Quest Consult
  const resetToDefault = useCallback(() => {
    if (confirm('Deseja restaurar a base de dados original da planilha Quest Consult com a Coluna C atualizada?')) {
      const fresh = (initialProjectsData as Project[]).map((p) => ({
        ...p,
        columnId: normalizeColumn(p.columnId),
      }));
      setProjects(fresh);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    }
  }, []);

  return (
    <ProjectContext.Provider
      value={{
        projects,
        columns: KANBAN_COLUMNS,
        selectedMechanism,
        setSelectedMechanism,
        searchQuery,
        setSearchQuery,
        treatyFilter,
        setTreatyFilter,
        filteredProjects,
        availableMechanisms,
        historyLogs,
        isAdvancingFunnel,
        activeToast,
        dismissToast,
        moveCard,
        updateKvStatus,
        toggleProacField,
        toggleTreaty,
        toggleCompleted,
        addProjectHistoryNote,
        addProject,
        updateProject,
        deleteProject,
        importSpreadsheet,
        clearAllProjects,
        runFunnelAdvance,
        sendDailyReportEmail,
        resetToDefault,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjects deve ser utilizado dentro de um ProjectProvider');
  }
  return context;
};
