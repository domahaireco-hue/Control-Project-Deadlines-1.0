'use client';

import React from 'react';
import { Project, KanbanColumnId } from '@/types';
import { formatDatePtBr, EMPTY_CELL_FALLBACK } from '@/services/spreadsheetService';

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
  const currentDate = new Date().toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const totalCount = projects.length;
  const countCompleted = projects.filter((p) => p.isCompleted).length;
  const countRisk = projects.filter((p) => (p.columnId === 'col_risk' || p.columnId === 'col_32') && !p.isCompleted).length;
  const count45 = projects.filter((p) => (p.columnId === 'col_45' || p.columnId === 'col_30') && !p.isCompleted).length;
  const count60 = projects.filter((p) => p.columnId === 'col_60' && !p.isCompleted).length;
  const count90 = projects.filter((p) => p.columnId === 'col_90' && !p.isCompleted && !p.isInTreaty).length;
  const countTreaty = projects.filter((p) => p.isInTreaty && !p.isCompleted).length;
  const countKvApproved = projects.filter((p) => p.kvStatus === 'aprovada').length;

  const printColumnsOrder: { id: KanbanColumnId; matchIds: string[]; title: string; subtitle: string; badge: string; color: string }[] = [
    {
      id: 'col_risk',
      matchIds: ['col_risk', 'col_32'],
      title: '1. LIMITE LEGAL DE PRORROGAÇÃO - 32 DIAS / RISCO CRÍTICO',
      subtitle: 'Ação Imediata (<= 32 dias ou Vencidos)',
      badge: 'bg-red-100 text-red-900 border-red-300',
      color: '#b91c1c',
    },
    {
      id: 'col_45',
      matchIds: ['col_45', 'col_30'],
      title: '2. ALERTA DE PREPARAÇÃO DE PRORROGAÇÃO (33 a 45 dias)',
      subtitle: 'Preparar documentação técnica',
      badge: 'bg-amber-100 text-amber-900 border-amber-300',
      color: '#b45309',
    },
    {
      id: 'col_60',
      matchIds: ['col_60'],
      title: '3. ATENÇÃO OPERACIONAL (46 a 60 dias)',
      subtitle: 'Acompanhamento Regular',
      badge: 'bg-sky-100 text-sky-900 border-sky-300',
      color: '#0369a1',
    },
    {
      id: 'col_90',
      matchIds: ['col_90'],
      title: '4. PRAZO SEGURO (Acima de 60 dias)',
      subtitle: 'Planejamento e Execução',
      badge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      color: '#047857',
    },
    {
      id: 'col_completed',
      matchIds: ['col_completed'],
      title: '5. CONCLUÍDOS / FINALIZADOS (Prestação de Contas Apresentada / Aprovada)',
      subtitle: 'Projetos finalizados',
      badge: 'bg-teal-100 text-teal-900 border-teal-300',
      color: '#0d9488',
    },
  ];

  const formatDaysText = (days: number | null | undefined, isInTreaty?: boolean, isCompleted?: boolean) => {
    if (isCompleted) {
      return { text: 'Concluído (PC)', isOverdue: false, isWarning: false, isTreaty: false, isCompleted: true };
    }
    if (isInTreaty) {
      return { text: 'Em Tratativa', isOverdue: false, isWarning: false, isTreaty: true, isCompleted: false };
    }
    if (days === null || days === undefined) {
      return { text: 'Sem Prazo', isOverdue: false, isWarning: false, isTreaty: false, isCompleted: false };
    }
    if (days <= 0) {
      return { text: `VENCIDO (${Math.abs(days)}d)`, isOverdue: true, isWarning: true, isTreaty: false, isCompleted: false };
    }
    if (days <= 32) {
      return { text: `${days}d (Limite 32d)`, isOverdue: false, isWarning: true, isTreaty: false, isCompleted: false };
    }
    if (days <= 45) {
      return { text: `${days}d (Alerta 45d)`, isOverdue: false, isWarning: true, isTreaty: false, isCompleted: false };
    }
    return { text: `${days} dias`, isOverdue: false, isWarning: false, isTreaty: false, isCompleted: false };
  };

  const getKvBadge = (status?: string) => {
    if (status === 'aprovada') return <span className="text-emerald-700 font-bold">KV: Aprovada</span>;
    if (status === 'em_aprovacao') return <span className="text-amber-700 font-bold">KV: Em Aprovação</span>;
    if (status === 'reprovada') return <span className="text-rose-700 font-bold">KV: Reprovada</span>;
    return <span className="text-slate-500">KV: Pendente</span>;
  };

  return (
    <div className={forceScreenVisible ? "w-full bg-white text-slate-900" : "print-report-view print-only w-full bg-white text-slate-900"}>
      {/* Cabeçalho Corporativo de Impressão Quest Consult */}
      <header className="border-b-2 border-slate-900 pb-3 mb-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-xl tracking-tight text-slate-900">QUEST CONSULT</span>
              <span className="text-xs px-2 py-0.5 font-bold uppercase rounded bg-slate-900 text-white">
                Controle de Prazos Executivo
              </span>
            </div>
            <h1 className="text-sm font-bold text-slate-800 uppercase mt-1">
              Relatório Geral de Vencimento de Projetos • Lista Paisagem (90, 60, 45, 32 Dias)
            </h1>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Destinatários Diários: <strong className="text-slate-800">catelani@questconsult.com.br, tk@questconsult.com.br, lucas@questconsult.com.br, bruno.britto@questconsult.com.br</strong>
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Filtro: <strong>{selectedMechanism}</strong>
              {searchQuery && <span> • Busca: &quot;<strong>{searchQuery}</strong>&quot;</span>}
              {' '}• Emissão: <strong>{currentDate}</strong>
            </p>
          </div>

          {/* Resumo Numérico Executivo */}
          <div className="border border-slate-300 rounded p-2 text-right text-[11px] bg-slate-50 min-w-[320px]">
            <div className="font-bold text-xs text-slate-900 mb-1 border-b border-slate-200 pb-1 flex justify-between">
              <span>Total de Projetos:</span>
              <span className="text-sm font-black">{totalCount}</span>
            </div>
            <div className="grid grid-cols-6 gap-1 text-center font-semibold text-[9.5px]">
              <div className="bg-red-100 text-red-900 p-1 rounded border border-red-200">
                <p>32d Risco</p>
                <p className="text-xs font-bold">{countRisk}</p>
              </div>
              <div className="bg-amber-100 text-amber-900 p-1 rounded border border-amber-200">
                <p>45 Dias</p>
                <p className="text-xs font-bold">{count45}</p>
              </div>
              <div className="bg-sky-100 text-sky-900 p-1 rounded border border-sky-200">
                <p>60 Dias</p>
                <p className="text-xs font-bold">{count60}</p>
              </div>
              <div className="bg-emerald-100 text-emerald-900 p-1 rounded border border-emerald-200">
                <p>90 Dias</p>
                <p className="text-xs font-bold">{count90}</p>
              </div>
              <div className="bg-purple-100 text-purple-900 p-1 rounded border border-purple-200">
                <p>Tratativa</p>
                <p className="text-xs font-bold">{countTreaty}</p>
              </div>
              <div className="bg-teal-100 text-teal-900 p-1 rounded border border-teal-200">
                <p>Concluídos</p>
                <p className="text-xs font-bold">{countCompleted}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Lista Textual dos Projetos Agrupada por Nível de Prazo */}
      <div className="space-y-4">
        {printColumnsOrder.map((colGroup) => {
          const groupProjects = projects
            .filter((p) => colGroup.matchIds.includes(p.columnId))
            .sort((a, b) => {
              const daysA = a.daysRemaining ?? 999999;
              const daysB = b.daysRemaining ?? 999999;
              return daysA - daysB;
            });

          return (
            <section key={colGroup.id} className="print-group-section break-inside-avoid">
              <div
                className="flex items-center justify-between px-2.5 py-1.5 rounded-t border-t border-l border-r border-slate-400"
                style={{ backgroundColor: '#f8fafc', borderLeftWidth: '5px', borderLeftColor: colGroup.color }}
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

              {groupProjects.length === 0 ? (
                <div className="p-2.5 border border-slate-300 rounded-b bg-slate-50 text-[11px] text-slate-500 italic">
                  Nenhum projeto registrado nesta faixa de prazo.
                </div>
              ) : (
                <table className="print-table w-full text-[10px] border-collapse border border-slate-400">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-400">
                      <th className="p-1 border border-slate-300 text-center w-[25px]">#</th>
                      <th className="p-1 border border-slate-300 text-left w-[30%]">Nome do Projeto</th>
                      <th className="p-1 border border-slate-300 text-center w-[12%]">Dias Restantes</th>
                      <th className="p-1 border border-slate-300 text-center w-[9%]">Data Entrega</th>
                      <th className="p-1 border border-slate-300 text-left w-[12%]">Mecanismo / Código</th>
                      <th className="p-1 border border-slate-300 text-left w-[12%]">Status (Col C)</th>
                      <th className="p-1 border border-slate-300 text-center w-[12%]">KV / Arte Digital</th>
                      <th className="p-1 border border-slate-300 text-left w-[13%]">Sinalizações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupProjects.map((proj, idx) => {
                      const daysInfo = formatDaysText(proj.daysRemaining, proj.isInTreaty, proj.isCompleted);
                      const formattedDate = formatDatePtBr(proj.targetDate);
                      const isProac = proj.lawMechanism === 'PROAC' || (proj.lawMechanism && proj.lawMechanism.toUpperCase().includes('PROAC'));

                      return (
                        <tr
                          key={proj.id}
                          className={`border-b border-slate-300 ${
                            idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'
                          }`}
                        >
                          <td className="p-1 border border-slate-300 text-center text-slate-500 font-mono text-[9px]">
                            {idx + 1}
                          </td>

                          <td className="p-1 border border-slate-300 font-semibold text-slate-900 leading-tight">
                            {proj.name}
                            {proj.client && proj.client !== EMPTY_CELL_FALLBACK && (
                              <span className="block font-normal text-[9px] text-slate-500">
                                Proponente: {proj.client}
                              </span>
                            )}
                          </td>

                          <td className="p-1 border border-slate-300 text-center font-bold">
                            <span
                              className={`inline-block px-1 py-0.2 rounded text-[9.5px] ${
                                daysInfo.isCompleted
                                  ? 'bg-teal-100 text-teal-900 border border-teal-300 font-bold'
                                  : daysInfo.isOverdue
                                  ? 'bg-red-100 text-red-900 border border-red-300 font-black'
                                  : daysInfo.isWarning
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : daysInfo.isTreaty
                                  ? 'bg-purple-100 text-purple-900 border border-purple-200'
                                  : 'text-slate-700'
                              }`}
                            >
                              {daysInfo.text}
                            </span>
                          </td>

                          <td className="p-1 border border-slate-300 text-center text-slate-700 whitespace-nowrap">
                            {formattedDate}
                          </td>

                          <td className="p-1 border border-slate-300 text-slate-700 leading-tight">
                            <span className="font-semibold text-slate-800">{proj.lawMechanism || 'Geral'}</span>
                            {proj.code && proj.code !== EMPTY_CELL_FALLBACK && (
                              <span className="block text-[8.5px] font-mono text-slate-500 truncate max-w-[110px]">
                                #{proj.code.split('\n')[0]}
                              </span>
                            )}
                          </td>

                          <td className="p-1 border border-slate-300 text-slate-700 text-[9.5px] font-medium leading-tight">
                            {proj.status || 'Em Execução'}
                            {proj.isCompleted && (
                              <span className="block text-[8px] font-bold text-teal-800 uppercase">
                                [Concluído]
                              </span>
                            )}
                            {proj.isInTreaty && !proj.isCompleted && (
                              <span className="block text-[8px] font-bold text-purple-700 uppercase">
                                [Em Tratativa]
                              </span>
                            )}
                            {proj.readequationNotes && (
                              <span className="block text-[8px] font-semibold text-indigo-800">
                                Readeq: {proj.readequationNotes}
                              </span>
                            )}
                          </td>

                          <td className="p-1 border border-slate-300 text-center text-[9.5px]">
                            {getKvBadge(proj.kvStatus)}
                          </td>

                          <td className="p-1 border border-slate-300 text-[9px] text-slate-600 leading-tight">
                            {isProac ? (
                              <div>
                                <div>Agenda Viva: <strong className={proj.agendaVivaRegistered ? "text-emerald-700" : "text-amber-700"}>{proj.agendaVivaRegistered ? "Cadastrado" : "Pendente"}</strong></div>
                                <div>Sis. PROAC: <strong className={proj.proacSystemRegistered ? "text-emerald-700" : "text-amber-700"}>{proj.proacSystemRegistered ? "Cadastrado" : "Pendente"}</strong></div>
                              </div>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
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

      <footer className="mt-4 pt-2 border-t border-slate-400 text-[9.5px] text-slate-500 flex justify-between items-center">
        <span>Quest Consult • Sistema Executivo de Gestão de Prazos • Documento Confidencial</span>
        <span>Impresso em Modo Paisagem • Destinatários: catelani, tk, lucas, bruno.britto @questconsult.com.br</span>
      </footer>
    </div>
  );
};
