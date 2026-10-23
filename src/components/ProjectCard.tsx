'use client';

import React, { useState } from 'react';
import { 
  Project, 
  KanbanColumnId 
} from '@/types';
import { 
  Clock, 
  Edit3, 
  AlertCircle, 
  MoreVertical,
  Trash2,
  Lock
} from 'lucide-react';
import { useProjects } from '@/context/ProjectContext';

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onEdit }) => {
  const { moveCard, deleteProject } = useProjects();
  const [showMenu, setShowMenu] = useState(false);

  // Badge de dias restantes / prazo de vencimento
  const renderDaysBadge = () => {
    const days = project.daysRemaining;
    if (days === null || days === undefined) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
          <Clock className="w-3 h-3 text-slate-400" />
          Sem Prazo
        </span>
      );
    }

    if (days <= 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800 border border-red-300 animate-pulse">
          <AlertCircle className="w-3 h-3 text-red-600" />
          VENCIDO ({Math.abs(days)}d)
        </span>
      );
    }

    if (days <= 15) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800 border border-red-300">
          <AlertCircle className="w-3 h-3 text-red-600" />
          {days} dias restantes
        </span>
      );
    }

    if (days <= 30) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
          <Clock className="w-3 h-3 text-amber-600" />
          {days} dias restantes
        </span>
      );
    }

    if (days <= 60) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-100 text-sky-800 border border-sky-300">
          <Clock className="w-3 h-3 text-sky-600" />
          {days} dias restantes
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
        <Clock className="w-3 h-3 text-emerald-600" />
        {days} dias restantes
      </span>
    );
  };

  // Drag start handler para HTML5 DnD
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('text/plain', project.id);
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.classList.add('opacity-40', 'scale-95');
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('opacity-40', 'scale-95');
  };

  // Movimentação rápida via dropdown
  const handleQuickMove = (toCol: KanbanColumnId) => {
    moveCard(project.id, toCol, 'Movimentação rápida via menu do card');
    setShowMenu(false);
  };

  const handleDelete = () => {
    if (confirm(`Tem certeza que deseja excluir o projeto "${project.name}"?`)) {
      deleteProject(project.id);
    }
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => onEdit(project)}
      className="project-card group relative bg-white border border-slate-200/90 rounded-lg p-2.5 shadow-xs hover:shadow-md transition-all duration-150 hover:-translate-y-0.5 cursor-grab active:cursor-grabbing border-l-4 select-none"
      style={{
        borderLeftColor:
          project.columnId === 'col_risk'
            ? '#ef4444'
            : project.columnId === 'col_30'
            ? '#f59e0b'
            : project.columnId === 'col_60'
            ? '#0284c7'
            : '#10b981',
      }}
    >
      {/* Topo do Card: Nome do Projeto e Menu de Ações */}
      <div className="flex items-start justify-between gap-1.5">
        {/* Nome do Projeto */}
        <h3 
          className="font-semibold text-slate-800 text-xs sm:text-[13px] leading-snug line-clamp-2 flex-1 group-hover:text-sky-800 transition-colors"
          title={project.name}
        >
          {project.name}
        </h3>

        {/* Indicador de Trava Manual e Menu de Ações */}
        <div className="relative shrink-0 flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
          {project.isManualColumn && (
            <span title="Posição fixada manualmente pelo usuário" className="text-slate-400 p-0.5">
              <Lock className="w-3 h-3" />
            </span>
          )}

          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Opções do Card"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-6 z-20 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-1 text-xs">
              <button
                onClick={() => {
                  setShowMenu(false);
                  onEdit(project);
                }}
                className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <Edit3 className="w-3.5 h-3.5 text-sky-600" />
                <span>Editar Detalhes</span>
              </button>

              <div className="border-t border-slate-100 my-1"></div>
              <p className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase">Mover para Coluna</p>
              
              {project.columnId !== 'col_90' && (
                <button
                  onClick={() => handleQuickMove('col_90')}
                  className="w-full px-3 py-1 text-left text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  90 Dias
                </button>
              )}
              {project.columnId !== 'col_60' && (
                <button
                  onClick={() => handleQuickMove('col_60')}
                  className="w-full px-3 py-1 text-left text-slate-600 hover:bg-sky-50 hover:text-sky-700 flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                  60 Dias
                </button>
              )}
              {project.columnId !== 'col_30' && (
                <button
                  onClick={() => handleQuickMove('col_30')}
                  className="w-full px-3 py-1 text-left text-slate-600 hover:bg-amber-50 hover:text-amber-700 flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  30 Dias
                </button>
              )}
              {project.columnId !== 'col_risk' && (
                <button
                  onClick={() => handleQuickMove('col_risk')}
                  className="w-full px-3 py-1 text-left text-slate-600 hover:bg-red-50 hover:text-red-700 flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  Risco (15 Dias)
                </button>
              )}

              <div className="border-t border-slate-100 my-1"></div>
              <button
                onClick={() => {
                  setShowMenu(false);
                  handleDelete();
                }}
                className="w-full px-3 py-1.5 text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                <span>Excluir Card</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Linha Inferior: Quantidade de Dias para Vencer e Edição Rápida */}
      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100">
        <div>
          {renderDaysBadge()}
        </div>

        {/* Botão de Edição Rápida que aparece no hover */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(project);
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded"
          title="Editar Projeto"
        >
          <Edit3 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
