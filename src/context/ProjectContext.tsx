'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Project, KanbanColumnConfig, KanbanColumnId, CardMoveEvent, NotificationLog, ImportResult, KvStatus } from '@/types';
import { notificationService } from '@/services/notificationService';
import { FunnelService, FunnelAdvanceResult } from '@/services/funnelService';
import { parseSpreadsheetBuffer } from '@/services/spreadsheetService';
import initialProjectsData from '@/data/initialProjects.json';

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
  addProject: (newProj: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  importSpreadsheet: (buffer: ArrayBuffer) => ImportResult;
  runFunnelAdvance: (force?: boolean) => Promise<FunnelAdvanceResult>;
  sendDailyReportEmail: () => Promise<{ log: NotificationLog; summary: any }>;
  resetToDefault: () => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'quest_deadline_control_projects_v3';

// Normaliza colunas legadas se existirem
function normalizeColumn(col: string): KanbanColumnId {
  if (col === 'col_30') return 'col_45';
  if (col === 'col_32') return 'col_risk';
  if (col === 'col_90' || col === 'col_60' || col === 'col_45' || col === 'col_risk') return col;
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
              columnId: normalizeColumn(p.columnId),
            }));
          }
        }
      } catch (err) {
        console.warn('Erro ao carregar do cache local:', err);
      }
    }
    return (initialProjectsData as Project[]).map((p) => ({
      ...p,
      columnId: normalizeColumn(p.columnId),
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

      setProjects((prev) =>
        prev.map((p) =>
          p.id === cardId
            ? {
                ...p,
                columnId: normalizedTo,
                isManualColumn: true,
                updatedAt: new Date().toISOString(),
              }
            : p
        )
      );

      const moveEvent: CardMoveEvent = {
        cardId,
        projectName: project.name,
        fromColumn,
        toColumn: normalizedTo,
        timestamp: new Date().toISOString(),
        movedBy: 'Usuário (Painel Kanban Quest)',
        reason: reason || 'Movimentação manual de ajuste operacional',
      };

      await notificationService.onCardMove(moveEvent);
    },
    [projects]
  );

  // Atualização rápida de KV / Arte Digital
  const updateKvStatus = useCallback((cardId: string, status: KvStatus) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== cardId) return p;
        const sent = status !== 'nao_enviado';
        return {
          ...p,
          kvStatus: status,
          kvSent: sent,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  }, []);

  // Alternar sinalização PROAC ICMS (Agenda Viva ou Sistema PROAC)
  const toggleProacField = useCallback((cardId: string, field: 'agendaViva' | 'proacSystem') => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== cardId) return p;
        if (field === 'agendaViva') {
          return {
            ...p,
            agendaVivaRegistered: !p.agendaVivaRegistered,
            updatedAt: new Date().toISOString(),
          };
        } else {
          return {
            ...p,
            proacSystemRegistered: !p.proacSystemRegistered,
            updatedAt: new Date().toISOString(),
          };
        }
      })
    );
  }, []);

  // Alternar se projeto está em tratativa
  const toggleTreaty = useCallback((cardId: string) => {
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
        return {
          ...p,
          isInTreaty: newInTreaty,
          tags: newTags,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  }, []);

  // Alternar se projeto está concluído
  const toggleCompleted = useCallback((cardId: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== cardId) return p;
        const newCompleted = !p.isCompleted;
        return {
          ...p,
          isCompleted: newCompleted,
          isInTreaty: newCompleted ? true : p.isInTreaty,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  }, []);

  // Adicionar novo projeto manualmente
  const addProject = useCallback(
    (newProjData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
      const newId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newProj: Project = {
        ...newProjData,
        columnId: normalizeColumn(newProjData.columnId),
        id: newId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setProjects((prev) => [newProj, ...prev]);
    },
    []
  );

  // Editar projeto existente
  const updateProject = useCallback((id: string, updates: Partial<Project>) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p))
    );
  }, []);

  // Excluir projeto
  const deleteProject = useCallback((id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // Importar Planilha Excel (.xlsx / .csv)
  const importSpreadsheet = useCallback(
    (buffer: ArrayBuffer): ImportResult => {
      const { projects: updatedList, result } = parseSpreadsheetBuffer(buffer, projects);
      setProjects(updatedList);
      return result;
    },
    [projects]
  );

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
        addProject,
        updateProject,
        deleteProject,
        importSpreadsheet,
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
