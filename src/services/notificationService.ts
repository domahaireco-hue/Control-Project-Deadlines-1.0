/**
 * Notification Service & Event Dispatcher
 * Desenvolvido para Quest Consult
 * 
 * Gerencia o disparo diário de relatórios em PDF por e-mail e alertas de movimentação
 */

import { CardMoveEvent, NotificationRecipient, NotificationLog, KanbanColumnId, Project } from '@/types';

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
    const isCritical = event.toColumn === 'col_risk' || event.toColumn === 'col_32';

    const subject = isCritical
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
   * Dispara o Relatório Diário Geral com anexo/dados para os 4 destinatários fixos
   */
  public async sendDailySummaryReport(projects: Project[]): Promise<{ log: NotificationLog; summary: any }> {
    const dateFormatted = new Date().toLocaleDateString('pt-BR');
    const timeFormatted = new Date().toLocaleTimeString('pt-BR');

    const totalProjects = projects.length;
    const risk32 = projects.filter((p) => (p.columnId === 'col_risk' || p.columnId === 'col_32') && !p.isInTreaty);
    const alert45 = projects.filter((p) => (p.columnId === 'col_45' || p.columnId === 'col_30') && !p.isInTreaty);
    const op60 = projects.filter((p) => p.columnId === 'col_60' && !p.isInTreaty);
    const safe90 = projects.filter((p) => p.columnId === 'col_90' && !p.isInTreaty);
    const inTreaty = projects.filter((p) => p.isInTreaty || p.status.includes('Prestação') || p.status.includes('Não precisa'));

    const kvApproved = projects.filter((p) => p.kvStatus === 'aprovada').length;
    const kvInReview = projects.filter((p) => p.kvStatus === 'em_aprovacao').length;
    const kvPending = projects.filter((p) => !p.kvStatus || p.kvStatus === 'nao_enviado').length;

    const subject = `📊 [RELATÓRIO DIÁRIO QUEST CONSULT - ${dateFormatted}] Controle Geral de Prazos & Projetos`;

    const summaryText = `
RELATÓRIO GERAL DIÁRIO DE CONTROLE DE PRAZOS - QUEST CONSULT
Data de Emissão: ${dateFormatted} às ${timeFormatted}

DESTINATÁRIOS:
${this.recipients.map((r) => `• ${r.name} <${r.email}>`).join('\n')}

RESUMO EXECUTIVO DO KANBAN:
• Total de Projetos Cadastrados: ${totalProjects}
• 🔴 32 Dias (Limite Legal de Prorrogação / Risco): ${risk32.length} projeto(s)
• 🟠 45 Dias (Alerta de Prorrogação): ${alert45.length} projeto(s)
• 🔵 60 Dias (Atenção Operacional): ${op60.length} projeto(s)
• 🟢 90 Dias (Prazo Confortável): ${safe90.length} projeto(s)
• 🟣 Projetos em Tratativa (Prestação de Contas / Concluídos): ${inTreaty.length} projeto(s)

STATUS DE ARTES / KV DIGITAL:
• Aprovadas: ${kvApproved}
• Em Aprovação: ${kvInReview}
• Pendente de Envio: ${kvPending}

PROJETOS CRÍTICOS (32 DIAS - AÇÃO IMEDIATA):
${
  risk32.length === 0
    ? 'Nenhum projeto em risco crítico hoje.'
    : risk32
        .map(
          (p) =>
            `- [${p.code}] ${p.name} | ${p.lawMechanism} | Vence em: ${p.daysRemaining ?? 'N/D'} dias | KV: ${p.kvStatus || 'Pendente'}`
        )
        .join('\n')
}

Para visualizar o painel completo ou baixar o PDF em modo paisagem, acesse:
http://localhost:3000
    `.trim();

    const log: NotificationLog = {
      id: `daily_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      recipients: this.recipients.map((r) => r.email),
      subject,
      preview: `Relatório Geral Diário enviado para ${this.recipients.length} destinatários (${risk32.length} críticos em 32 dias)`,
      status: 'SENT_MOCK',
    };

    this.logs.unshift(log);
    if (this.logs.length > 50) this.logs.pop();
    this.notifyListeners(log);

    return {
      log,
      summary: {
        totalProjects,
        risk32Count: risk32.length,
        alert45Count: alert45.length,
        op60Count: op60.length,
        safe90Count: safe90.length,
        inTreatyCount: inTreaty.length,
        recipients: this.recipients,
        body: summaryText,
      },
    };
  }
}

export const notificationService = new NotificationService();
