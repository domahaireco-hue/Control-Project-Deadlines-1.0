'use client';

import React, { useState } from 'react';
import { 
  X, 
  Layers, 
  Plus, 
  Trash2, 
  Lock, 
  CheckCircle2, 
  AlertCircle,
  Search,
  ArrowRight,
  FolderSync
} from 'lucide-react';
import { useProjects } from '@/context/ProjectContext';

interface TablesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TablesModal: React.FC<TablesModalProps> = ({ isOpen, onClose }) => {
  const { 
    availableMechanisms, 
    addTable, 
    deleteTable, 
    getProjectsCountByTable 
  } = useProjects();

  const [newTableInput, setNewTableInput] = useState('');
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);
  const [filterQuery, setFilterQuery] = useState('');
  
  // Estado para migração/transferência de projetos antes de excluir tabela com projetos
  const [movingTable, setMovingTable] = useState<string | null>(null);
  const [destinationTable, setDestinationTable] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  // Lista de tabelas válidas (excluindo 'Todos' e 'Todas')
  const tableList = availableMechanisms
    .filter((m) => m !== 'Todos' && m !== 'Todas')
    .sort((a, b) => a.localeCompare(b, 'pt-BR'));

  const handleAddTable = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackError(null);
    setFeedbackSuccess(null);

    const res = addTable(newTableInput);
    if (!res.success) {
      setFeedbackError(res.error || 'Erro ao cadastrar tabela.');
    } else {
      setFeedbackSuccess(`Tabela "${newTableInput.trim()}" cadastrada com sucesso!`);
      setNewTableInput('');
      setTimeout(() => setFeedbackSuccess(null), 3500);
    }
  };

  const handleDeleteDirect = async (tableName: string) => {
    setFeedbackError(null);
    setFeedbackSuccess(null);

    const count = getProjectsCountByTable(tableName);
    if (count > 0) {
      setFeedbackError(`Não é possível excluir a Tabela "${tableName}" pois ela contém ${count} projeto(s). Utilize a opção "Mover & Excluir" abaixo para transferir os projetos.`);
      return;
    }

    if (confirm(`Tem certeza de que deseja excluir a Tabela "${tableName}"?\n\nEla será removida das abas de filtro e das opções de cadastro.`)) {
      const res = await deleteTable(tableName);
      if (!res.success) {
        setFeedbackError(res.error || 'Erro ao excluir tabela.');
      } else {
        setFeedbackSuccess(`Tabela "${tableName}" excluída com sucesso!`);
        setTimeout(() => setFeedbackSuccess(null), 3000);
      }
    }
  };

  const handleConfirmMoveAndDelete = async (sourceTable: string) => {
    if (!destinationTable) {
      alert('Por favor, selecione a tabela de destino para onde os projetos serão movidos.');
      return;
    }

    const count = getProjectsCountByTable(sourceTable);
    if (!confirm(`Atenção: Você está prestes a transferir ${count} projeto(s) da tabela "${sourceTable}" para a tabela "${destinationTable}" e excluir permanentemente a tabela "${sourceTable}".\n\nDeseja prosseguir?`)) {
      return;
    }

    setIsProcessing(true);
    setFeedbackError(null);
    setFeedbackSuccess(null);

    try {
      const res = await deleteTable(sourceTable, destinationTable);
      if (!res.success) {
        setFeedbackError(res.error || 'Erro ao migrar projetos e excluir tabela.');
      } else {
        setFeedbackSuccess(`${count} projeto(s) transferidos para "${destinationTable}" e tabela "${sourceTable}" excluída com sucesso!`);
        setMovingTable(null);
        setDestinationTable('');
        setTimeout(() => setFeedbackSuccess(null), 4000);
      }
    } catch (err: any) {
      setFeedbackError('Erro inesperado durante a exclusão da tabela.');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredList = tableList.filter((t) => 
    t.toLowerCase().includes(filterQuery.trim().toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header Modal */}
        <div className="bg-quest-900 text-white px-6 py-4 flex items-center justify-between border-b border-quest-800 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-sky-950 border border-sky-800 text-sky-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Gestão de Tabelas (Abas de Origem)</h2>
              <p className="text-xs text-quest-400">
                Cadastre novas tabelas ou exclua tabelas existentes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-quest-400 hover:text-white hover:bg-quest-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          
          {/* Formulário: Adicionar Nova Tabela */}
          <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-3.5 space-y-2">
            <label className="block text-xs font-bold text-sky-950">
              Cadastrar Nova Tabela
            </label>
            <form onSubmit={handleAddTable} className="flex gap-2">
              <input
                type="text"
                value={newTableInput}
                onChange={(e) => setNewTableInput(e.target.value)}
                placeholder="Ex: Audiovisual, Cultura SP, Esportes 2026..."
                className="flex-1 px-3 py-2 text-xs border border-sky-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white font-medium"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shrink-0 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar</span>
              </button>
            </form>

            {feedbackError && (
              <p className="text-xs text-rose-700 font-semibold flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{feedbackError}</span>
              </p>
            )}
            {feedbackSuccess && (
              <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{feedbackSuccess}</span>
              </p>
            )}
          </div>

          {/* Campo de Busca Rápida na Lista */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Pesquisar tabela por nome..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none bg-slate-50"
            />
          </div>

          {/* Lista de Tabelas com Contagem de Projetos e Ações */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase px-1">
              <span>Nome da Tabela</span>
              <span>Projetos / Ações</span>
            </div>

            {filteredList.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                Nenhuma tabela encontrada.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
                {filteredList.map((tableName) => {
                  const count = getProjectsCountByTable(tableName);
                  const canDeleteDirectly = count === 0;
                  const isMovingThisTable = movingTable === tableName;

                  return (
                    <div
                      key={tableName}
                      className="border border-slate-200 rounded-xl overflow-hidden bg-white hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center justify-between p-2.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-semibold text-xs text-slate-800 truncate" title={tableName}>
                            {tableName}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                              count > 0
                                ? 'bg-sky-100 text-sky-800 border border-sky-200'
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}
                          >
                            {count} {count === 1 ? 'projeto' : 'projetos'}
                          </span>
                        </div>

                        {/* Botões de Ação */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {canDeleteDirectly ? (
                            <button
                              type="button"
                              onClick={() => handleDeleteDirect(tableName)}
                              title="Excluir tabela vazia"
                              className="p-1.5 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all flex items-center gap-1 text-[11px] font-bold"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Excluir</span>
                            </button>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              {/* Botão de Ajuda: Mover projetos para outra tabela e excluir */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (isMovingThisTable) {
                                    setMovingTable(null);
                                    setDestinationTable('');
                                  } else {
                                    setMovingTable(tableName);
                                    // Seleciona a primeira tabela diferente como default
                                    const other = tableList.find((t) => t !== tableName) || '';
                                    setDestinationTable(other);
                                  }
                                }}
                                title="Transferir os projetos vinculados para outra tabela e excluir esta"
                                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 border ${
                                  isMovingThisTable
                                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                                    : 'bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-sky-700 border-slate-200'
                                }`}
                              >
                                <FolderSync className="w-3.5 h-3.5" />
                                <span>{isMovingThisTable ? 'Cancelar' : 'Mover & Excluir'}</span>
                              </button>

                              {/* Indicador de Bloqueio com Tooltip */}
                              <div
                                className="p-1.5 rounded-lg text-slate-400 bg-slate-50 cursor-not-allowed border border-slate-200 flex items-center"
                                title={`Não é possível excluir diretamente pois existem ${count} projeto(s) nesta tabela. Use 'Mover & Excluir' acima ou transfira os projetos manualmente.`}
                              >
                                <Lock className="w-3.5 h-3.5" />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Painel Expansível de Transferência de Projetos */}
                      {isMovingThisTable && (
                        <div className="bg-amber-50/70 border-t border-amber-200 p-3 space-y-2 animate-in fade-in duration-150">
                          <p className="text-[11px] font-bold text-amber-950 flex items-center gap-1">
                            <ArrowRight className="w-3.5 h-3.5 text-amber-700" />
                            <span>Mover {count} projeto(s) da tabela "{tableName}" para:</span>
                          </p>
                          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                            <select
                              value={destinationTable}
                              onChange={(e) => setDestinationTable(e.target.value)}
                              className="flex-1 px-2.5 py-1.5 text-xs border border-amber-300 rounded-lg bg-white font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                            >
                              <option value="">Selecione a tabela de destino...</option>
                              {tableList
                                .filter((t) => t !== tableName)
                                .map((dest) => (
                                  <option key={dest} value={dest}>
                                    {dest}
                                  </option>
                                ))}
                            </select>

                            <button
                              type="button"
                              disabled={isProcessing || !destinationTable}
                              onClick={() => handleConfirmMoveAndDelete(tableName)}
                              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-lg transition-colors shadow-2xs whitespace-nowrap"
                            >
                              {isProcessing ? 'Transferindo...' : 'Transferir e Excluir'}
                            </button>
                          </div>
                          <p className="text-[10px] text-amber-800">
                            Todos os projetos serão atualizados no Kanban e no banco com a nova tabela, e a tabela "{tableName}" será excluída.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Dica Informativa no Rodapé */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-800">Dica de Gestão</p>
              <p>
                Tabelas vazias (com 0 projetos) podem ser excluídas com 1 clique. Para tabelas que possuem projetos, você pode transferir os projetos automaticamente para outra tabela e excluí-la de forma 100% segura.
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};

