/**
 * Notification Service & Event Dispatcher
 * Desenvolvido para Quest Consult
 * 
 * Gerencia o disparo diário de relatórios em PDF por e-mail e alertas de movimentação
 */

import { CardMoveEvent, NotificationRecipient, NotificationLog, KanbanColumnId, Project } from '@/types';
import { isProjectCompleted, isProjectInDanger } from './spreadsheetService';

export const DEFAULT_RECIPIENTS: NotificationRecipient[] = [
  {
    name: 'Catelani',
    email: 'catelani@questconsult.com.br',
    role: 'Diretoria / Coordenação Geral',
  },
  {
    name: 'TK',
    email: 'tk@questconsult.com.br',
    role: 'Gestão Estratégica & Projetos',
  },
  {
    name: 'Lucas',
    email: 'lucas@questconsult.com.br',
    role: 'Operações & Prestação de Contas',
  },
  {
    name: 'Bruno Britto',
    email: 'bruno.britto@questconsult.com.br',
    role: 'Gestão de Prazos & Compliance',
  },
];

export const COLUMN_NAMES: Record<KanbanColumnId, string> = {
  col_90: '90 Dias (> 60 dias restantes)',
  col_60: '60 Dias (46 a 60 dias restantes)',
  col_45: '45 Dias (33 a 45 dias restantes - Preparar Prorrogação)',
  col_32: '32 Dias (<= 32 dias - Limite Legal de Prorrogação)',
  col_30: '45 Dias (Alerta de Prorrogação)',
  col_risk: '32 Dias (<= 32 dias - Limite Legal de Prorrogação)',
  col_treaty: 'Em Tratativa (Prorrogação Solicitada)',
  col_completed: 'Concluídos / Finalizados',
};

type NotificationListener = (log: NotificationLog) => void;

class NotificationService {
  private recipients: NotificationRecipient[] = [...DEFAULT_RECIPIENTS];
  private logs: NotificationLog[] = [];
  private listeners: Set<NotificationListener> = new Set();

  public getRecipients(): NotificationRecipient[] {
    return this.recipients;
  }

  public setRecipients(newRecipients: NotificationRecipient[]) {
    this.recipients = newRecipients;
  }

  public getLogs(): NotificationLog[] {
    return [...this.logs];
  }

  public subscribe(listener: NotificationListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(log: NotificationLog) {
    this.listeners.forEach((l) => {
      try {
        l(log);
      } catch (err) {
        console.error('Erro ao notificar listener:', err);
      }
    });
  }

  /**
   * Dispara notificação por e-mail quando um card é movimentado
   */
  public async onCardMove(event: CardMoveEvent): Promise<NotificationLog> {
    const fromName = COLUMN_NAMES[event.fromColumn] || event.fromColumn;
    const toName = COLUMN_NAMES[event.toColumn] || event.toColumn;
    const isCompleted = event.toColumn === 'col_completed';
    const isCritical = (event.toColumn === 'col_risk' || event.toColumn === 'col_32') && !isCompleted;

    const subject = isCompleted
      ? `✅ [Quest Deadline Control] Conclusão: "${event.projectName}" concluído / prestação de contas apresentada`
      : isCritical
        ? `🚨 [ALERTA CRÍTICO QUEST CONSULT - 32 DIAS] Projeto "${event.projectName}" entrou no limite legal de prorrogação!`
        : `ℹ️ [Quest Deadline Control] Movimentação: "${event.projectName}" movido para ${toName}`;

    const body = `
Prezados,

Informamos que o projeto "${event.projectName}" foi movimentado no painel Kanban de Controle de Prazos da Quest Consult.

Detalhes da Movimentação:
- Projeto: ${event.projectName}
- De: ${fromName}
- Para: ${toName}
- Movido por: ${event.movedBy}
- Horário: ${new Date(event.timestamp).toLocaleString('pt-BR')}
${event.reason ? `- Motivo: ${event.reason}` : ''}
${event.autoAdvancement ? '- Gatilho: Avanço Automático de Funil (Rotina Diária de Prazos)' : ''}

Destinatários Notificados:
${this.recipients.map((r) => `• ${r.name} (${r.email}) - ${r.role}`).join('\n')}

Atenciosamente,
Sistema Quest Deadline Control
Quest Consult
    `.trim();

    const log: NotificationLog = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      recipients: this.recipients.map((r) => r.email),
      subject,
      preview: `Projeto "${event.projectName}" movido para [${toName}]`,
      status: 'SENT_MOCK',
      eventData: event,
    };

    this.logs.unshift(log);
    if (this.logs.length > 50) this.logs.pop();
    this.notifyListeners(log);

    console.log('[NotificationService] E-mail de movimentação enviado para:', this.recipients.map((r) => r.email).join(', '));
    return log;
  }

  /**
   * Dispara o Relatório Semanal de Prazos Vencidos/Vincendos em PDF paisagem para os 4 destinatários fixos
   * Envia uma mensagem limpa de instrução orientando o acompanhamento do anexo em PDF paisagem.
   */
  public async sendDailySummaryReport(projects: Project[]): Promise<{ log: NotificationLog; summary: any }> {
    const dateFormatted = new Date().toLocaleDateString('pt-BR');

    const dangerProjects = projects.filter(isProjectInDanger);
    const completedProjects = projects.filter(isProjectCompleted);
    const inTreatyProjects = projects.filter((p) => (p.isInTreaty || p.columnId === 'col_treaty') && !isProjectCompleted(p));

    const subject = `[QUEST CONSULT - ${dateFormatted}] Relatório de Prazos Vencidos / Vincendos`;

    const summaryText = `Prezados,

Atualização:
Segue anexo relatório de prazos vencidos/vincendos referente aos projetos em questão. Qualquer dúvida devemos alinhar os próximos passos, fico à disposição.

Att: Bruno Britto
Quest Consult • Gestão de Prazos & Compliance`;

    const log: NotificationLog = {
      id: `daily_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      recipients: this.recipients.map((r) => r.email),
      subject,
      preview: `Instrução de relatório enviada para ${this.recipients.length} destinatários (Anexo PDF Paisagem de Prazos)`,
      status: 'SENT_MOCK',
    };

    this.logs.unshift(log);
    if (this.logs.length > 50) this.logs.pop();
    this.notifyListeners(log);

    return {
      log,
      summary: {
        dangerProjectsCount: dangerProjects.length,
        dangerProjects,
        completedCount: completedProjects.length,
        inTreatyCount: inTreatyProjects.length,
        recipients: this.recipients,
        body: summaryText,
      },
    };
  }
}

export const notificationService = new NotificationService();
