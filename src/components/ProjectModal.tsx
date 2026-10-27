'use client';

import React, { useState, useEffect } from 'react';
import { Project, KanbanColumnId, LawMechanism, KvStatus } from '@/types';
import { 
  X, 
  Save, 
  Calendar, 
  User, 
  FileText, 
  Tag, 
  CheckCircle2, 
  Building2, 
  HelpCircle, 
  Clock4, 
  Clock, 
  XCircle, 
  CalendarCheck2, 
  Building,
  History,
  Plus
} from 'lucide-react';
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
  const { addProject, updateProject, addProjectHistoryNote, columns, availableMechanisms } = useProjects();

  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');
  const [newHistoryNote, setNewHistoryNote] = useState('');

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

  // Novos campos
  const [kvStatus, setKvStatus] = useState<KvStatus>('nao_enviado');
  const [agendaVivaRegistered, setAgendaVivaRegistered] = useState(false);
  const [proacSystemRegistered, setProacSystemRegistered] = useState(false);
  const [isInTreaty, setIsInTreaty] = useState(false);

  const isProac = lawMechanism === 'PROAC' || 
    (lawMechanism && lawMechanism.toUpperCase().includes('PROAC')) ||
    (lawMechanism && lawMechanism.toUpperCase().includes('ICMS'));

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
      setKvStatus(projectToEdit.kvStatus || 'nao_enviado');
      setAgendaVivaRegistered(projectToEdit.agendaVivaRegistered || false);
      setProacSystemRegistered(projectToEdit.proacSystemRegistered || false);
      setIsInTreaty(projectToEdit.isInTreaty || false);
      setActiveTab('details');
      setNewHistoryNote('');
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
      setKvStatus('nao_enviado');
      setAgendaVivaRegistered(false);
      setProacSystemRegistered(false);
      setIsInTreaty(false);
      setActiveTab('details');
      setNewHistoryNote('');
    }
  }, [projectToEdit, isOpen]);

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

    const baseTags = projectToEdit?.tags ? [...projectToEdit.tags] : [lawMechanism];
    if (isInTreaty && !baseTags.includes('Projetos em Tratativa')) {
      baseTags.push('Projetos em Tratativa');
    } else if (!isInTreaty) {
      const idx = baseTags.indexOf('Projetos em Tratativa');
      if (idx !== -1) baseTags.splice(idx, 1);
    }

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
        kvStatus,
        kvSent: kvStatus !== 'nao_enviado',
        agendaVivaRegistered: isProac ? agendaVivaRegistered : undefined,
        proacSystemRegistered: isProac ? proacSystemRegistered : undefined,
        isInTreaty,
        tags: baseTags,
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
        tags: baseTags,
        kvStatus,
        kvSent: kvStatus !== 'nao_enviado',
        agendaVivaRegistered: isProac ? agendaVivaRegistered : undefined,
        proacSystemRegistered: isProac ? proacSystemRegistered : undefined,
        isInTreaty,
      });
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in duration-200 my-8">
        
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

        {/* Abas: Detalhes do Projeto e Histórico de Atualizações */}
        {projectToEdit && (
          <div className="bg-slate-100 px-6 pt-2.5 border-b border-slate-200 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'details'
                  ? 'border-sky-600 text-sky-900 bg-white rounded-t-lg shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Dados do Projeto</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'border-sky-600 text-sky-900 bg-white rounded-t-lg shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <History className="w-3.5 h-3.5 text-sky-600" />
              <span>Histórico de Atualizações</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                {projectToEdit.history?.length || 0}
              </span>
            </button>
          </div>
        )}

        {/* Aba de Histórico de Auditoria */}
        {activeTab === 'history' && projectToEdit && (
          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            
            {/* Caixa para registrar nova anotação / atualização */}
            <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-xl space-y-2">
              <label className="block text-xs font-bold text-sky-950 uppercase tracking-wider">
                Registrar Nova Anotação / Atualização de Acompanhamento
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newHistoryNote}
                  onChange={(e) => setNewHistoryNote(e.target.value)}
                  placeholder="Ex: Documentação de prorrogação enviada; proponente aprovou artes..."
                  className="flex-1 px-3 py-2 text-xs border border-sky-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (newHistoryNote.trim()) {
                        addProjectHistoryNote(projectToEdit.id, newHistoryNote);
                        setNewHistoryNote('');
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newHistoryNote.trim()) {
                      addProjectHistoryNote(projectToEdit.id, newHistoryNote);
                      setNewHistoryNote('');
                    }
                  }}
                  className="px-4 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors flex items-center gap-1.5 shrink-0 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Registrar</span>
                </button>
              </div>
            </div>

            {/* Linha do tempo dos registros */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span>Histórico Completo de Alterações</span>
                <span className="text-[11px] font-normal text-slate-500">
                  Total de registros: {projectToEdit.history?.length || 0}
                </span>
              </h3>

              {(!projectToEdit.history || projectToEdit.history.length === 0) ? (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 text-slate-500">
                  <Clock className="w-6 h-6 mx-auto mb-1 text-slate-400" />
                  <p className="text-xs font-medium">Nenhum registro no histórico deste projeto ainda.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Qualquer edição, movimentação de card ou anotação ficará salva aqui.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
                  {projectToEdit.history.map((entry) => (
                    <div key={entry.id} className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                          {entry.action}
                        </span>
                        <span className="text-slate-400 font-mono text-[10px]">
                          {new Date(entry.timestamp).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      {entry.details && (
                        <p className="text-slate-600 text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1 whitespace-pre-wrap">
                          {entry.details}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Rodapé da aba de histórico */}
            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        )}

        {/* Formulário de Edição */}
        {activeTab === 'details' && (
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          
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

          {/* Seção Nova: KV / Arte Digital */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <span>Aprovação de KV / Arte Digital</span>
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status de KV / Arte Digital
                </label>
                <select
                  value={kvStatus}
                  onChange={(e) => setKvStatus(e.target.value as KvStatus)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white font-medium"
                >
                  <option value="nao_enviado">⚪ Não Enviada (Pendente de Envio)</option>
                  <option value="em_aprovacao">🟡 Enviada / Em Aprovação</option>
                  <option value="aprovada">🟢 Aprovada (Baixa Concedida)</option>
                  <option value="reprovada">🔴 Reprovada</option>
                </select>
              </div>

              <div className="flex items-center pt-5">
                <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={kvStatus !== 'nao_enviado'}
                    onChange={(e) => setKvStatus(e.target.checked ? 'em_aprovacao' : 'nao_enviado')}
                    className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                  />
                  <span>Arte já foi enviada para aprovação</span>
                </label>
              </div>
            </div>
          </div>

          {/* Seção Nova: Sinalizações Específicas para PROAC ICMS */}
          {isProac && (
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-700" />
                <span>Sinalizações Obrigatórias PROAC ICMS</span>
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-amber-200 cursor-pointer text-xs font-semibold text-slate-800 hover:border-amber-400 transition-colors">
                  <input
                    type="checkbox"
                    checked={agendaVivaRegistered}
                    onChange={(e) => setAgendaVivaRegistered(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span>1) Cadastrado no Agenda Viva</span>
                </label>

                <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-amber-200 cursor-pointer text-xs font-semibold text-slate-800 hover:border-amber-400 transition-colors">
                  <input
                    type="checkbox"
                    checked={proacSystemRegistered}
                    onChange={(e) => setProacSystemRegistered(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span>2) Cadastrado no Sistema do PROAC</span>
                </label>
              </div>
            </div>
          )}

          {/* Flag de Projeto em Tratativa */}
          <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-purple-950">Projeto em Tratativa / Prestação de Contas</p>
              <p className="text-[11px] text-purple-700">Não precisa pedir prorrogação (prestação de contas apresentada / em análise).</p>
            </div>
            <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-purple-900">
              <input
                type="checkbox"
                checked={isInTreaty}
                onChange={(e) => setIsInTreaty(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded border-purple-300 focus:ring-purple-500"
              />
              <span>Em Tratativa</span>
            </label>
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

          {/* Grid: Responsável e Status (Coluna C) */}
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
                Status Atual (Coluna C da Planilha)
              </label>
              <input
                type="text"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                placeholder="Ex: Desbloqueado, Em Execução, Prestação de Contas Apresentada..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
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
              Coluna do Kanban (Janela Temporal: 90, 60, 45, 32 Dias)
            </label>
            <select
              value={columnId}
              onChange={(e) => {
                setColumnId(e.target.value as KanbanColumnId);
                setIsManualColumn(true);
              }}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white font-medium"
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
        )}

      </div>
    </div>
  );
};
