'use client';

import React, { useState } from 'react';
import { KanbanColumnConfig, Project } from '@/types';
import { ProjectCard } from './ProjectCard';
import { useProjects } from '@/context/ProjectContext';
import { Layers, ShieldAlert, Clock, CheckCircle2 } from 'lucide-react';

interface KanbanColumnProps {
  column: KanbanColumnConfig;
  projects: Project[];
  onEditProject: (project: Project) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  projects,
  onEditProject,
}) => {
  const { moveCard } = useProjects();
  const [isDragOver, setIsDragOver] = useState(false);

  // Ícones por coluna
  const renderColumnIcon = () => {
    switch (column.id) {
      case 'col_risk':
        return <ShieldAlert className="w-4 h-4 text-white" />;
      case 'col_30':
        return <Clock className="w-4 h-4 text-white" />;
      case 'col_60':
        return <Clock className="w-4 h-4 text-white" />;
      case 'col_90':
      default:
        return <CheckCircle2 className="w-4 h-4 text-white" />;
    }
  };

  // Handlers de Drag and Drop (HTML5)
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const cardId = e.dataTransfer.getData('text/plain');
    if (cardId) {
      moveCard(cardId, column.id, `Movido manualmente para a coluna ${column.title}`);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`kanban-column flex flex-col rounded-2xl bg-quest-100/60 border ${
        column.borderClass
      } shadow-column transition-all duration-200 min-h-[580px] max-h-[82vh] ${
        isDragOver ? 'ring-2 ring-sky-500 bg-sky-50/50 scale-[1.01]' : ''
      }`}
    >
      {/* Cabeçalho da Coluna */}
      <div className={`p-3.5 rounded-t-2xl ${column.headerBg} shadow-sm`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center">
              {renderColumnIcon()}
            </div>
            <div>
              <h2 className="font-bold text-sm tracking-tight text-white flex items-center gap-2">
                {column.title}
              </h2>
              <p className="text-[11px] text-white/80 line-clamp-1">{column.subtitle}</p>
            </div>
          </div>

          {/* Badge Contador */}
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/25 backdrop-blur-xs text-white">
            {projects.length}
          </span>
        </div>
      </div>

      {/* Zona de Drop & Lista de Cards */}
      <div className="p-2.5 sm:p-3 flex-1 overflow-y-auto space-y-2">
        {projects.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-slate-300 rounded-xl bg-white/50">
            <Layers className="w-7 h-7 text-slate-300 mb-2" />
            <p className="text-xs font-medium text-slate-500">Nenhum projeto nesta janela</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Arraste um card para cá</p>
          </div>
        ) : (
          projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={onEditProject}
            />
          ))
        )}
      </div>

      {/* Rodapé da Coluna com indicador visual */}
      <div className="px-3.5 py-2 bg-white/70 border-t border-slate-200/60 rounded-b-2xl text-[11px] text-slate-500 flex items-center justify-between">
        <span className="font-medium">{column.badgeLabel}</span>
        <span className="text-[10px] text-slate-400">Arraste para mover</span>
      </div>
    </div>
  );
};
