'use client';

import React from 'react';
import { 
  Search, 
  X, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Flame, 
  Layers, 
  Filter 
} from 'lucide-react';
import { useProjects } from '@/context/ProjectContext';

export const MetricsOverview: React.FC = () => {
  const { 
    projects, 
    filteredProjects, 
    selectedMechanism, 
    setSelectedMechanism, 
    searchQuery, 
    setSearchQuery,
    availableMechanisms
  } = useProjects();

  // Contadores por coluna
  const count90 = projects.filter((p) => p.columnId === 'col_90').length;
  const count60 = projects.filter((p) => p.columnId === 'col_60').length;
  const count30 = projects.filter((p) => p.columnId === 'col_30').length;
  const countRisk = projects.filter((p) => p.columnId === 'col_risk').length;

  return (
    <div className="bg-white border-b border-quest-200 py-4 px-4 sm:px-6 lg:px-8 shadow-sm no-print">
      <div className="max-w-7xl mx-auto space-y-4">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          
          {/* Total Projetos */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Geral</p>
              <p className="text-2xl font-bold text-slate-800 mt-0.5">{projects.length}</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-slate-200 flex items-center justify-center text-slate-600">
              <Layers className="w-5 h-5" />
            </div>
          </div>

          {/* Coluna 90 Dias */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">90 Dias</p>
              <p className="text-2xl font-bold text-emerald-900 mt-0.5">{count90}</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          {/* Coluna 60 Dias */}
          <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-3 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-[11px] font-semibold text-sky-700 uppercase tracking-wider">60 Dias</p>
              <p className="text-2xl font-bold text-sky-900 mt-0.5">{count60}</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-sky-100 flex items-center justify-center text-sky-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          {/* Coluna 30 Dias */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">30 Dias</p>
              <p className="text-2xl font-bold text-amber-900 mt-0.5">{count30}</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          {/* Coluna Risco (15 Dias) */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center justify-between shadow-xs col-span-2 sm:col-span-1">
            <div>
              <p className="text-[11px] font-semibold text-red-700 uppercase tracking-wider flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                Risco 15 Dias
              </p>
              <p className="text-2xl font-bold text-red-900 mt-0.5">{countRisk}</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
              <Flame className="w-5 h-5" />
            </div>
          </div>

        </div>

        {/* Barra de Filtros por Mecanismo/Aba e Campo de Pesquisa */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pt-1">
          
          {/* Mecanismos / Abas */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 lg:pb-0 scrollbar-none">
            <span className="text-xs font-semibold text-quest-500 flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5 text-quest-400" />
              Mecanismo:
            </span>
            {availableMechanisms.map((mech) => {
              const isSelected = selectedMechanism === mech;
              const countForMech = mech === 'Todos' 
                ? projects.length 
                : projects.filter((p) => p.lawMechanism === mech).length;

              return (
                <button
                  key={mech}
                  onClick={() => setSelectedMechanism(mech)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-quest-900 text-white shadow-sm ring-1 ring-quest-950 font-semibold'
                      : 'bg-quest-100 hover:bg-quest-200 text-quest-700'
                  }`}
                >
                  <span>{mech}</span>
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
          </div>

          {/* Campo de Busca Rápida */}
          <div className="relative min-w-[260px] max-w-sm">
            <Search className="w-4 h-4 text-quest-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por projeto, PRONAC, cliente..."
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
    </div>
  );
};
