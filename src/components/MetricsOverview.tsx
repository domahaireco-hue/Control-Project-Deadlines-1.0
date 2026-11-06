'use client';

import React, { useState } from 'react';
import { 
  Search, 
  X, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Flame, 
  Layers, 
  Filter,
  FileCheck2,
  CalendarCheck2,
  HelpCircle,
  Plus,
  Check,
  Scale
} from 'lucide-react';
import { useProjects } from '@/context/ProjectContext';
import { IncentiveLawsModal } from '@/components/IncentiveLawsModal';

export const MetricsOverview: React.FC = () => {
  const { 
    projects, 
    filteredProjects, 
    selectedMechanism, 
    setSelectedMechanism, 
    searchQuery, 
    setSearchQuery,
    availableMechanisms,
    addCustomLaw,
    incentiveLaws,
    selectedIncentiveLaw,
    setSelectedIncentiveLaw,
    getProjectsCountByLaw,
    treatyFilter,
    setTreatyFilter
  } = useProjects();

  const [isAddingTable, setIsAddingTable] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [isLawsModalOpen, setIsLawsModalOpen] = useState(false);

  const handleSaveNewTable = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTableName.trim();
    if (!trimmed) return;

    const success = addCustomLaw(trimmed);
    if (success) {
      setSelectedMechanism(trimmed);
      setIsAddingTable(false);
      setNewTableName('');
    } else {
      alert(`A tabela "${trimmed}" já está cadastrada ou o nome é inválido.`);
    }
  };

  // Contadores por coluna ajustadas (90, 60, 45, 32)
  const countCompleted = projects.filter((p) => p.isCompleted).length;
  const countTreaty = projects.filter((p) => p.isInTreaty && !p.isCompleted).length;
  const countActive = projects.filter((p) => !p.isCompleted && (!p.isInTreaty || p.status?.includes('Prorrogação'))).length;
  const count90 = projects.filter((p) => p.columnId === 'col_90' && !p.isInTreaty && !p.isCompleted).length;
  const count60 = projects.filter((p) => p.columnId === 'col_60' && !p.isInTreaty && !p.isCompleted).length;
  const count45 = projects.filter((p) => (p.columnId === 'col_45' || p.columnId === 'col_30') && !p.isInTreaty && !p.isCompleted).length;
  const countRisk32 = projects.filter((p) => (p.columnId === 'col_risk' || p.columnId === 'col_32') && !p.isInTreaty && !p.isCompleted).length;

  // KV métricas
  const kvApproved = projects.filter((p) => p.kvStatus === 'aprovada').length;
  const kvPending = projects.filter((p) => !p.kvStatus || p.kvStatus === 'nao_enviado').length;

  return (
    <div className="bg-white border-b border-quest-200 py-3 px-2 sm:px-4 lg:px-6 shadow-xs no-print">
      <div className="w-full max-w-[1920px] mx-auto space-y-3">
        
        {/* KPI Cards (Janelas 90, 60, 45, 32 Dias, Tratativa e Concluídos) - Visualização Estatística (Não clicáveis) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5 select-none">
          
          {/* Total Projetos */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between shadow-2xs cursor-default">
            <div>
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Total Geral</p>
              <p className="text-xl font-black text-slate-900 mt-0.5">{projects.length}</p>
              <p className="text-[9px] text-slate-500 font-medium">Projetos Ativos</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center text-slate-700">
              <Layers className="w-4 h-4" />
            </div>
          </div>

          {/* Coluna 90 Dias */}
          <div className="bg-emerald-50/80 border border-emerald-300 rounded-xl p-2.5 flex items-center justify-between shadow-2xs cursor-default">
            <div>
              <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">90 Dias</p>
              <p className="text-xl font-black text-emerald-950 mt-0.5">{count90}</p>
              <p className="text-[9px] text-emerald-700 font-semibold">&gt; 60d Seguro</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          {/* Coluna 60 Dias */}
          <div className="bg-sky-50/80 border border-sky-300 rounded-xl p-2.5 flex items-center justify-between shadow-2xs cursor-default">
            <div>
              <p className="text-[10px] font-bold text-sky-800 uppercase tracking-wider">60 Dias</p>
              <p className="text-xl font-black text-sky-950 mt-0.5">{count60}</p>
              <p className="text-[9px] text-sky-700 font-semibold">46 a 60d Atenção</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center text-sky-700 border border-sky-200">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          {/* Coluna 45 Dias */}
          <div className="bg-amber-50/80 border border-amber-300 rounded-xl p-2.5 flex items-center justify-between shadow-2xs cursor-default">
            <div>
              <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">45 Dias</p>
              <p className="text-xl font-black text-amber-950 mt-0.5">{count45}</p>
              <p className="text-[9px] text-amber-700 font-semibold">Alerta Prorrogação</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 border border-amber-200">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>

          {/* Coluna 32 Dias (Risco) */}
          <div className="bg-red-50 border border-red-300 rounded-xl p-2.5 flex items-center justify-between shadow-2xs cursor-default">
            <div>
              <p className="text-[10px] font-bold text-red-800 uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping"></span>
                32 Dias (Risco)
              </p>
              <p className="text-xl font-black text-red-950 mt-0.5">{countRisk32}</p>
              <p className="text-[9px] text-red-700 font-bold">Limite Legal</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-700 border border-red-200">
              <Flame className="w-4 h-4" />
            </div>
          </div>

          {/* Projetos em Tratativa */}
          <div className="bg-purple-50/80 border border-purple-300 rounded-xl p-2.5 flex items-center justify-between shadow-2xs cursor-default">
            <div>
              <p className="text-[10px] font-bold text-purple-800 uppercase tracking-wider">Em Tratativa</p>
              <p className="text-xl font-black text-purple-950 mt-0.5">{countTreaty}</p>
              <p className="text-[9px] text-purple-700 font-semibold">Prorrogação</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-800 border border-purple-200">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>

          {/* Projetos Concluídos */}
          <div className="bg-teal-50/80 border border-teal-300 rounded-xl p-2.5 flex items-center justify-between shadow-2xs cursor-default">
            <div>
              <p className="text-[10px] font-bold text-teal-800 uppercase tracking-wider">Concluídos</p>
              <p className="text-xl font-black text-teal-950 mt-0.5">{countCompleted}</p>
              <p className="text-[9px] text-teal-700 font-semibold">PC Apresentada</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center text-teal-800 border border-teal-200">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

        </div>

        {/* Linha de Filtros: Filtro de Tratativa/Concluídos, Mecanismos/Abas e Campo de Pesquisa */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pt-1">
          
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none flex-wrap">

            {/* Tabelas / Abas de Origem */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-0.5 hidden sm:inline">
                Tabela:
              </span>
              {availableMechanisms.map((mech) => {
                const isSelected = selectedMechanism === mech;
                const countForMech = mech === 'Todos' || mech === 'Todas'
                  ? projects.length 
                  : projects.filter((p) => p.lawMechanism === mech).length;

                return (
                  <button
                    key={mech}
                    onClick={() => setSelectedMechanism(mech)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-quest-900 text-white shadow-2xs ring-1 ring-quest-950 font-semibold'
                        : 'bg-quest-100 hover:bg-quest-200 text-quest-700'
                    }`}
                  >
                    <span>{mech === 'Todos' ? 'Todas' : mech}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                        isSelected ? 'bg-quest-700 text-white' : 'bg-quest-200 text-quest-600'
                      }`}
                    >
                      {countForMech}
                    </span>
                  </button>
                );
              })}

              {/* Botão e Formulário para Cadastrar Nova Tabela */}
              {isAddingTable ? (
                <form
                  onSubmit={handleSaveNewTable}
                  className="flex items-center gap-1 bg-white border border-sky-400 rounded-lg p-0.5 shadow-2xs animate-in fade-in duration-150"
                >
                  <input
                    type="text"
                    value={newTableName}
                    onChange={(e) => setNewTableName(e.target.value)}
                    placeholder="Nome da tabela..."
                    autoFocus
                    className="px-2 py-0.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none w-28 sm:w-32 font-medium bg-transparent"
                  />
                  <button
                    type="submit"
                    title="Adicionar Tabela"
                    className="p-1 rounded text-emerald-600 hover:bg-emerald-50 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingTable(false);
                      setNewTableName('');
                    }}
                    title="Cancelar"
                    className="p-1 rounded text-slate-400 hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingTable(true)}
                  title="Cadastrar nova Tabela de Projetos"
                  className="px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 border border-dashed border-quest-300 hover:border-sky-500 text-quest-600 hover:text-sky-600 bg-white hover:bg-sky-50/50 shadow-2xs group"
                >
                  <Plus className="w-3.5 h-3.5 text-quest-400 group-hover:text-sky-600 transition-colors" />
                  <span>Nova Tabela</span>
                </button>
              )}
            </div>

            {/* Separador Vertical */}
            <div className="h-5 w-px bg-slate-200 hidden sm:block shrink-0 mx-1"></div>

            {/* Leis de Incentivo: Filtro e Gestão Completa */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider mr-0.5 hidden xl:inline">
                Lei:
              </span>
              <select
                value={selectedIncentiveLaw}
                onChange={(e) => setSelectedIncentiveLaw(e.target.value)}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-indigo-200 bg-indigo-50/70 text-indigo-950 hover:bg-indigo-50 focus:outline-none focus:ring-1 focus:ring-indigo-400 cursor-pointer shadow-2xs max-w-[210px] truncate"
                title="Filtrar por Lei de Incentivo"
              >
                <option value="Todas">Todas as Leis ({projects.length})</option>
                {incentiveLaws.map((law) => {
                  const count = getProjectsCountByLaw(law);
                  return (
                    <option key={law} value={law}>
                      {law} ({count})
                    </option>
                  );
                })}
              </select>

              <button
                type="button"
                onClick={() => setIsLawsModalOpen(true)}
                title="Gerenciar Leis de Incentivo (adicionar novas ou excluir leis sem projetos vinculados)"
                className="px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs shrink-0"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Gerenciar Leis</span>
              </button>
            </div>

          </div>

          {/* Campo de Busca Rápida */}
          <div className="relative min-w-[240px] max-w-sm">
            <Search className="w-4 h-4 text-quest-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por projeto, PRONAC, status..."
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-quest-50 border border-quest-200 rounded-lg text-quest-900 placeholder-quest-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-quest-400 hover:text-quest-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

        </div>

      </div>

      {/* Modal de Gestão de Leis de Incentivo */}
      <IncentiveLawsModal
        isOpen={isLawsModalOpen}
        onClose={() => setIsLawsModalOpen(false)}
      />
    </div>
  );
};
