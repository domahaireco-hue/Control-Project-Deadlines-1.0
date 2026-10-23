/**
 * Notification Service & Event Dispatcher
 * Desenvolvido para Quest Consult
 * 
 * Gerencia o disparo de alertas e e-mails para movimentação de cards e funil
 */

import { CardMoveEvent, NotificationRecipient, NotificationLog, KanbanColumnId } from '@/types';

export const DEFAULT_RECIPIENTS: NotificationRecipient[] = [
  {
    name: 'Diretoria Executiva',
    email: 'diretoria@questconsult.com.br',
    role: 'Acompanhamento Estratégico',
  },
  {
    name: 'Coordenação de Projetos',
    email: 'gestao.projetos@questconsult.com.br',
    role: 'Gestão Operacional',
  },
  {
    name: 'Operações & Compliance',
    email: 'operacoes@questconsult.com.br',
    role: 'Auditoria de Prazos',
  },
];

const COLUMN_NAMES: Record<KanbanColumnId, string> = {
  col_90: '90 Dias (Prazo Confortável)',
  col_60: '60 Dias (Atenção)',
  col_30: '30 Dias (Alerta de Vencimento)',
  col_risk: 'Risco (15 Dias Críticos)',
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
    const isCritical = event.toColumn === 'col_risk';

    const subject = isCritical
      ? `🚨 [ALERTA CRÍTICO QUEST CONSULT] Projeto "${event.projectName}" entrou na coluna de RISCO!`
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
${event.autoAdvancement ? '- Gatilho: Avanço Automático de Funil (Cron Job Diário)' : ''}

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
      preview: `Projeto "${event.projectName}" movido de [${fromName}] para [${toName}]`,
      status: 'SENT_MOCK',
      eventData: event,
    };

    // Registra log internamente
    this.logs.unshift(log);
    if (this.logs.length > 50) this.logs.pop();

    // Emite para ouvintes (UI toast, drawer)
    this.notifyListeners(log);

    // Mock de disparo de e-mail (aqui seria inserido nodemailer / resend / sendgrid)
    if (process.env.NODE_ENV !== 'test') {
      console.log('----------------------------------------------------');
      console.log(`[NotificationService] DISPARO DE E-MAIL MOCKADO (3 Destinatários)`);
      console.log(`Assunto: ${subject}`);
      console.log(`Destinatários: ${this.recipients.map((r) => r.email).join(', ')}`);
      console.log(`Prévia:\n${body}`);
      console.log('----------------------------------------------------');
    }

    return log;
  }
}

export const notificationService = new NotificationService();
