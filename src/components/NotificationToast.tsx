'use client';

import React, { useEffect } from 'react';
import { useProjects } from '@/context/ProjectContext';
import { Mail, CheckCircle2, AlertTriangle, X } from 'lucide-react';

export const NotificationToast: React.FC = () => {
  const { activeToast, dismissToast } = useProjects();

  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => {
        dismissToast();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [activeToast, dismissToast]);

  if (!activeToast) return null;

  const isRisk = activeToast.subject.includes('RISCO') || activeToast.eventData?.toColumn === 'col_risk';

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full animate-in slide-in-from-bottom duration-300">
      <div
        className={`p-4 rounded-xl shadow-2xl border flex items-start space-x-3 ${
          isRisk
            ? 'bg-red-950 text-white border-red-800'
            : 'bg-quest-900 text-white border-quest-750'
        }`}
      >
        <div
          className={`p-2 rounded-lg shrink-0 ${
            isRisk ? 'bg-red-800 text-red-200' : 'bg-sky-950 text-sky-400'
          }`}
        >
          {isRisk ? <AlertTriangle className="w-5 h-5 text-red-400" /> : <Mail className="w-5 h-5" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
              Notificação Disparada (3 E-mails)
            </span>
            <button
              onClick={dismissToast}
              className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs font-bold mt-0.5 truncate">{activeToast.subject}</p>
          <p className="text-[11px] text-slate-300 mt-1 line-clamp-2">{activeToast.preview}</p>
          
          <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Disparado para Diretoria, Gestão e Operações</span>
          </div>
        </div>
      </div>
    </div>
  );
};
