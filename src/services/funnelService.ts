/**
 * Funnel Advancement Service
 * Desenvolvido para Quest Consult
 * 
 * Rotina diária de recálculo de prazos e avanço automático de cards
 */

import { Project, CardMoveEvent, KanbanColumnId } from '@/types';
import { calculateDaysRemaining, determineKanbanColumn } from './spreadsheetService';
import { notificationService } from './notificationService';

export interface FunnelAdvanceResult {
  totalAnalyzed: number;
  movedCount: number;
  unchangedCount: number;
  manualLockedCount: number;
  movedProjects: Array<{
    project: Project;
    fromColumn: KanbanColumnId;
    toColumn: KanbanColumnId;
  }>;
  executedAt: string;
}

export class FunnelService {
  /**
   * Executa a verificação diária e avança os cards no funil conforme vencimento
   * @param projects Lista atual de projetos
   * @param forceRecalculateManual Se true, ignora trava de posicionamento manual
   */
  public static async checkAndAdvanceFunnel(
    projects: Project[],
    forceRecalculateManual: boolean = false
  ): Promise<{ updatedProjects: Project[]; result: FunnelAdvanceResult }> {
    const movedProjects: FunnelAdvanceResult['movedProjects'] = [];
    let manualLockedCount = 0;
    let unchangedCount = 0;

    const updatedProjects = await Promise.all(
      projects.map(async (project) => {
        // Se não tem data alvo, mantém
        if (!project.targetDate) {
          unchangedCount++;
          return project;
        }

        // Recalcula dias restantes com base na data de hoje
        const currentDaysRemaining = calculateDaysRemaining(project.targetDate);
        const correctColumn = determineKanbanColumn(currentDaysRemaining);

        // Se o card foi posicionado manualmente e não estamos forçando, respeita o usuário
        if (project.isManualColumn && !forceRecalculateManual) {
          manualLockedCount++;
          return {
            ...project,
            daysRemaining: currentDaysRemaining,
            updatedAt: new Date().toISOString(),
          };
        }

        // Verifica se a coluna mudou
        if (project.columnId !== correctColumn) {
          const fromColumn = project.columnId;
          const updatedProject: Project = {
            ...project,
            columnId: correctColumn,
            daysRemaining: currentDaysRemaining,
            updatedAt: new Date().toISOString(),
          };

          movedProjects.push({
            project: updatedProject,
            fromColumn,
            toColumn: correctColumn,
          });

          // Dispara o evento de movimentação automática
          const moveEvent: CardMoveEvent = {
            cardId: project.id,
            projectName: project.name,
            fromColumn,
            toColumn: correctColumn,
            timestamp: new Date().toISOString(),
            movedBy: 'Sistema (Rotina Automática de Prazos)',
            reason: `Avanço de Funil por decurso de prazo (${currentDaysRemaining ?? 'N/D'} dias restantes)`,
            autoAdvancement: true,
          };

          await notificationService.onCardMove(moveEvent);

          return updatedProject;
        }

        unchangedCount++;
        return {
          ...project,
          daysRemaining: currentDaysRemaining,
        };
      })
    );

    const result: FunnelAdvanceResult = {
      totalAnalyzed: projects.length,
      movedCount: movedProjects.length,
      unchangedCount,
      manualLockedCount,
      movedProjects,
      executedAt: new Date().toISOString(),
    };

    return { updatedProjects, result };
  }
}
