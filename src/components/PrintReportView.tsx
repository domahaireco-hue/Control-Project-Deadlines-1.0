'use client';

import React from 'react';
import { Project, KanbanColumnId } from '@/types';
import { formatDatePtBr, EMPTY_CELL_FALLBACK } from '@/services/spreadsheetService';
import { KANBAN_COLUMNS } from '@/context/ProjectContext';

interface PrintReportViewProps {
  projects: Project[];
  selectedMechanism?: string;
  searchQuery?: string;
  forceScreenVisible?: boolean;
}

export const PrintReportView: React.FC<PrintReportViewProps> = ({
  projects,
  selectedMechanism = 'Todos',
  searchQuery = '',
  forceScreenVisible = false,
}) => {
  // Data e hora da emissão
  const currentDate = new Date().toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Estatísticas do relatório
  const totalCount = projects.length;
  const countRisk = projects.filter((p) => p.columnId === 'col_risk').length;
  const count30 = projects.filter((p) => p.columnId === 'col_30').length;
  const count60 = projects.filter((p) => p.columnId === 'col_60').length;
  const count90 = projects.filter((p) => p.columnId === 'col_90').length;

  // Ordenação das colunas para impressão (da mais urgente para a mais segura)
  const printColumnsOrder: { id: KanbanColumnId; title: string; subtitle: string; badge: string; color: string }[] = [
    {
      id: 'col_risk',
      title: '1. PRAZO CRÍTICO - RISCO (Até 15 dias ou Vencidos)',
      subtitle: 'Ação Imediata Necessária',
      badge: 'bg-red-100 text-red-900 border-red-300',
      color: '#b91c1c',
    },
    {
      id: 'col_30',
      title: '2. ALERTA DE ENTREGA (16 a 30 dias)',
      subtitle: 'Vencimento Próximo',
      badge: 'bg-amber-100 text-amber-900 border-amber-300',
      color: '#b45309',
    },
    {
      id: 'col_60',
      title: '3. ATENÇÃO OPERACIONAL (31 a 60 dias)',
      subtitle: 'Acompanhamento Regular',
      badge: 'bg-sky-100 text-sky-900 border-sky-300',
      color: '#0369a1',
    },
    {
      id: 'col_90',
      title: '4. PRAZO SEGURO (Acima de 60 dias)',
      subtitle: 'Planejamento e Execução',
      badge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      color: '#047857',
    },
  ];

  // Helper para formatar o texto de dias para vencer
  const formatDaysText = (days: number | null | undefined) => {
    if (days === null || days === undefined) {
      return { text: 'Sem Prazo', isOverdue: false, isWarning: false };
    }
    if (days <= 0) {
      return { text: `VENCIDO (${Math.abs(days)}d)`, isOverdue: true, isWarning: true };
    }
    if (days <= 15) {
      return { text: `${days} dias restantes`, isOverdue: false, isWarning: true };
    }
    return { text: `${days} dias`, isOverdue: false, isWarning: false };
  };

  return (
    <div className={forceScreenVisible ? "w-full bg-white text-slate-900" : "print-report-view print-only w-full bg-white text-slate-900"}>
      {/* Cabeçalho Corporativo de Impressão (Quest Consult) */}
      <header className="border-b-2 border-slate-900 pb-3 mb-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-xl tracking-tight text-slate-900">QUEST CONSULT</span>
              <span className="text-xs px-2 py-0.5 font-bold uppercase rounded bg-slate-900 text-white">
                Controle de Prazos
              </span>
            </div>
            <h1 className="text-sm font-bold text-slate-800 uppercase mt-1">
              Relatório Executivo de Prazos de Projetos • Lista Textual (Paisagem)
            </h1>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Filtro: <strong className="text-slate-800">{selectedMechanism}</strong>
              {searchQuery && (
                <span>
                  {' '}• Termo de busca: &quot;<strong>{searchQuery}</strong>&quot;
                </span>
              )}
              {' '}• Emissão: <strong className="text-slate-800">{currentDate}</strong>
            </p>
          </div>

          {/* Resumo Numérico Executivo */}
          <div className="border border-slate-300 rounded p-2 text-right text-[11px] bg-slate-50 min-w-[280px]">
            <div className="font-bold text-xs text-slate-900 mb-1 border-b border-slate-200 pb-1 flex justify-between">
              <span>Total de Projetos:</span>
              <span className="text-sm">{totalCount}</span>
            </div>
            <div className="grid grid-cols-4 gap-1 text-center font-semibold text-[10px]">
              <div className="bg-red-100 text-red-900 p-1 rounded border border-red-200">
                <p>Risco 15d</p>
                <p className="text-xs font-bold">{countRisk}</p>
              </div>
              <div className="bg-amber-100 text-amber-900 p-1 rounded border border-amber-200">
                <p>30 Dias</p>
                <p className="text-xs font-bold">{count30}</p>
              </div>
              <div className="bg-sky-100 text-sky-900 p-1 rounded border border-sky-200">
                <p>60 Dias</p>
                <p className="text-xs font-bold">{count60}</p>
              </div>
              <div className="bg-emerald-100 text-emerald-900 p-1 rounded border border-emerald-200">
                <p>90 Dias</p>
                <p className="text-xs font-bold">{count90}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Lista Textual dos Projetos Agrupada por Nível de Prazo */}
      <div className="space-y-5">
        {printColumnsOrder.map((colGroup) => {
          const groupProjects = projects
            .filter((p) => p.columnId === colGroup.id)
            // Ordena pelo menor número de dias restantes primeiro
            .sort((a, b) => {
              const daysA = a.daysRemaining ?? 999999;
              const daysB = b.daysRemaining ?? 999999;
              return daysA - daysB;
            });

          return (
            <section key={colGroup.id} className="print-group-section break-inside-avoid">
              {/* Título da Seção */}
              <div
                className="flex items-center justify-between px-2.5 py-1.5 rounded-t border-t border-l border-r border-slate-400"
                style={{ backgroundColor: '#f1f5f9', borderLeftWidth: '5px', borderLeftColor: colGroup.color }}
              >
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-xs uppercase tracking-tight text-slate-900">
                    {colGroup.title}
                  </h2>
                  <span className="text-[10px] text-slate-600 font-medium">({colGroup.subtitle})</span>
                </div>
                <span className="font-bold text-xs px-2 py-0.5 rounded bg-white border border-slate-300 text-slate-800">
                  {groupProjects.length} {groupProjects.length === 1 ? 'projeto' : 'projetos'}
                </span>
              </div>

              {/* Tabela Textual da Seção */}
              {groupProjects.length === 0 ? (
                <div className="p-3 border border-slate-300 rounded-b bg-slate-50 text-[11px] text-slate-500 italic">
                  Nenhum projeto registrado nesta faixa de prazo.
                </div>
              ) : (
                <table className="print-table w-full text-[10.5px] border-collapse border border-slate-400">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-400">
                      <th className="p-1.5 border border-slate-300 text-center w-[30px]">#</th>
                      <th className="p-1.5 border border-slate-300 text-left w-[36%]">Nome do Projeto</th>
                      <th className="p-1.5 border border-slate-300 text-center w-[15%]">Dias p/ Vencer</th>
                      <th className="p-1.5 border border-slate-300 text-center w-[10%]">Data Entrega</th>
                      <th className="p-1.5 border border-slate-300 text-left w-[13%]">Mecanismo / Código</th>
                      <th className="p-1.5 border border-slate-300 text-left w-[14%]">Líder / Responsável</th>
                      <th className="p-1.5 border border-slate-300 text-left w-[12%]">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupProjects.map((proj, idx) => {
                      const daysInfo = formatDaysText(proj.daysRemaining);
                      const formattedDate = formatDatePtBr(proj.targetDate);

                      return (
                        <tr
                          key={proj.id}
                          className={`border-b border-slate-300 ${
                            idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'
                          }`}
                        >
                          {/* Número */}
                          <td className="p-1.5 border border-slate-300 text-center text-slate-500 font-mono text-[10px]">
                            {idx + 1}
                          </td>

                          {/* Nome do Projeto */}
                          <td className="p-1.5 border border-slate-300 font-semibold text-slate-900 leading-tight">
                            {proj.name}
                            {proj.client && proj.client !== EMPTY_CELL_FALLBACK && (
                              <span className="block font-normal text-[9.5px] text-slate-500">
                                Cliente: {proj.client}
                              </span>
                            )}
                          </td>

                          {/* Quantidade de Dias para Vencer */}
                          <td className="p-1.5 border border-slate-300 text-center font-bold">
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded text-[10px] ${
                                daysInfo.isOverdue
                                  ? 'bg-red-100 text-red-900 border border-red-300 font-black'
                                  : daysInfo.isWarning
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'text-slate-700'
                              }`}
                            >
                              {daysInfo.text}
                            </span>
                          </td>

                          {/* Data de Entrega */}
                          <td className="p-1.5 border border-slate-300 text-center text-slate-700 whitespace-nowrap">
                            {formattedDate}
                          </td>

                          {/* Mecanismo / Código */}
                          <td className="p-1.5 border border-slate-300 text-slate-700 leading-tight">
                            <span className="font-medium text-slate-800">{proj.lawMechanism || 'Geral'}</span>
                            {proj.code && proj.code !== EMPTY_CELL_FALLBACK && (
                              <span className="block text-[9.5px] font-mono text-slate-500">
                                {proj.code}
                              </span>
                            )}
                          </td>

                          {/* Líder / Responsável */}
                          <td className="p-1.5 border border-slate-300 text-slate-700">
                            {proj.responsible || EMPTY_CELL_FALLBACK}
                          </td>

                          {/* Status */}
                          <td className="p-1.5 border border-slate-300 text-slate-700 text-[10px]">
                            {proj.status || 'Em Execução'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </section>
          );
        })}
      </div>

      {/* Rodapé do Relatório */}
      <footer className="mt-6 pt-2 border-t border-slate-400 text-[10px] text-slate-500 flex justify-between items-center">
        <span>Quest Consult • Sistema Executivo de Gestão de Prazos • Documento Confidencial</span>
        <span>Impresso em Modo Paisagem • Página 1 de 1</span>
      </footer>
    </div>
  );
};
