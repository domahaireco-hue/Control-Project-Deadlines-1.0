'use client';

import React from 'react';
import { 
  UploadCloud, 
  Plus, 
  FileDown, 
  Bell, 
  Play, 
  RotateCcw,
  Clock,
  ShieldCheck,
  Calendar,
  Printer
} from 'lucide-react';
import { useProjects } from '@/context/ProjectContext';
import { PdfSnapshotService } from '@/services/pdfSnapshotService';

interface HeaderProps {
  onOpenUpload: () => void;
  onOpenNewProject: () => void;
  onOpenNotifications: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenUpload,
  onOpenNewProject,
  onOpenNotifications,
}) => {
  const { projects, historyLogs, isAdvancingFunnel, runFunnelAdvance, resetToDefault } = useProjects();

  const handleAdvanceFunnel = async () => {
    const res = await runFunnelAdvance(false);
    alert(
      `Rotina diária de avanço de funil concluída!\n\n` +
      `• Projetos analisados: ${res.totalAnalyzed}\n` +
      `• Projetos movimentados no funil: ${res.movedCount}\n` +
      `• Projetos com trava manual (respeitados): ${res.manualLockedCount}\n` +
      `• E-mails disparados aos 3 destinatários fixos: ${res.movedCount}`
    );
  };

  const handleExportPdf = () => {
    PdfSnapshotService.printKanbanSnapshot({
      company: 'Quest Consult',
      systemName: 'Quest Deadline Control',
      generatedAt: new Date().toISOString(),
      totalProjects: projects.length,
      criticalCount: projects.filter((p) => p.columnId === 'col_risk').length,
    });
  };

  return (
    <header className="bg-quest-900 border-b border-quest-800 text-white shadow-lg sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo & Identidade Corporativa Quest Consult */}
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-emerald-400 p-0.5 shadow-md flex items-center justify-center">
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
                  v1.0 Pro
                </span>
              </div>
              <p className="text-xs text-quest-400 flex items-center gap-1.5 mt-0.5">
                <span>Quest Deadline Control</span>
                <span className="inline-block w-1 h-1 rounded-full bg-emerald-400"></span>
                <span>Painel de Vencimento de Projetos</span>
              </p>
            </div>
          </div>

          {/* Ações e Controles */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Botão Rotina Avançar Funil */}
            <button
              onClick={handleAdvanceFunnel}
              disabled={isAdvancingFunnel}
              title="Executa a rotina de avanço diário do funil com base na data de hoje"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-quest-800 hover:bg-quest-750 border border-quest-700 text-quest-200 hover:text-white transition-all shadow-sm"
            >
              <Play className={`w-3.5 h-3.5 text-emerald-400 ${isAdvancingFunnel ? 'animate-spin' : ''}`} />
              <span>{isAdvancingFunnel ? 'Avaliando...' : 'Avançar Funil'}</span>
            </button>

            {/* Botão Imprimir Lista / PDF */}
            <button
              onClick={handleExportPdf}
              title="Imprimir relatório executivo com lista em texto no formato paisagem (Ctrl+P)"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-quest-800 hover:bg-quest-750 border border-quest-700 text-quest-200 hover:text-white transition-all shadow-sm"
            >
              <Printer className="w-3.5 h-3.5 text-sky-400" />
              <span>Imprimir / PDF</span>
            </button>

            {/* Botão Importar Planilha */}
            <button
              onClick={onOpenUpload}
              title="Importar ou atualizar planilha (.xlsx / .csv)"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white shadow transition-all"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Importar Planilha</span>
            </button>

            {/* Botão Novo Projeto */}
            <button
              onClick={onOpenNewProject}
              title="Cadastrar novo projeto manualmente"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Projeto</span>
            </button>

            {/* Botão Notificações */}
            <button
              onClick={onOpenNotifications}
              title="Visualizar histórico de notificações e e-mails disparados aos 3 destinatários"
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

          </div>

        </div>
      </div>
    </header>
  );
};
