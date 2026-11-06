'use client';

import React, { useState } from 'react';
import { 
  X, 
  Scale, 
  Plus, 
  Trash2, 
  Lock, 
  CheckCircle2, 
  AlertCircle,
  Search
} from 'lucide-react';
import { useProjects } from '@/context/ProjectContext';

interface IncentiveLawsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IncentiveLawsModal: React.FC<IncentiveLawsModalProps> = ({ isOpen, onClose }) => {
  const { 
    incentiveLaws, 
    addIncentiveLaw, 
    deleteIncentiveLaw, 
    getProjectsCountByLaw 
  } = useProjects();

  const [newLawInput, setNewLawInput] = useState('');
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);
  const [filterQuery, setFilterQuery] = useState('');

  if (!isOpen) return null;

  const handleAddLaw = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackError(null);
    setFeedbackSuccess(null);

    const res = addIncentiveLaw(newLawInput);
    if (!res.success) {
      setFeedbackError(res.error || 'Erro ao cadastrar lei.');
    } else {
      setFeedbackSuccess(`Lei "${newLawInput.trim()}" cadastrada com sucesso!`);
      setNewLawInput('');
      setTimeout(() => setFeedbackSuccess(null), 3500);
    }
  };

  const handleDeleteLaw = (law: string) => {
    setFeedbackError(null);
    setFeedbackSuccess(null);

    const count = getProjectsCountByLaw(law);
    if (count > 0) {
      alert(`Não é possível excluir a Lei de Incentivo "${law}" pois existem ${count} projeto(s) vinculados a ela.\n\nPara excluir esta lei, você deve primeiro alterar ou remover os projetos vinculados.`);
      return;
    }

    if (confirm(`Tem certeza de que deseja excluir a Lei de Incentivo "${law}"?\n\nEsta ação removerá a lei da lista de opções do sistema.`)) {
      const res = deleteIncentiveLaw(law);
      if (!res.success) {
        setFeedbackError(res.error || 'Erro ao excluir lei.');
      } else {
        setFeedbackSuccess(`Lei "${law}" excluída com sucesso!`);
        setTimeout(() => setFeedbackSuccess(null), 3000);
      }
    }
  };

  const filteredList = incentiveLaws.filter((l) => 
    l.toLowerCase().includes(filterQuery.trim().toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header Modal */}
        <div className="bg-quest-900 text-white px-6 py-4 flex items-center justify-between border-b border-quest-800 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-indigo-950 border border-indigo-800 text-indigo-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Gestão de Leis de Incentivo</h2>
              <p className="text-xs text-quest-400">
                Cadastre novas leis ou exclua leis existentes sem projetos vinculados
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
          
          {/* Formulário: Adicionar Nova Lei */}
          <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3.5 space-y-2">
            <label className="block text-xs font-bold text-indigo-950">
              Cadastrar Nova Lei de Incentivo
            </label>
            <form onSubmit={handleAddLaw} className="flex gap-2">
              <input
                type="text"
                value={newLawInput}
                onChange={(e) => setNewLawInput(e.target.value)}
                placeholder="Ex: Lei Paulo Gustavo, PROAC Editais, Fundo do Idoso..."
                className="flex-1 px-3 py-2 text-xs border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shrink-0 shadow-xs"
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
              placeholder="Pesquisar entre as leis cadastradas..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none bg-slate-50"
            />
          </div>

          {/* Lista de Leis Cadastradas com Contagem de Projetos */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase px-1">
              <span>Lei de Incentivo</span>
              <span>Projetos Vinculados / Ação</span>
            </div>

            {filteredList.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                Nenhuma lei encontrada com o termo pesquisado.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                {filteredList.map((law) => {
                  const projectCount = getProjectsCountByLaw(law);
                  const canDelete = projectCount === 0;

                  return (
                    <div
                      key={law}
                      className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate" title={law}>
                          {law}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {canDelete ? (
                            <span className="text-emerald-600 font-semibold">
                              Nenhum projeto vinculado (livre para exclusão)
                            </span>
                          ) : (
                            <span className="text-indigo-600 font-semibold">
                              {projectCount} {projectCount === 1 ? 'projeto vinculado' : 'projetos vinculados'}
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            projectCount > 0
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {projectCount} {projectCount === 1 ? 'projeto' : 'projetos'}
                        </span>

                        {canDelete ? (
                          <button
                            type="button"
                            onClick={() => handleDeleteLaw(law)}
                            title={`Excluir "${law}" (sem projetos vinculados)`}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 hover:border-rose-300 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <div 
                            title={`Não é possível excluir: existem ${projectCount} projeto(s) vinculados a esta lei.`}
                            className="p-1.5 text-slate-300 cursor-not-allowed"
                          >
                            <Lock className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-900 flex items-start gap-2">
            <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              <strong>Regra de Integridade:</strong> Apenas Leis de Incentivo com <strong>0 projetos vinculados</strong> podem ser excluídas. Caso uma lei possua projetos, altere os projetos para outra lei antes de excluí-la.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};

