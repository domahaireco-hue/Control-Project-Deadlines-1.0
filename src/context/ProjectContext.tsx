'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Project, KanbanColumnConfig, KanbanColumnId, CardMoveEvent, NotificationLog, ImportResult } from '@/types';
import { notificationService } from '@/services/notificationService';
import { FunnelService, FunnelAdvanceResult } from '@/services/funnelService';
import { parseSpreadsheetBuffer } from '@/services/spreadsheetService';
import initialProjectsData from '@/data/initialProjects.json';

export const KANBAN_COLUMNS: KanbanColumnConfig[] = [
  {
    id: 'col_90',
    title: '90 Dias',
    subtitle: 'Vencimento em torno de 90 dias ou superior',
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
    subtitle: 'Vencimento em torno de 60 dias (31 a 60)',
    badgeLabel: 'Atenção Operacional',
    minDays: 31,
    maxDays: 60,
    accentColor: '#0284c7', // sky
    lightBg: 'bg-sky-50/60',
    borderClass: 'border-sky-200',
    badgeClass: 'bg-sky-100 text-sky-800 border-sky-300',
    headerBg: 'bg-gradient-to-r from-sky-600 to-blue-700 text-white',
  },
  {
    id: 'col_30',
    title: '30 Dias',
    subtitle: 'Vencimento próximo em 30 dias (16 a 30)',
    badgeLabel: 'Alerta de Entrega',
    minDays: 16,
    maxDays: 30,
    accentColor: '#f59e0b', // amber
    lightBg: 'bg-amber-50/60',
    borderClass: 'border-amber-200',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
    headerBg: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white',
  },
  {
    id: 'col_risk',
    title: 'Risco (15 Dias)',
    subtitle: 'Crítico: 15 dias ou menos restantes / vencidos',
    badgeLabel: 'Ação Imediata',
    maxDays: 15,
    accentColor: '#ef4444', // red
    lightBg: 'bg-red-50/60',
    borderClass: 'border-red-200',
    badgeClass: 'bg-red-100 text-red-800 border-red-300 animate-pulse',
    headerBg: 'bg-gradient-to-r from-red-600 to-rose-700 text-white',
  },
];

interface ProjectContextType {
  projects: Project[];
  columns: KanbanColumnConfig[];
  selectedMechanism: string;
  setSelectedMechanism: (mech: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filteredProjects: Project[];
  availableMechanisms: string[];
  historyLogs: NotificationLog[];
  isAdvancingFunnel: boolean;
  activeToast: NotificationLog | null;
  dismissToast: () => void;
  // Ações
  moveCard: (cardId: string, toColumn: KanbanColumnId, reason?: string) => Promise<void>;
  addProject: (newProj: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  importSpreadsheet: (buffer: ArrayBuffer) => ImportResult;
  runFunnelAdvance: (force?: boolean) => Promise<FunnelAdvanceResult>;
  resetToDefault: () => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'quest_deadline_control_projects_v1';

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (err) {
        console.warn('Erro ao carregar do cache local:', err);
      }
    }
    return initialProjectsData as Project[];
  });

  const [selectedMechanism, setSelectedMechanism] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
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

  // Filtra projetos por mecanismo e termo de busca
  const filteredProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return projects.filter((p) => {
      // Filtro de mecanismo
      if (selectedMechanism !== 'Todos' && p.lawMechanism !== selectedMechanism) {
        return false;
      }
      // Filtro de busca
      if (!q) return true;
      const matchName = p.name.toLowerCase().includes(q);
      const matchCode = p.code.toLowerCase().includes(q);
      const matchClient = p.client.toLowerCase().includes(q);
      const matchSponsor = p.sponsor.toLowerCase().includes(q);
      const matchResponsible = p.responsible.toLowerCase().includes(q);
      const matchStatus = p.status.toLowerCase().includes(q);
      return matchName || matchCode || matchClient || matchSponsor || matchResponsible || matchStatus;
    });
  }, [projects, selectedMechanism, searchQuery]);

  // Movimentação de Card (Drag and Drop ou Manual)
  const moveCard = useCallback(
    async (cardId: string, toColumn: KanbanColumnId, reason?: string) => {
      const project = projects.find((p) => p.id === cardId);
      if (!project || project.columnId === toColumn) return;

      const fromColumn = project.columnId;

      // Atualiza o estado
      setProjects((prev) =>
        prev.map((p) =>
          p.id === cardId
            ? {
                ...p,
                columnId: toColumn,
                isManualColumn: true, // Trava manual do usuário
                updatedAt: new Date().toISOString(),
              }
            : p
        )
      );

      // Dispara evento para o NotificationService
      const moveEvent: CardMoveEvent = {
        cardId,
        projectName: project.name,
        fromColumn,
        toColumn,
        timestamp: new Date().toISOString(),
        movedBy: 'Usuário (Painel Kanban Quest)',
        reason: reason || 'Movimentação manual de ajuste operacional',
      };

      await notificationService.onCardMove(moveEvent);
    },
    [projects]
  );

  // Adicionar novo projeto manualmente
  const addProject = useCallback(
    (newProjData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
      const newId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newProj: Project = {
        ...newProjData,
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

  // Restaurar dados originais da planilha anexada
  const resetToDefault = useCallback(() => {
    if (confirm('Deseja restaurar a base de dados original da planilha Quest Consult?')) {
      setProjects(initialProjectsData as Project[]);
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
        filteredProjects,
        availableMechanisms,
        historyLogs,
        isAdvancingFunnel,
        activeToast,
        dismissToast,
        moveCard,
        addProject,
        updateProject,
        deleteProject,
        importSpreadsheet,
        runFunnelAdvance,
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
