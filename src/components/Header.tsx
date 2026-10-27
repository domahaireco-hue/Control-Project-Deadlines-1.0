'use client';

import React from 'react';
import { 
  UploadCloud, 
  Plus, 
  Bell, 
  Play, 
  RotateCcw,
  Printer,
  Mail,
  Send,
  LogOut,
  UserCheck
} from 'lucide-react';
import { useProjects } from '@/context/ProjectContext';
import { useAuth } from '@/context/AuthContext';
import { PdfSnapshotService } from '@/services/pdfSnapshotService';

interface HeaderProps {
  onOpenUpload: () => void;
  onOpenNewProject: () => void;
  onOpenNotifications: () => void;
  onOpenDailyReport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenUpload,
  onOpenNewProject,
  onOpenNotifications,
  onOpenDailyReport,
}) => {
  const { projects, historyLogs, isAdvancingFunnel, runFunnelAdvance, resetToDefault } = useProjects();
  const { user, logout } = useAuth();

  const handleAdvanceFunnel = async () => {
    const res = await runFunnelAdvance(false);
    alert(
      `Rotina diária de avanço de funil (90, 60, 45, 32 Dias) concluída!\n\n` +
      `• Projetos analisados: ${res.totalAnalyzed}\n` +
      `• Projetos movimentados no funil: ${res.movedCount}\n` +
      `• Projetos com trava manual: ${res.manualLockedCount}\n` +
      `• Notificações disparadas aos 4 destinatários oficiais: ${res.movedCount}`
    );
  };

  const handleExportPdf = () => {
    PdfSnapshotService.printKanbanSnapshot({
      company: 'Quest Consult',
      systemName: 'Quest Deadline Control',
      generatedAt: new Date().toISOString(),
      totalProjects: projects.length,
      criticalCount: projects.filter((p) => p.columnId === 'col_risk' || p.columnId === 'col_32').length,
    });
  };

  return (
    <header className="bg-quest-900 border-b border-quest-800 text-white shadow-lg sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
          {/* Logo & Identidade Corporativa Quest Consult */}
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-emerald-400 p-0.5 shadow-md flex items-center justify-center">
              <div className="w-full h-full bg-quest-900 rounded-[10px] flex items-center justify-center">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-sky-400 to-emerald-300 bg-clip-text text-transparent">
                  Q
                </span>
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                  QUEST <span className="text-sky-400 font-light">CONSULT</span>
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-sky-950 border border-sky-800 text-sky-300 rounded-full">
                  Prazos v1.2
                </span>
              </div>
              <p className="text-xs text-quest-400 flex items-center gap-1.5 mt-0.5">
                <span>Quest Deadline Control</span>
                <span className="inline-block w-1 h-1 rounded-full bg-emerald-400"></span>
                <span>Janelas 90, 60, 45, 32 Dias • Envio Diário</span>
              </p>
            </div>
          </div>

          {/* Ações e Controles */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Botão Relatório Diário E-mail */}
            <button
              onClick={onOpenDailyReport}
              title="Abrir painel de disparo diário de relatório geral em PDF por e-mail para Catelani, TK, Lucas e Bruno Britto"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition-all"
            >
              <Mail className="w-3.5 h-3.5 text-indigo-200" />
              <span>Relatório Diário (E-mail)</span>
            </button>


            {/* Botão Imprimir Lista / PDF */}
            <button
              onClick={handleExportPdf}
              title="Imprimir relatório executivo com lista em texto no formato paisagem (Ctrl+P)"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-quest-800 hover:bg-quest-750 border border-quest-700 text-quest-200 hover:text-white transition-all shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 text-sky-400" />
              <span>Imprimir / PDF</span>
            </button>

            {/* Botão Importar Planilha */}
            <button
              onClick={onOpenUpload}
              title="Importar ou atualizar planilha (.xlsx / .csv)"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white shadow-xs transition-all"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Importar Planilha</span>
            </button>

            {/* Botão Novo Projeto */}
            <button
              onClick={onOpenNewProject}
              title="Cadastrar novo projeto manualmente"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Projeto</span>
            </button>

            {/* Botão Notificações */}
            <button
              onClick={onOpenNotifications}
              title="Visualizar histórico de notificações e e-mails disparados aos 4 destinatários"
              className="relative p-2 rounded-lg bg-quest-800 hover:bg-quest-700 text-quest-300 hover:text-white border border-quest-700 transition-all"
            >
              <Bell className="w-4 h-4" />
              {historyLogs.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm">
                  {historyLogs.length}
                </span>
              )}
            </button>

            {/* Botão Restaurar Base */}
            <button
              onClick={resetToDefault}
              title="Restaurar base de projetos padrão da planilha Quest Consult"
              className="p-2 rounded-lg bg-quest-800 hover:bg-quest-700 text-quest-400 hover:text-red-300 border border-quest-700 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Perfil do Usuário Logado & Logout */}
            {user && (
              <div className="flex items-center gap-2 pl-2 border-l border-quest-800">
                <div 
                  className="flex items-center gap-2 py-1 px-2.5 rounded-xl bg-quest-800/90 border border-quest-700/80 shadow-2xs"
                  title={`Conectado como ${user.name} (${user.email})`}
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-black text-[11px] flex items-center justify-center shadow-xs">
                    {user.avatarInitials}
                  </div>
                  <div className="text-left hidden lg:block leading-tight">
                    <p className="text-xs font-bold text-white leading-none">{user.name}</p>
                    <p className="text-[10px] text-quest-400 truncate max-w-[120px]">{user.role.split('/')[0]}</p>
                  </div>
                </div>

                <button
                  onClick={logout}
                  title="Sair do sistema (Logout)"
                  className="p-2 rounded-lg bg-quest-800 hover:bg-rose-950/70 hover:text-rose-300 text-quest-400 border border-quest-700 hover:border-rose-800/80 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
