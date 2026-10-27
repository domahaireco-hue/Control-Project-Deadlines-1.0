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
  Users
} from 'lucide-react';
import { useProjects } from '@/context/ProjectContext';
import { DEFAULT_RECIPIENTS } from '@/services/notificationService';
import { PdfSnapshotService } from '@/services/pdfSnapshotService';

interface DailyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DailyReportModal: React.FC<DailyReportModalProps> = ({ isOpen, onClose }) => {
  const { projects, sendDailyReportEmail } = useProjects();
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Métricas
  const totalProjects = projects.length;
  const countCompleted = projects.filter((p) => p.isCompleted).length;
  const inTreaty = projects.filter((p) => p.isInTreaty && !p.isCompleted);
  const risk32 = projects.filter((p) => (p.columnId === 'col_risk' || p.columnId === 'col_32') && !p.isInTreaty && !p.isCompleted);
  const alert45 = projects.filter((p) => (p.columnId === 'col_45' || p.columnId === 'col_30') && !p.isInTreaty && !p.isCompleted);
  const op60 = projects.filter((p) => p.columnId === 'col_60' && !p.isInTreaty && !p.isCompleted);
  const safe90 = projects.filter((p) => p.columnId === 'col_90' && !p.isInTreaty && !p.isCompleted);

  const kvApproved = projects.filter((p) => p.kvStatus === 'aprovada').length;
  const kvInReview = projects.filter((p) => p.kvStatus === 'em_aprovacao').length;
  const kvPending = projects.filter((p) => !p.kvStatus || p.kvStatus === 'nao_enviado').length;

  const proacProjects = projects.filter((p) => p.lawMechanism === 'PROAC' || (p.lawMechanism && p.lawMechanism.toUpperCase().includes('PROAC')));
  const agendaVivaCount = proacProjects.filter((p) => p.agendaVivaRegistered).length;
  const proacSystemCount = proacProjects.filter((p) => p.proacSystemRegistered).length;

  const handleSendEmail = async () => {
    setIsSending(true);
    setSendError(null);
    try {
      await sendDailyReportEmail();
      setSendSuccess(true);
      setTimeout(() => {
        setSendSuccess(false);
      }, 5000);
    } catch (err: unknown) {
      setSendError('Erro ao disparar e-mail de relatório diário. Tente novamente.');
    } finally {
      setIsSending(false);
    }
  };

  const handlePrintPdf = () => {
    PdfSnapshotService.printKanbanSnapshot({
      company: 'Quest Consult',
      systemName: 'Quest Deadline Control',
      generatedAt: new Date().toISOString(),
      totalProjects: projects.length,
      criticalCount: risk32.length,
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in duration-200 my-8">
        
        {/* Header Modal */}
        <div className="bg-quest-900 text-white px-6 py-4 flex items-center justify-between border-b border-quest-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center">
              <Mail className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <span>Relatório Diário Geral por E-mail</span>
                <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.2 rounded-full font-semibold">
                  Diário às 08h00
                </span>
              </h2>
              <p className="text-xs text-quest-400">
                Envio automático do status consolidado de prazos, KV digital e conformidade PROAC
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-quest-400 hover:text-white hover:bg-quest-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto text-xs">
          
          {/* Destinatários Fixos Cadastrados */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-sky-600" />
                <span>Destinatários Oficiais do Relatório Diário (4)</span>
              </h3>
              <span className="text-[10px] text-emerald-700 bg-emerald-100 font-bold px-2 py-0.2 rounded">
                Configurados
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
              {DEFAULT_RECIPIENTS.map((rec) => (
                <div key={rec.email} className="p-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
                  <p className="font-bold text-slate-900">{rec.name}</p>
                  <p className="text-[11px] font-mono text-sky-700">{rec.email}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{rec.role}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Resumo do Relatório Atual */}
          <div>
            <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2">
              Resumo Consolidado do Painel de Prazos
            </h3>

            {/* Grid 4 Colunas Kanban */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center mb-3">
              <div className="p-2 rounded-lg bg-red-50 border border-red-200">
                <p className="text-[10px] font-bold text-red-700 uppercase">32d Risco</p>
                <p className="text-xl font-black text-red-800">{risk32.length}</p>
                <p className="text-[9px] text-red-600">Limite Prorrogação</p>
              </div>

              <div className="p-2 rounded-lg bg-amber-50 border border-amber-200">
                <p className="text-[10px] font-bold text-amber-700 uppercase">45 Dias</p>
                <p className="text-xl font-black text-amber-800">{alert45.length}</p>
                <p className="text-[9px] text-amber-600">Alerta Técnico</p>
              </div>

              <div className="p-2 rounded-lg bg-sky-50 border border-sky-200">
                <p className="text-[10px] font-bold text-sky-700 uppercase">60 Dias</p>
                <p className="text-xl font-black text-sky-800">{op60.length}</p>
                <p className="text-[9px] text-sky-600">Operacional</p>
              </div>

              <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                <p className="text-[10px] font-bold text-emerald-700 uppercase">90 Dias</p>
                <p className="text-xl font-black text-emerald-800">{safe90.length}</p>
                <p className="text-[9px] text-emerald-600">Prazo Seguro</p>
              </div>
            </div>

            {/* Sub-métricas: KV, PROAC, Tratativa e Concluídos */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              {/* KV Status */}
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="font-bold text-slate-800 mb-1 text-[11px]">KV / Arte Digital</p>
                <div className="space-y-0.5 text-[10.5px]">
                  <p className="flex justify-between">
                    <span className="text-emerald-700">✓ Aprovadas:</span>
                    <strong>{kvApproved}</strong>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-amber-700">⏳ Em Aprovação:</span>
                    <strong>{kvInReview}</strong>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-500">⚪ Pendentes:</span>
                    <strong>{kvPending}</strong>
                  </p>
                </div>
              </div>

              {/* PROAC Conformidade */}
              <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg">
                <p className="font-bold text-amber-900 mb-1 text-[11px]">PROAC ({proacProjects.length})</p>
                <div className="space-y-0.5 text-[10.5px]">
                  <p className="flex justify-between">
                    <span>Agenda Viva:</span>
                    <strong>{agendaVivaCount}/{proacProjects.length}</strong>
                  </p>
                  <p className="flex justify-between">
                    <span>Sis. PROAC:</span>
                    <strong>{proacSystemCount}/{proacProjects.length}</strong>
                  </p>
                </div>
              </div>

              {/* Tratativa */}
              <div className="p-2.5 bg-purple-50/70 border border-purple-200 rounded-lg">
                <p className="font-bold text-purple-900 mb-1 text-[11px]">Em Tratativa</p>
                <p className="text-sm font-black text-purple-950 mt-1">{inTreaty.length} projetos</p>
                <p className="text-[9.5px] text-purple-700 mt-0.5">Prorrogação solicitada</p>
              </div>

              {/* Concluídos */}
              <div className="p-2.5 bg-teal-50/70 border border-teal-200 rounded-lg">
                <p className="font-bold text-teal-900 mb-1 text-[11px]">Concluídos</p>
                <p className="text-sm font-black text-teal-950 mt-1">{countCompleted} projetos</p>
                <p className="text-[9.5px] text-teal-700 mt-0.5">PC apresentada / aprovada</p>
              </div>
            </div>
          </div>

          {/* Feedback de envio */}
          {sendSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-2 text-emerald-800 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Relatório diário enviado com sucesso!</strong> E-mail disparado para Catelani, TK, Lucas e Bruno Britto.
              </span>
            </div>
          )}

          {sendError && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl flex items-center gap-2 text-rose-800 animate-in fade-in">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{sendError}</span>
            </div>
          )}

          {/* Ações */}
          <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              onClick={handlePrintPdf}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-sky-600" />
              <span>Imprimir / Gerar PDF (Paisagem)</span>
            </button>

            <button
              onClick={handleSendEmail}
              disabled={isSending}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-sm transition-all"
            >
              <Send className={`w-3.5 h-3.5 ${isSending ? 'animate-spin' : ''}`} />
              <span>{isSending ? 'Disparando...' : 'Enviar Relatório Diário Agora'}</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
