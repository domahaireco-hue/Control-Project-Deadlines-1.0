'use client';

import React from 'react';
import { 
  X, 
  Mail, 
  Send, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { useProjects } from '@/context/ProjectContext';
import { DEFAULT_RECIPIENTS } from '@/services/notificationService';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const { historyLogs } = useProjects();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs flex justify-end">
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-250">
        
        {/* Header Drawer */}
        <div className="bg-quest-900 text-white p-5 border-b border-quest-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-sky-950 border border-sky-800 text-sky-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Central de Alertas & E-mails</h2>
              <p className="text-xs text-quest-400">Gatilhos automáticos de movimentação no Kanban</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-quest-400 hover:text-white hover:bg-quest-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Destinatários Fixos Configurados */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
              <Users className="w-4 h-4 text-sky-600" />
              Destinatários Oficiais Configurados ({DEFAULT_RECIPIENTS.length})
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Ativo
            </span>
          </div>

          <div className="space-y-1.5">
            {DEFAULT_RECIPIENTS.map((rec) => (
              <div
                key={rec.email}
                className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-slate-800">{rec.name}</p>
                  <p className="text-[11px] text-slate-500 font-mono">{rec.email}</p>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">{rec.role}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Lista de Disparos Recentes */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Histórico de Disparos Recentes
            </span>
            <span className="text-[11px] text-slate-400">
              {historyLogs.length} disparo(s)
            </span>
          </div>

          {historyLogs.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-300 rounded-xl bg-slate-50/50">
              <Send className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-xs font-medium text-slate-600">Nenhuma notificação recente</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Mova um card de projeto entre colunas ou execute o avanço de funil para gerar disparos.
              </p>
            </div>
          ) : (
            historyLogs.map((log) => {
              const isRisk = log.subject.includes('RISCO') || log.eventData?.toColumn === 'col_risk';
              return (
                <div
                  key={log.id}
                  className={`p-3 rounded-xl border transition-all text-xs space-y-2 ${
                    isRisk
                      ? 'bg-red-50/70 border-red-200 text-red-950'
                      : 'bg-white border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                        isRisk
                          ? 'bg-red-200 text-red-900'
                          : 'bg-sky-100 text-sky-800'
                      }`}
                    >
                      {log.status === 'SENT_MOCK' ? 'E-MAIL ENVIADO (MOCK)' : log.status}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(log.timestamp).toLocaleTimeString('pt-BR')}
                    </span>
                  </div>

                  <p className="font-semibold text-slate-900 leading-snug">{log.subject}</p>
                  <p className="text-[11px] text-slate-600 bg-white/80 p-2 rounded border border-slate-100 font-mono">
                    {log.preview}
                  </p>

                  <div className="text-[10px] text-slate-400 pt-1 flex items-center justify-between">
                    <span>Para: 3 Destinatários Quest</span>
                    <span className="font-mono">{log.id}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Rodapé informativo */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 text-[11px] text-slate-500 text-center">
          Serviço desacoplado pronto para envio real via Nodemailer / Resend.
        </div>

      </div>
    </div>
  );
};
