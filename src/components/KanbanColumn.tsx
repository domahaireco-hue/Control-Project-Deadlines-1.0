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

  // Configuração explícita de estilo e contraste máximo para cada coluna
  const getColumnTheme = () => {
    switch (column.id) {
      case 'col_risk':
      case 'col_32':
        return {
          gradient: 'linear-gradient(135deg, #b91c1c 0%, #881337 100%)',
          borderClass: 'border-red-300',
          containerBg: 'bg-red-50/30',
          subtextColor: '#fee2e2',
          badgeLabelColor: 'text-red-700',
          dropHighlight: 'ring-2 ring-red-500 bg-red-100/60 scale-[1.01]',
        };
      case 'col_45':
      case 'col_30':
        return {
          gradient: 'linear-gradient(135deg, #d97706 0%, #9a3412 100%)',
          borderClass: 'border-amber-300',
          containerBg: 'bg-amber-50/30',
          subtextColor: '#fef3c7',
          badgeLabelColor: 'text-amber-800',
          dropHighlight: 'ring-2 ring-amber-500 bg-amber-100/60 scale-[1.01]',
        };
      case 'col_60':
        return {
          gradient: 'linear-gradient(135deg, #0284c7 0%, #1e40af 100%)',
          borderClass: 'border-sky-300',
          containerBg: 'bg-sky-50/30',
          subtextColor: '#e0f2fe',
          badgeLabelColor: 'text-sky-800',
          dropHighlight: 'ring-2 ring-sky-500 bg-sky-100/60 scale-[1.01]',
        };
      case 'col_completed':
        return {
          gradient: 'linear-gradient(135deg, #0d9488 0%, #065f46 100%)',
          borderClass: 'border-teal-300',
          containerBg: 'bg-teal-50/30',
          subtextColor: '#ccfbf1',
          badgeLabelColor: 'text-teal-800',
          dropHighlight: 'ring-2 ring-teal-500 bg-teal-100/60 scale-[1.01]',
        };
      case 'col_90':
      default:
        return {
          gradient: 'linear-gradient(135deg, #047857 0%, #064e3b 100%)',
          borderClass: 'border-emerald-300',
          containerBg: 'bg-emerald-50/30',
          subtextColor: '#d1fae5',
          badgeLabelColor: 'text-emerald-800',
          dropHighlight: 'ring-2 ring-emerald-500 bg-emerald-100/60 scale-[1.01]',
        };
    }
  };

  const theme = getColumnTheme();

  // Ícones por coluna
  const renderColumnIcon = () => {
    switch (column.id) {
      case 'col_completed':
        return <CheckCircle2 className="w-4 h-4 text-white" />;
      case 'col_risk':
      case 'col_32':
        return <ShieldAlert className="w-4 h-4 text-white" />;
      case 'col_45':
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
      className={`kanban-column flex flex-col rounded-2xl ${theme.containerBg} border ${
        theme.borderClass
      } shadow-column transition-all duration-200 min-h-[580px] max-h-[82vh] ${
        isDragOver ? theme.dropHighlight : ''
      }`}
    >
      {/* Cabeçalho da Coluna com Alto Contraste 100% Garantido */}
      <div 
        className="p-3.5 rounded-t-2xl shadow-sm text-white"
        style={{ background: theme.gradient }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-black/25 backdrop-blur-xs flex items-center justify-center text-white border border-white/20 shadow-2xs">
              {renderColumnIcon()}
            </div>
            <div>
              <h2 className="font-extrabold text-sm tracking-tight text-white flex items-center gap-2 drop-shadow-xs">
                {column.title}
              </h2>
              <p 
                className="text-[11px] line-clamp-1 font-medium mt-0.5" 
                style={{ color: theme.subtextColor }}
              >
                {column.subtitle}
              </p>
            </div>
          </div>

          {/* Badge Contador com Alto Contraste */}
          <span 
            className="px-2.5 py-0.5 rounded-full text-xs font-black text-white border shadow-xs"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.35)', borderColor: 'rgba(255, 255, 255, 0.4)' }}
          >
            {projects.length}
          </span>
        </div>
      </div>

      {/* Zona de Drop & Lista de Cards */}
      <div className="p-2.5 sm:p-3 flex-1 overflow-y-auto space-y-2">
        {projects.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-slate-300 rounded-xl bg-white/60">
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

      {/* Rodapé da Coluna com indicador visual legível */}
      <div className="px-3.5 py-2 bg-white/80 border-t border-slate-200/80 rounded-b-2xl text-[11px] flex items-center justify-between">
        <span className={`font-bold ${theme.badgeLabelColor}`}>{column.badgeLabel}</span>
        <span className="text-[10px] text-slate-400">Arraste para mover</span>
      </div>
    </div>
  );
};
