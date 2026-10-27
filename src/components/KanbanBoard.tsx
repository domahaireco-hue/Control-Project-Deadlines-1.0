'use client';

import React, { useState } from 'react';
import { useProjects } from '@/context/ProjectContext';
import { KanbanColumn } from './KanbanColumn';
import { PrintReportView } from './PrintReportView';
import { Project } from '@/types';
import { LayoutGrid, ListFilter, Printer } from 'lucide-react';
import { PdfSnapshotService } from '@/services/pdfSnapshotService';

interface KanbanBoardProps {
  onEditProject: (project: Project) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ onEditProject }) => {
  const { columns, filteredProjects, selectedMechanism, searchQuery } = useProjects();
  const [activeView, setActiveView] = useState<'kanban' | 'list'>('kanban');

  const handlePrint = () => {
    PdfSnapshotService.printKanbanSnapshot({
      company: 'Quest Consult',
      systemName: 'Quest Deadline Control',
      generatedAt: new Date().toISOString(),
      totalProjects: filteredProjects.length,
      criticalCount: filteredProjects.filter((p) => p.columnId === 'col_risk').length,
    });
  };

  return (
    <div className="w-full">
      {/* Controles de Tela: Alternância de Modo (Quadro Compacto / Lista de Impressão) e Botão Imprimir */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveView('kanban')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeView === 'kanban'
                ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-sky-600" />
            <span>Quadro Kanban</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 font-bold ml-1">
              {filteredProjects.length}
            </span>
          </button>

          <button
            onClick={() => setActiveView('list')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeView === 'list'
                ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5 text-emerald-600" />
            <span>Lista de Impressão (Paisagem)</span>
          </button>
        </div>

        {/* Botão de Disparo Direto de Impressão Paisagem */}
        <button
          onClick={handlePrint}
          className="inline-flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-quest-900 hover:bg-quest-800 text-white shadow-xs transition-colors"
          title="Imprimir relatório em lista textual no formato paisagem (Ctrl+P)"
        >
          <Printer className="w-3.5 h-3.5 text-sky-400" />
          <span>Imprimir Lista (Paisagem)</span>
        </button>
      </div>

      {/* Grid das 5 Colunas Kanban (Exibido na tela quando activeView === 'kanban') */}
      {activeView === 'kanban' && (
        <div className="kanban-board-container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {columns.map((col) => {
            const colProjects = filteredProjects.filter((p) => {
              if (col.id === 'col_completed') {
                return p.columnId === 'col_completed' || p.isCompleted;
              }
              // Projetos concluídos pertencem exclusivamente à coluna col_completed
              if (p.isCompleted || p.columnId === 'col_completed') {
                return false;
              }
              return (
                p.columnId === col.id || 
                (col.id === 'col_45' && (p.columnId as string) === 'col_30') ||
                (col.id === 'col_risk' && (p.columnId as string) === 'col_32')
              );
            });

            return (
              <KanbanColumn
                key={col.id}
                column={col}
                projects={colProjects}
                onEditProject={onEditProject}
              />
            );
          })}
        </div>
      )}

      {/* Modo de Visualização em Tela da Lista Textual de Impressão (quando activeView === 'list') */}
      {activeView === 'list' && (
        <div className="no-print bg-white border border-slate-200 rounded-xl p-5 shadow-sm mb-6">
          <div className="mb-4 pb-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p className="text-xs text-slate-600">
              Pré-visualização da <strong>lista escrita em texto</strong> para impressão em <strong>modo paisagem</strong>.
            </p>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Relatório</span>
            </button>
          </div>

          <PrintReportView
            projects={filteredProjects}
            selectedMechanism={selectedMechanism}
            searchQuery={searchQuery}
            forceScreenVisible
          />
        </div>
      )}

      {/* Relatório de Impressão Dedicado (Ativo exclusivamente no @media print) */}
      <div className="print-only">
        <PrintReportView
          projects={filteredProjects}
          selectedMechanism={selectedMechanism}
          searchQuery={searchQuery}
        />
      </div>
    </div>
  );
};
