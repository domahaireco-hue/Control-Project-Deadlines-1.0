'use client';

import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Send, 
  Printer, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  FileCheck2, 
  Building2, 
  ShieldAlert,
  Users,
  ExternalLink,
  Download,
  AlertCircle,
  FileText,
  Paperclip
} from 'lucide-react';
import { useProjects } from '@/context/ProjectContext';
import { DEFAULT_RECIPIENTS } from '@/services/notificationService';
import { PdfReportService } from '@/services/pdfReportService';
import { isProjectCompleted, isProjectInDanger } from '@/services/spreadsheetService';

interface DailyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DailyReportModal: React.FC<DailyReportModalProps> = ({ isOpen, onClose }) => {
  const { projects, sendDailyReportEmail } = useProjects();
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [manualGmailNotice, setManualGmailNotice] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filtragem dos projetos ativos por faixa de prazo (excluindo concluídos)
  const dangerProjects = projects.filter(isProjectInDanger);
  const completedProjects = projects.filter(isProjectCompleted);
  const treatyProjects = projects.filter((p) => (p.isInTreaty || p.columnId === 'col_treaty') && !isProjectCompleted(p));
  const alert45Projects = projects.filter((p) => (p.columnId === 'col_45' || p.columnId === 'col_30') && !isProjectCompleted(p) && !p.isInTreaty);
  const op60Projects = projects.filter((p) => p.columnId === 'col_60' && !isProjectCompleted(p) && !p.isInTreaty);
  const safe90Projects = projects.filter((p) => p.columnId === 'col_90' && !isProjectCompleted(p) && !p.isInTreaty);

  const countDanger = dangerProjects.length;
  const countCompleted = completedProjects.length;
  const countTreaty = treatyProjects.length;

  const buildEmailContent = () => {
    const dateFormatted = new Date().toLocaleDateString('pt-BR');
    const recipientEmails = DEFAULT_RECIPIENTS.map((r) => r.email).join(',');

    const subject = `[QUEST CONSULT - ${dateFormatted}] Relatório de Prazos Vencidos / Vincendos`;

    const body = `Prezados,

Atualização:
Segue anexo relatório de prazos vencidos/vincendos referente aos projetos em questão. Qualquer dúvida devemos alinhar os próximos passos, fico à disposição.

Att: Bruno Britto
Quest Consult • Gestão de Prazos & Compliance`;

    return { recipientEmails, subject, body };
  };

  /**
   * Disparo oficial direto com o PDF em anexo via API (AgentMail + Amazon SES)
   * e download simultâneo do PDF paisagem
   */
  const handleSendDirectEmailWithAttachment = async () => {
    setIsSending(true);
    setSendError(null);
    setSendSuccess(false);
    setManualGmailNotice(false);

    try {
      // 1. Gera o PDF oficial em formato paisagem (excluindo concluídos)
      const report = PdfReportService.generateLandscapeReport(projects);

      // 2. Faz o download do arquivo PDF para a máquina
      report.download();

      // 3. Dispara o e-mail oficial com o anexo PDF via API
      const res = await sendDailyReportEmail(report.base64, report.filename);

      if (res && res.emailSent) {
        setSendSuccess(true);
      } else {
        setSendError(res?.message || res?.mailError || 'Falha no disparo via API de e-mail. Verifique a conexão.');
      }
    } catch (err: any) {
      console.error('Erro ao enviar relatório com anexo:', err);
      setSendError(err?.message || 'Erro inesperado ao gerar PDF e disparar e-mail.');
    } finally {
      setIsSending(false);
    }
  };

  /**
   * Baixa apenas o PDF em formato paisagem
   */
  const handleDownloadPdfOnly = () => {
    const report = PdfReportService.generateLandscapeReport(projects);
    report.download();
  };

  /**
   * Envio manual pelo Gmail Web
   */
  const handleOpenGmailManual = () => {
    // 1. Baixa o PDF para anexar manualmente
    const report = PdfReportService.generateLandscapeReport(projects);
    report.download();

    // 2. Abre a janela do Gmail Web
    const { recipientEmails, subject, body } = buildEmailContent();
    const gmailUrl = `https://mail.google.com/mail/u/?authuser=bruno.britto@questconsult.com.br&view=cm&fs=1&to=${encodeURIComponent(recipientEmails)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, '_blank');

    setManualGmailNotice(true);
  };

  return (
    <div className="no-print fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in duration-200 my-8">
        
        {/* Header Modal */}
        <div className="bg-quest-900 text-white px-6 py-4 flex items-center justify-between border-b border-quest-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center">
              <Mail className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <span>Relatório de Prazos por E-mail</span>
                <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                  Segunda-feira às 08h00 & Manual
                </span>
              </h2>
              <p className="text-xs text-quest-300">
                Disparo oficial com o arquivo PDF paisagem anexado para a diretoria
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-quest-400 hover:text-white hover:bg-quest-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
          
          {/* Destinatários Oficiais */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[10.5px] flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-sky-600" />
                <span>Destinatários Oficiais do Relatório (4)</span>
              </h3>
              <span className="text-[9.5px] text-emerald-700 bg-emerald-100 font-bold px-2 py-0.2 rounded">
                Catelani, TK, Lucas e Bruno Britto
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-slate-700">
              {DEFAULT_RECIPIENTS.map((rec) => (
                <div key={rec.email} className="p-1.5 bg-white rounded-lg border border-slate-200 text-[11px]">
                  <p className="font-bold text-slate-900 leading-tight">{rec.name}</p>
                  <p className="text-[10px] font-mono text-sky-700">{rec.email}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Mensagem de Instrução do E-mail */}
          <div className="p-3.5 bg-sky-50/70 border border-sky-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sky-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-sky-700" />
                <span>Instrução enviada no corpo do e-mail</span>
              </h3>
              <span className="text-[10px] bg-sky-200 text-sky-900 font-bold px-2 py-0.5 rounded">
                Padronizada
              </span>
            </div>
            <div className="bg-white p-3 rounded-lg border border-sky-200 text-slate-800 font-mono text-[11px] whitespace-pre-line leading-relaxed shadow-2xs">
              {`Prezados,

Atualização:
Segue anexo relatório de prazos vencidos/vincendos referente aos projetos em questão. Qualquer dúvida devemos alinhar os próximos passos, fico à disposição.

Att: Bruno Britto
Quest Consult • Gestão de Prazos & Compliance`}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-sky-900 font-semibold bg-sky-100/70 p-2 rounded-lg border border-sky-200">
              <Paperclip className="w-3.5 h-3.5 text-sky-700 shrink-0" />
              <span>Anexo Obrigatório: <strong>Quest_Consult_Relatorio_Prazos_{new Date().toISOString().split('T')[0]}.pdf</strong> (Modo Paisagem)</span>
            </div>
          </div>

          {/* Panorama de Prazos Vencidos / Vincendos do Anexo PDF */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>Conteúdo do Relatório em Anexo (Modo Paisagem)</span>
              </h3>
              <span className="text-[10px] font-semibold text-slate-500">
                Prazos Ativos (90, 60, 45, 32 Dias e Tratativa)
              </span>
            </div>

            {/* Grid 4 Colunas + Tratativa */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
              <div className="p-2 rounded-lg bg-red-50 border border-red-200">
                <p className="text-[9.5px] font-bold text-red-700 uppercase">32d Risco</p>
                <p className="text-lg font-black text-red-800">{countDanger}</p>
                <p className="text-[8.5px] text-red-600">Limite Prorrogação</p>
              </div>

              <div className="p-2 rounded-lg bg-amber-50 border border-amber-200">
                <p className="text-[9.5px] font-bold text-amber-700 uppercase">45 Dias</p>
                <p className="text-lg font-black text-amber-800">{alert45Projects.length}</p>
                <p className="text-[8.5px] text-amber-600">Alerta Técnico</p>
              </div>

              <div className="p-2 rounded-lg bg-sky-50 border border-sky-200">
                <p className="text-[9.5px] font-bold text-sky-700 uppercase">60 Dias</p>
                <p className="text-lg font-black text-sky-800">{op60Projects.length}</p>
                <p className="text-[8.5px] text-sky-600">Operacional</p>
              </div>

              <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                <p className="text-[9.5px] font-bold text-emerald-700 uppercase">90 Dias</p>
                <p className="text-lg font-black text-emerald-800">{safe90Projects.length}</p>
                <p className="text-[8.5px] text-emerald-600">Prazo Seguro</p>
              </div>

              <div className="p-2 rounded-lg bg-purple-50 border border-purple-200 col-span-2 sm:col-span-1">
                <p className="text-[9.5px] font-bold text-purple-700 uppercase">Tratativa</p>
                <p className="text-lg font-black text-purple-800">{countTreaty}</p>
                <p className="text-[8.5px] text-purple-600">Prorrogação pedida</p>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 mt-2 text-right">
              ✓ Os <strong>{countCompleted} projetos concluídos</strong> foram desconsiderados do relatório de prazos vencidos/vincendos.
            </p>
          </div>

          {/* Feedback de envio oficial via API com PDF Anexo */}
          {sendSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl space-y-1.5 text-emerald-900 animate-in fade-in">
              <div className="flex items-center gap-2 font-bold text-xs text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>E-mail com PDF Anexo Enviado com Sucesso!</span>
              </div>
              <p className="text-[11px] text-emerald-700 leading-relaxed">
                O e-mail oficial foi entregue diretamente aos 4 destinatários (<strong>catelani, tk, lucas, bruno.britto @questconsult.com.br</strong>) com o arquivo <strong>PDF paisagem anexado</strong> via AgentMail / Amazon SES.
              </p>
              <p className="text-[10.5px] text-emerald-800 font-semibold">
                📥 O arquivo PDF também foi baixado automaticamente para o seu computador.
              </p>
            </div>
          )}

          {/* Aviso sobre o Gmail Web Manual */}
          {manualGmailNotice && (
            <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl space-y-1.5 text-amber-900 animate-in fade-in">
              <div className="flex items-center gap-2 font-bold text-xs text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Arquivo PDF baixado para anexar manualmente</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                O arquivo <strong>Quest_Consult_Relatorio_Prazos_...pdf</strong> foi baixado em sua pasta de <strong>Downloads</strong>. Por políticas de segurança do navegador, nenhuma página externa pode anexar arquivos locais automaticamente dentro do Gmail Web. Basta clicar no ícone do clipe (📎) no Gmail e anexar o arquivo baixado.
              </p>
            </div>
          )}

          {sendError && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl flex items-center gap-2 text-rose-800 animate-in fade-in">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{sendError}</span>
            </div>
          )}

          {/* Ações */}
          <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleDownloadPdfOnly}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition-colors cursor-pointer"
                title="Baixar arquivo PDF paisagem diretamente"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Baixar PDF</span>
              </button>

              <button
                type="button"
                onClick={handleOpenGmailManual}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition-colors cursor-pointer"
                title="Abrir no Gmail Web"
              >
                <ExternalLink className="w-3.5 h-3.5 text-sky-600" />
                <span>Gmail Web</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleSendDirectEmailWithAttachment}
              disabled={isSending}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 via-sky-600 to-blue-700 hover:from-emerald-500 hover:to-blue-600 rounded-xl shadow-md transition-all active:scale-98 cursor-pointer disabled:opacity-60"
            >
              <Send className={`w-3.5 h-3.5 ${isSending ? 'animate-spin' : ''}`} />
              <span>{isSending ? 'Disparando com PDF Anexo...' : 'Disparar E-mail com PDF Anexo (4 Destinatários)'}</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
