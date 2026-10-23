'use client';

import React, { useState, useEffect } from 'react';
import { Project, KanbanColumnId, LawMechanism } from '@/types';
import { X, Save, Calendar, User, FileText, Tag, CheckCircle2, Building2 } from 'lucide-react';
import { useProjects } from '@/context/ProjectContext';
import { EMPTY_CELL_FALLBACK, calculateDaysRemaining, determineKanbanColumn } from '@/services/spreadsheetService';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectToEdit?: Project | null;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  projectToEdit,
}) => {
  const { addProject, updateProject, columns, availableMechanisms } = useProjects();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [client, setClient] = useState('');
  const [sponsor, setSponsor] = useState('');
  const [responsible, setResponsible] = useState('');
  const [startDate, setStartDate] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [status, setStatus] = useState('Em Execução');
  const [lawMechanism, setLawMechanism] = useState<LawMechanism>('Rouanet');
  const [columnId, setColumnId] = useState<KanbanColumnId>('col_90');
  const [notes, setNotes] = useState('');
  const [isManualColumn, setIsManualColumn] = useState(false);

  useEffect(() => {
    if (projectToEdit) {
      setName(projectToEdit.name || '');
      setCode(projectToEdit.code === EMPTY_CELL_FALLBACK ? '' : projectToEdit.code || '');
      setClient(projectToEdit.client === EMPTY_CELL_FALLBACK ? '' : projectToEdit.client || '');
      setSponsor(projectToEdit.sponsor === EMPTY_CELL_FALLBACK ? '' : projectToEdit.sponsor || '');
      setResponsible(projectToEdit.responsible === EMPTY_CELL_FALLBACK ? '' : projectToEdit.responsible || '');
      setStartDate(projectToEdit.startDate || '');
      setTargetDate(projectToEdit.targetDate || '');
      setStatus(projectToEdit.status || 'Em Execução');
      setLawMechanism(projectToEdit.lawMechanism || 'Rouanet');
      setColumnId(projectToEdit.columnId || 'col_90');
      setNotes(projectToEdit.notes === EMPTY_CELL_FALLBACK ? '' : projectToEdit.notes || '');
      setIsManualColumn(projectToEdit.isManualColumn || false);
    } else {
      setName('');
      setCode('');
      setClient('');
      setSponsor('');
      setResponsible('Quest Consult');
      setStartDate('');
      setTargetDate('');
      setStatus('Em Execução');
      setLawMechanism('Rouanet');
      setColumnId('col_90');
      setNotes('');
      setIsManualColumn(false);
    }
  }, [projectToEdit, isOpen]);

  // Se o usuário altera a data de entrega e não selecionou manualmente outra coluna, calcula automaticamente
  const handleTargetDateChange = (val: string) => {
    setTargetDate(val);
    if (!isManualColumn && val) {
      const days = calculateDaysRemaining(val);
      setColumnId(determineKanbanColumn(days));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Por favor, informe o Nome do Projeto.');
      return;
    }

    const calculatedDays = targetDate ? calculateDaysRemaining(targetDate) : null;
    const finalColumn = columnId;

    if (projectToEdit) {
      updateProject(projectToEdit.id, {
        name: name.trim(),
        code: code.trim() || EMPTY_CELL_FALLBACK,
        client: client.trim() || EMPTY_CELL_FALLBACK,
        sponsor: sponsor.trim() || EMPTY_CELL_FALLBACK,
        responsible: responsible.trim() || 'Quest Consult',
        startDate: startDate || null,
        targetDate: targetDate || null,
        daysRemaining: calculatedDays,
        status: status.trim() || 'Em Execução',
        lawMechanism,
        columnId: finalColumn,
        isManualColumn,
        notes: notes.trim() || EMPTY_CELL_FALLBACK,
      });
    } else {
      addProject({
        name: name.trim(),
        code: code.trim() || EMPTY_CELL_FALLBACK,
        client: client.trim() || EMPTY_CELL_FALLBACK,
        sponsor: sponsor.trim() || EMPTY_CELL_FALLBACK,
        responsible: responsible.trim() || 'Quest Consult',
        startDate: startDate || null,
        targetDate: targetDate || null,
        daysRemaining: calculatedDays,
        status: status.trim() || 'Em Execução',
        lawMechanism,
        columnId: finalColumn,
        isManualColumn,
        notes: notes.trim() || EMPTY_CELL_FALLBACK,
        tags: [lawMechanism],
      });
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in duration-200">
        
        {/* Header Modal */}
        <div className="bg-quest-900 text-white px-6 py-4 flex items-center justify-between border-b border-quest-800">
          <div>
            <h2 className="text-lg font-bold">
              {projectToEdit ? 'Editar Projeto' : 'Novo Projeto no Funil'}
            </h2>
            <p className="text-xs text-quest-400">
              {projectToEdit ? `Código: ${projectToEdit.code}` : 'Cadastrar projeto diretamente no Kanban'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-quest-400 hover:text-white hover:bg-quest-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Nome do Projeto */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nome do Projeto <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Mostra de Cinema Cine na Praça"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          {/* Grid: Código e Mecanismo / Lei */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Código / PRONAC / PROMAC
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ex: 221656 / 30256"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mecanismo / Lei de Incentivo
              </label>
              <select
                value={lawMechanism}
                onChange={(e) => setLawMechanism(e.target.value as LawMechanism)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
              >
                {availableMechanisms
                  .filter((m) => m !== 'Todos')
                  .map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Grid: Cliente/Proponente e Patrocinador */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cliente / Proponente
              </label>
              <input
                type="text"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                placeholder="Ex: Associação Cultural..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Patrocinador
              </label>
              <input
                type="text"
                value={sponsor}
                onChange={(e) => setSponsor(e.target.value)}
                placeholder="Ex: ArcelorMittal, Usiminas..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Grid: Responsável e Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Responsável / Líder Quest
              </label>
              <input
                type="text"
                value={responsible}
                onChange={(e) => setResponsible(e.target.value)}
                placeholder="Ex: Equipe Quest Consult"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status Atual
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
              >
                <option value="Em Execução">Em Execução</option>
                <option value="No prazo">No prazo</option>
                <option value="Desbloqueado">Desbloqueado</option>
                <option value="Atrasado">Atrasado</option>
                <option value="Prestação de Contas Apresentada">Prestação de Contas Apresentada</option>
                <option value="Finalizado">Finalizado</option>
              </select>
            </div>
          </div>

          {/* Grid: Datas (Início e Entrega Prevista) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Data de Início / Readequação
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Data de Entrega Prevista <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => handleTargetDateChange(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Coluna Kanban */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Coluna do Kanban (Janela Temporal)
            </label>
            <select
              value={columnId}
              onChange={(e) => {
                setColumnId(e.target.value as KanbanColumnId);
                setIsManualColumn(true);
              }}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
            >
              {columns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} — {c.subtitle}
                </option>
              ))}
            </select>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observações / Histórico de Readequação
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Pedido de prorrogação enviado em..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          {/* Ações */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{projectToEdit ? 'Salvar Alterações' : 'Cadastrar Projeto'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
