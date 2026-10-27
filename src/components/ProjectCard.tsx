'use client';

import React, { useState } from 'react';
import { 
  Project, 
  KanbanColumnId,
  KvStatus
} from '@/types';
import { 
  Clock, 
  Edit3, 
  AlertCircle, 
  MoreVertical,
  Trash2,
  Lock,
  CheckCircle2,
  Clock4,
  XCircle,
  HelpCircle,
  FileCheck2,
  CalendarCheck2,
  Building
} from 'lucide-react';
import { useProjects } from '@/context/ProjectContext';

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onEdit }) => {
  const { moveCard, deleteProject, updateKvStatus, toggleProacField, toggleTreaty, toggleCompleted } = useProjects();
  const [showMenu, setShowMenu] = useState(false);
  const [showKvDropdown, setShowKvDropdown] = useState(false);

  const isProac = project.lawMechanism === 'PROAC' || 
    (project.lawMechanism && project.lawMechanism.toUpperCase().includes('PROAC')) ||
    (project.lawMechanism && project.lawMechanism.toUpperCase().includes('ICMS'));

  // Badge de dias restantes com as novas janelas (32, 45, 60, 90)
  const renderDaysBadge = () => {
    // Se o projeto estiver marcado como Concluído (PC apresentada / aprovada)
    if (project.isCompleted) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-teal-100 text-teal-900 border border-teal-300" title="Prestação de Contas Apresentada / Concluído">
          <FileCheck2 className="w-3.5 h-3.5 text-teal-700" />
          Concluído (PC Apresentada)
        </span>
      );
    }

    const days = project.daysRemaining;

    // Se estiver em tratativa e a data for passada, exibe como Tratativa
    if (project.isInTreaty) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200" title="Projeto em tratativa / Prorrogação solicitada">
          <FileCheck2 className="w-3 h-3 text-indigo-600" />
          Em Tratativa
        </span>
      );
    }

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

    // <= 32 dias: Limite legal de prorrogação
    if (days <= 32) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800 border border-red-300">
          <AlertCircle className="w-3 h-3 text-red-600" />
          {days}d restantes (Limite 32d)
        </span>
      );
    }

    // 33 a 45 dias
    if (days <= 45) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
          <Clock className="w-3 h-3 text-amber-600" />
          {days}d restantes (Alerta 45d)
        </span>
      );
    }

    // 46 a 60 dias
    if (days <= 60) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-100 text-sky-800 border border-sky-300">
          <Clock className="w-3 h-3 text-sky-600" />
          {days}d restantes (60d)
        </span>
      );
    }

    // > 60 dias (90 dias)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
        <Clock className="w-3 h-3 text-emerald-600" />
        {days}d restantes (90d+)
      </span>
    );
  };

  // Renderiza Tag de KV / Arte Digital com baixa manual rápida
  const renderKvTag = () => {
    const status: KvStatus = project.kvStatus || 'nao_enviado';

    let config = {
      label: 'KV: Pendente de Envio',
      bgClass: 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200',
      icon: <HelpCircle className="w-3 h-3 text-slate-500" />,
    };

    if (status === 'em_aprovacao') {
      config = {
        label: 'KV: Em Aprovação',
        bgClass: 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200',
        icon: <Clock4 className="w-3 h-3 text-amber-600" />,
      };
    } else if (status === 'aprovada') {
      config = {
        label: 'KV: Aprovada',
        bgClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200',
        icon: <CheckCircle2 className="w-3 h-3 text-emerald-600" />,
      };
    } else if (status === 'reprovada') {
      config = {
        label: 'KV: Reprovada',
        bgClass: 'bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200',
        icon: <XCircle className="w-3 h-3 text-rose-600" />,
      };
    }

    return (
      <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => setShowKvDropdown(!showKvDropdown)}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold border transition-colors cursor-pointer shadow-2xs ${config.bgClass}`}
          title="Clique para alterar manualmente o status de aprovação de KV / Arte Digital"
        >
          {config.icon}
          <span>{config.label}</span>
        </button>

        {showKvDropdown && (
          <div className="absolute left-0 top-6 z-30 w-44 bg-white border border-slate-200 rounded-lg shadow-xl py-1 text-xs animate-in fade-in zoom-in-95 duration-100">
            <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
              Status KV / Arte Digital
            </div>
            <button
              onClick={() => {
                updateKvStatus(project.id, 'nao_enviado');
                setShowKvDropdown(false);
              }}
              className={`w-full px-2.5 py-1.5 text-left flex items-center gap-2 hover:bg-slate-50 ${status === 'nao_enviado' ? 'font-bold text-slate-900 bg-slate-50' : 'text-slate-600'}`}
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              <span>Não Enviada (Pendente)</span>
            </button>
            <button
              onClick={() => {
                updateKvStatus(project.id, 'em_aprovacao');
                setShowKvDropdown(false);
              }}
              className={`w-full px-2.5 py-1.5 text-left flex items-center gap-2 hover:bg-amber-50 ${status === 'em_aprovacao' ? 'font-bold text-amber-900 bg-amber-50' : 'text-amber-700'}`}
            >
              <Clock4 className="w-3.5 h-3.5 text-amber-500" />
              <span>Enviada / Em Aprovação</span>
            </button>
            <button
              onClick={() => {
                updateKvStatus(project.id, 'aprovada');
                setShowKvDropdown(false);
              }}
              className={`w-full px-2.5 py-1.5 text-left flex items-center gap-2 hover:bg-emerald-50 ${status === 'aprovada' ? 'font-bold text-emerald-900 bg-emerald-50' : 'text-emerald-700'}`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Aprovada (Dar Baixa)</span>
            </button>
            <button
              onClick={() => {
                updateKvStatus(project.id, 'reprovada');
                setShowKvDropdown(false);
              }}
              className={`w-full px-2.5 py-1.5 text-left flex items-center gap-2 hover:bg-rose-50 ${status === 'reprovada' ? 'font-bold text-rose-900 bg-rose-50' : 'text-rose-700'}`}
            >
              <XCircle className="w-3.5 h-3.5 text-rose-500" />
              <span>Reprovada</span>
            </button>
          </div>
        )}
      </div>
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
      className="project-card group relative bg-white border border-slate-200/90 rounded-xl p-3 shadow-xs hover:shadow-md transition-all duration-150 hover:-translate-y-0.5 cursor-grab active:cursor-grabbing border-l-4 select-none"
      style={{
        borderLeftColor:
          project.columnId === 'col_risk'
            ? '#ef4444'
            : project.columnId === 'col_45'
            ? '#f59e0b'
            : project.columnId === 'col_60'
            ? '#0284c7'
            : '#10b981',
      }}
    >
      {/* Topo do Card: Mecanismo, Nome do Projeto e Menu de Ações */}
      <div className="flex items-start justify-between gap-1.5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
              {project.lawMechanism || 'Geral'}
            </span>
            {project.code && project.code !== 'Sem informação Migrada' && (
              <span className="text-[9.5px] font-mono text-slate-500 truncate max-w-[120px]" title={project.code}>
                #{project.code.split('\n')[0]}
              </span>
            )}
            {project.isCompleted && (
              <span 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCompleted(project.id);
                }}
                className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-teal-100 text-teal-800 border border-teal-300 cursor-pointer flex items-center gap-0.5"
                title="Projeto Concluído (Prestação de contas apresentada/aprovada). Clique para alternar."
              >
                <CheckCircle2 className="w-2.5 h-2.5 text-teal-600" />
                Concluído
              </span>
            )}
            {project.isInTreaty && !project.isCompleted && (
              <span 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleTreaty(project.id);
                }}
                className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 border border-purple-200 cursor-pointer"
                title="Projeto em Tratativa (Prorrogação solicitada, etc.). Clique para alternar."
              >
                Tratativa
              </span>
            )}
          </div>

          <h3 
            className="font-bold text-slate-800 text-xs sm:text-[13px] leading-snug line-clamp-2 group-hover:text-sky-800 transition-colors"
            title={project.name}
          >
            {project.name}
          </h3>

          {project.status && project.status !== 'Sem informação Migrada' && (
            <p className="text-[11px] text-slate-600 mt-0.5 truncate" title={`Status: ${project.status}`}>
              <span className="text-slate-400">Status:</span> <strong className="text-slate-800 font-semibold">{project.status}</strong>
            </p>
          )}

          {project.readequationNotes && (
            <p className="text-[10px] text-indigo-950 bg-indigo-50 border border-indigo-200 rounded px-1.5 py-0.5 mt-1 line-clamp-2" title={`Data da readequação: ${project.readequationNotes}`}>
              <strong className="font-bold text-indigo-900">Readequação:</strong> {project.readequationNotes}
            </p>
          )}

          {project.notes && (
            <p className="text-[10px] text-slate-700 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 mt-0.5 line-clamp-2" title={`Observação: ${project.notes}`}>
              <strong className="font-bold text-slate-800">Obs:</strong> {project.notes}
            </p>
          )}
        </div>

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
            <div className="absolute right-0 top-6 z-30 w-52 bg-white border border-slate-200 rounded-lg shadow-lg py-1 text-xs">
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

              <button
                onClick={() => {
                  toggleCompleted(project.id);
                  setShowMenu(false);
                }}
                className="w-full px-3 py-1.5 text-left text-teal-700 hover:bg-teal-50 flex items-center gap-2 font-medium"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                <span>{project.isCompleted ? 'Desmarcar Concluído' : 'Marcar como Concluído'}</span>
              </button>

              <button
                onClick={() => {
                  toggleTreaty(project.id);
                  setShowMenu(false);
                }}
                className="w-full px-3 py-1.5 text-left text-purple-700 hover:bg-purple-50 flex items-center gap-2"
              >
                <FileCheck2 className="w-3.5 h-3.5 text-purple-600" />
                <span>{project.isInTreaty ? 'Remover de Tratativa' : 'Marcar como Em Tratativa'}</span>
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
              {project.columnId !== 'col_45' && (
                <button
                  onClick={() => handleQuickMove('col_45')}
                  className="w-full px-3 py-1 text-left text-slate-600 hover:bg-amber-50 hover:text-amber-700 flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  45 Dias
                </button>
              )}
              {project.columnId !== 'col_risk' && (
                <button
                  onClick={() => handleQuickMove('col_risk')}
                  className="w-full px-3 py-1 text-left text-slate-600 hover:bg-red-50 hover:text-red-700 flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  32 Dias (Risco)
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

      {/* Seção Central: Controle de KV / Arte Digital */}
      <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
        {renderKvTag()}
      </div>

      {/* Sinalizações Exclusivas para PROAC ICMS: 1) Agenda Viva e 2) Sistema PROAC */}
      {isProac && (
        <div className="mt-2 pt-2 border-t border-dashed border-slate-200 space-y-1" onClick={(e) => e.stopPropagation()}>
          <div className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Sinalizações PROAC</span>
          </div>
          
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* 1) Agenda Viva */}
            <button
              onClick={() => toggleProacField(project.id, 'agendaViva')}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border transition-colors shadow-2xs ${
                project.agendaVivaRegistered
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300'
              }`}
              title="Clique para alternar se o projeto já foi cadastrado no Agenda Viva"
            >
              <CalendarCheck2 className={`w-3 h-3 ${project.agendaVivaRegistered ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span>Agenda Viva: {project.agendaVivaRegistered ? 'Cadastrado' : 'Pendente'}</span>
            </button>

            {/* 2) Sistema do PROAC */}
            <button
              onClick={() => toggleProacField(project.id, 'proacSystem')}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border transition-colors shadow-2xs ${
                project.proacSystemRegistered
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300'
              }`}
              title="Clique para alternar se o projeto já foi cadastrado no Sistema do PROAC"
            >
              <Building className={`w-3 h-3 ${project.proacSystemRegistered ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span>Sis. PROAC: {project.proacSystemRegistered ? 'Cadastrado' : 'Pendente'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Linha Inferior: Quantidade de Dias para Vencer e Edição Rápida */}
      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100">
        <div>
          {renderDaysBadge()}
        </div>

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
