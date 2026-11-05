/**
 * AgentMail & WhatsApp Notification Service
 * Quest Deadline Control • Quest Consult
 * 
 * Integração com a API AgentMail (https://docs.agentmail.to/api-reference)
 * Disparo de alertas de projetos em Tratativa (72h em 72h para catelani@questconsult.com.br)
 * e alertas diários / WhatsApp (11992434262) para projetos a vencer.
 */

import { Project } from '@/types';

const AGENTMAIL_API_KEY =
  process.env.AGENTMAIL_API_KEY ||
  'am_us_51fa636ef919e5a8f7a699f8742423c7b3a4d19b4988361a3047583d10e76839';

const AGENTMAIL_INBOX_ID =
  process.env.AGENTMAIL_INBOX_ID || 'b-6243@agentmail.to';

const TREATY_ALERT_RECIPIENT = 'catelani@questconsult.com.br';
const WHATSAPP_ALERT_PHONE = '5511992434262';

export interface SendMailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class AgentMailService {
  /**
   * Envia e-mail através da API REST do AgentMail
   */
  public static async sendEmail({
    to,
    subject,
    text,
    html,
  }: {
    to: string[];
    subject: string;
    text: string;
    html: string;
  }): Promise<SendMailResult> {
    try {
      const response = await fetch(
        `https://api.agentmail.to/v0/inboxes/${AGENTMAIL_INBOX_ID}/messages/send`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${AGENTMAIL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to,
            subject,
            text,
            html,
            labels: ['quest-deadline-control', 'prazos'],
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error('[AgentMailService] Erro ao enviar:', data);
        return { success: false, error: data?.message || 'Erro na API AgentMail' };
      }

      return {
        success: true,
        messageId: data?.message_id,
      };
    } catch (err: any) {
      console.error('[AgentMailService] Falha de conexão com AgentMail:', err);
      return { success: false, error: err?.message || 'Falha de rede com AgentMail' };
    }
  }

  /**
   * Alerta imediato disparado quando um projeto entra em Tratativa (Prorrogação solicitada)
   */
  public static async sendTreatyImmediateAlert(
    project: Project,
    triggeredBy: string = 'Equipe Quest'
  ): Promise<SendMailResult> {
    const subject = `⚠️ [TRATATIVA] Projeto em Prorrogação/Tratativa: ${project.name}`;

    const text = `QUEST CONSULT • CONTROLE DE PRAZOS
Alerta de Projeto em Tratativa

O projeto abaixo acabou de ser marcado como "Em Tratativa / Prorrogação":

Projeto: ${project.name}
Código / PRONAC: ${project.code || 'Sem informação'}
Mecanismo: ${project.lawMechanism} ${project.amendmentType ? `(${project.amendmentType})` : ''}
Data de Entrega: ${project.targetDate || 'Não definida'}
Status Atual: ${project.status || 'Em Execução'}
Última Anotação: ${project.notes || 'Nenhuma observação registrada'}
Responsável pela Ação: ${triggeredBy}

Acompanhamento periódico ativado (avaliação a cada 72 horas).`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #7e22ce, #4338ca); padding: 18px 24px; border-radius: 8px; color: #ffffff; margin-bottom: 20px;">
          <h2 style="margin: 0; font-size: 18px; font-weight: 800; letter-spacing: -0.5px;">QUEST CONSULT • CONTROLE DE PRAZOS</h2>
          <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">Alerta Executivo: Projeto em Tratativa de Prorrogação</p>
        </div>

        <p style="font-size: 14px; color: #334155; line-height: 1.5;">
          Olá <strong>Thiago Catelani</strong>,
        </p>
        <p style="font-size: 14px; color: #334155; line-height: 1.5;">
          O projeto abaixo foi registrado em <strong>Tratativa / Prorrogação Solicitada</strong> no sistema Quest Deadline Control:
        </p>

        <div style="background-color: #faf5ff; border: 1px solid #e9d5ff; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #6b21a8;">${project.name}</h3>
          <table style="width: 100%; font-size: 13px; color: #475569; border-collapse: collapse;">
            <tr>
              <td style="padding: 4px 0; font-weight: bold; width: 140px;">Código / PRONAC:</td>
              <td style="padding: 4px 0;">${project.code || 'Sem informação'}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-weight: bold;">Mecanismo:</td>
              <td style="padding: 4px 0;">${project.lawMechanism} ${project.amendmentType ? `<span style="background: #f3e8ff; color: #7e22ce; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${project.amendmentType}</span>` : ''}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-weight: bold;">Data de Entrega:</td>
              <td style="padding: 4px 0;">${project.targetDate || 'Sem data definida'}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-weight: bold;">Status Atual:</td>
              <td style="padding: 4px 0; font-weight: 600; color: #0f172a;">${project.status || 'Em Execução'}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-weight: bold;">Observações / Readeq:</td>
              <td style="padding: 4px 0; color: #334155;">${project.notes || project.readequationNotes || 'Sem observações'}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-weight: bold;">Alterado por:</td>
              <td style="padding: 4px 0; color: #64748b;">${triggeredBy}</td>
            </tr>
          </table>
        </div>

        <p style="font-size: 12px; color: #64748b; line-height: 1.4;">
          ℹ️ Este projeto será acompanhado com reavaliação a cada <strong>72 horas (3 dias) às 08:00 AM</strong> até que a prorrogação seja deferida ou concluída.
        </p>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
          Quest Consult • Gestão Inteligente de Prazos e Compliance
        </p>
      </div>
    `;

    return this.sendEmail({
      to: [TREATY_ALERT_RECIPIENT],
      subject,
      text,
      html,
    });
  }

  /**
   * Resumo Periódico de 72h para todos os projetos atualmente em Tratativa
   */
  public static async sendTreatyRecurringDigest(
    projectsInTreaty: Project[]
  ): Promise<SendMailResult> {
    if (projectsInTreaty.length === 0) {
      return { success: true };
    }

    const count = projectsInTreaty.length;
    const subject = `📋 [RELATÓRIO 72H] ${count} Projeto(s) em Tratativa / Prorrogação • Quest Consult`;

    const projectRowsText = projectsInTreaty
      .map(
        (p, idx) =>
          `${idx + 1}. ${p.name} | Código: ${p.code || 'S/N'} | Mecanismo: ${p.lawMechanism} | Status: ${p.status} | Obs: ${p.notes || '-'}`
      )
      .join('\n');

    const text = `QUEST CONSULT • CONTROLE DE PRAZOS
Relatório Recorrente de Tratativas (a cada 72 horas - 08:00 AM)

Existem atualmente ${count} projeto(s) com pedido de prorrogação ou tratativa em andamento:

${projectRowsText}

Acesse o sistema para registrar despachos e atualizações.`;

    const projectRowsHtml = projectsInTreaty
      .map(
        (p, idx) => `
        <tr style="border-bottom: 1px solid #e2e8f0; ${idx % 2 === 0 ? 'background-color: #faf5ff;' : 'background-color: #ffffff;'}">
          <td style="padding: 10px 8px; font-weight: bold; font-size: 12px; color: #7e22ce;">${idx + 1}</td>
          <td style="padding: 10px 8px; font-size: 12px; color: #0f172a;">
            <strong>${p.name}</strong>
            <span style="display: block; font-size: 11px; color: #64748b;">${p.code ? `#${p.code.split('\n')[0]}` : ''} • ${p.lawMechanism} ${p.amendmentType ? `(${p.amendmentType})` : ''}</span>
          </td>
          <td style="padding: 10px 8px; font-size: 11px; color: #334155;">${p.status || 'Em Execução'}</td>
          <td style="padding: 10px 8px; font-size: 11px; color: #64748b;">${p.notes || p.readequationNotes || '—'}</td>
        </tr>
      `
      )
      .join('');

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 680px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #7e22ce, #4338ca); padding: 18px 24px; border-radius: 8px; color: #ffffff; margin-bottom: 20px;">
          <h2 style="margin: 0; font-size: 18px; font-weight: 800;">QUEST CONSULT • CONTROLE DE PRAZOS</h2>
          <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">Relatório Recorrente de 72 Horas • Projetos em Tratativa (${count})</p>
        </div>

        <p style="font-size: 14px; color: #334155; line-height: 1.5;">
          Olá <strong>Thiago Catelani</strong>,
        </p>
        <p style="font-size: 14px; color: #334155; line-height: 1.5;">
          Segue o panorama consolidado dos <strong>${count} projeto(s)</strong> que estão com prorrogação solicitada ou em análise nos órgãos competentes:
        </p>

        <table style="width: 100%; border-collapse: collapse; margin: 16px 0; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background-color: #6b21a8; color: #ffffff; font-size: 11px; text-align: left;">
              <th style="padding: 8px;">#</th>
              <th style="padding: 8px;">Projeto / Mecanismo</th>
              <th style="padding: 8px;">Status Atual</th>
              <th style="padding: 8px;">Última Observação</th>
            </tr>
          </thead>
          <tbody>
            ${projectRowsHtml}
          </tbody>
        </table>

        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; font-size: 12px; color: #475569;">
          ⏰ <strong>Frequência de envio:</strong> Este resumo é disparado automaticamente a cada 72 horas às 08:00 AM via AgentMail para acompanhamento de prorrogações.
        </div>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
          Quest Consult • Gestão Inteligente de Prazos e Compliance
        </p>
      </div>
    `;

    return this.sendEmail({
      to: [TREATY_ALERT_RECIPIENT],
      subject,
      text,
      html,
    });
  }

  /**
   * Alerta individual por e-mail quando um projeto estiver para vencer (<= 32 dias ou 45 dias)
   */
  public static async sendExpiringAlert(
    project: Project,
    recipientEmail: string = TREATY_ALERT_RECIPIENT
  ): Promise<SendMailResult> {
    const days = project.daysRemaining ?? 0;
    const isOverdue = days <= 0;
    const urgencyLabel = isOverdue
      ? `VENCIDO (${Math.abs(days)}d)`
      : `${days} dias restantes (Limite Legal 32d)`;

    const subject = `🚨 [URGÊNCIA] Vencimento de Projeto (${urgencyLabel}): ${project.name}`;

    const text = `QUEST CONSULT • ALERTA DE VENCIMENTO DE PROJETO
Projeto em fase crítica de prazo de execução:

Projeto: ${project.name}
Código / PRONAC: ${project.code || 'Sem informação'}
Prazo: ${urgencyLabel}
Data Prevista de Entrega: ${project.targetDate || 'Sem data'}
Mecanismo: ${project.lawMechanism}
Status: ${project.status || 'Em Execução'}
Observações: ${project.notes || 'Nenhuma'}

Ação recomendada: Solicitar prorrogação imediatamente ou concluir prestação de contas.`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #fecaca; border-radius: 12px; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #dc2626, #b91c1c); padding: 18px 24px; border-radius: 8px; color: #ffffff; margin-bottom: 20px;">
          <h2 style="margin: 0; font-size: 18px; font-weight: 800;">QUEST CONSULT • ALERTA CRÍTICO DE PRAZO</h2>
          <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">Ação Imediata: Prazo Legal para Prorrogação</p>
        </div>

        <div style="background-color: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #991b1b;">${project.name}</h3>
          <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: bold; color: #dc2626;">
            ⚠️ Situação: ${urgencyLabel} (Data Limite: ${project.targetDate || 'Indefinida'})
          </p>
          <table style="width: 100%; font-size: 13px; color: #475569; border-collapse: collapse;">
            <tr>
              <td style="padding: 4px 0; font-weight: bold; width: 140px;">Código / PRONAC:</td>
              <td style="padding: 4px 0;">${project.code || 'Sem informação'}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-weight: bold;">Mecanismo:</td>
              <td style="padding: 4px 0;">${project.lawMechanism} ${project.amendmentType ? `(${project.amendmentType})` : ''}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-weight: bold;">Status:</td>
              <td style="padding: 4px 0; font-weight: 600; color: #0f172a;">${project.status || 'Em Execução'}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-weight: bold;">Observações:</td>
              <td style="padding: 4px 0; color: #334155;">${project.notes || project.readequationNotes || 'Sem observações'}</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin: 20px 0;">
          <a href="${this.generateWhatsAppUrl(project)}" style="display: inline-block; background-color: #16a34a; color: #ffffff; padding: 12px 20px; border-radius: 8px; font-size: 13px; font-weight: bold; text-decoration: none;">
            📲 Disparar Alerta via WhatsApp (11 99243-4262)
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
          Quest Consult • Gestão Inteligente de Prazos e Compliance
        </p>
      </div>
    `;

    return this.sendEmail({
      to: [recipientEmail],
      subject,
      text,
      html,
    });
  }

  /**
   * Gera o link direto de WhatsApp (wa.me) para envio com 1 clique para o número 11 99243-4262
   */
  public static generateWhatsAppUrl(project: Project): string {
    const days = project.daysRemaining ?? 0;
    const isOverdue = days <= 0;
    const deadlineTxt = isOverdue
      ? `🚨 *VENCIDO (${Math.abs(days)} DIAS)*`
      : `⚠️ *RESTAM ${days} DIAS (Prazo Limite Legal)*`;

    const codeTxt = project.code && project.code !== 'Sem informação Migrada'
      ? `\n🔖 *Código/PRONAC:* ${project.code.split('\n')[0]}`
      : '';

    const emendaTxt = project.amendmentType ? ` (${project.amendmentType})` : '';

    const text = 
`🚨 *QUEST CONSULT • ALERTA DE VENCIMENTO DE PROJETO*

📁 *Projeto:* ${project.name}${codeTxt}
⏳ *Prazo:* ${deadlineTxt}
📅 *Data Limite Prevista:* ${project.targetDate || 'Sem data definida'}
⚖️ *Mecanismo:* ${project.lawMechanism}${emendaTxt}
📌 *Status Atual:* ${project.status || 'Em Execução'}
📝 *Obs/Acompanhamento:* ${project.notes || project.readequationNotes || 'Sem anotações adicionais'}

⚠️ *Atenção:* Necessário verificar solicitação de prorrogação ou prestação de contas imediatamente!`;

    return `https://wa.me/${WHATSAPP_ALERT_PHONE}?text=${encodeURIComponent(text)}`;
  }
}

