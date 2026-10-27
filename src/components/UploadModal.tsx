'use client';

import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  Info,
  Loader2,
  Trash2 
} from 'lucide-react';
import { useProjects } from '@/context/ProjectContext';
import { ImportResult } from '@/types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose }) => {
  const { importSpreadsheet, clearAllProjects, projects } = useProjects();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cleanBeforeImport, setCleanBeforeImport] = useState(true);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const processFile = async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      alert('Por favor, selecione um arquivo válido de planilha (.xlsx ou .csv).');
      return;
    }

    setFileName(file.name);
    setLoading(true);
    setResult(null);

    try {
      const buffer = await file.arrayBuffer();
      // Executa o parser do spreadsheetService passando flag de substituição
      const importStats = importSpreadsheet(buffer, cleanBeforeImport);
      setResult(importStats);
    } catch (err: unknown) {
      console.error('Erro ao importar planilha:', err);
      alert('Falha ao processar o arquivo. Verifique se o formato está corrompido.');
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleResetAndClose = () => {
    setResult(null);
    setFileName(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in duration-200">
        
        {/* Header Modal */}
        <div className="bg-quest-900 text-white px-6 py-4 flex items-center justify-between border-b border-quest-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-sky-950 border border-sky-800 text-sky-400">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Importar Planilha de Projetos</h2>
              <p className="text-xs text-quest-400">Suporte a arquivos .xlsx (múltiplas abas) e .csv</p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-1 rounded-lg text-quest-400 hover:text-white hover:bg-quest-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          
          {/* Instruções de Importação */}
          <div className="bg-sky-50 border border-sky-200 rounded-xl p-3.5 text-xs text-sky-900 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-sky-950">
              <Info className="w-4 h-4 text-sky-600 shrink-0" />
              <span>Regras de Processamento & Upsert:</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-sky-800 text-[11px] pl-1">
              <li>Lê todas as abas (ex: <strong>Rouanet, PROAC, PROMAC, Emendas</strong>).</li>
              <li>Células vazias são preenchidas com: <em>&quot;Sem informação Migrada&quot;</em>.</li>
              <li>Projetos existentes são atualizados automaticamente por Nome ou Código (Upsert).</li>
              <li>A coluna Kanban é calculada com base na data de vencimento restante.</li>
            </ul>
          </div>

          {/* Opção para Limpar / Substituir Base */}
          {!result && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 text-xs">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={cleanBeforeImport}
                  onChange={(e) => setCleanBeforeImport(e.target.checked)}
                  className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500 shrink-0"
                />
                <div>
                  <span className="font-bold text-slate-800">Substituir base existente por completo</span>
                  <p className="text-[11px] text-slate-500">
                    Limpa os {projects.length} projetos atuais e carrega exclusivamente os dados da nova planilha.
                  </p>
                </div>
              </label>

              {projects.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (clearAllProjects()) {
                      alert('Base de projetos limpa com sucesso! Agora você pode importar sua nova planilha.');
                    }
                  }}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>Limpar Base Agora ({projects.length})</span>
                </button>
              )}
            </div>
          )}

          {/* Área de Drag & Drop */}
          {!result && (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-sky-500 bg-sky-50/70 scale-[1.01]'
                  : 'border-slate-300 hover:border-sky-400 bg-slate-50/50 hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleChange}
                className="hidden"
              />

              {loading ? (
                <div className="flex flex-col items-center py-4">
                  <Loader2 className="w-10 h-10 text-sky-600 animate-spin mb-2" />
                  <p className="text-sm font-semibold text-slate-700">Lendo abas e processando linhas...</p>
                  <p className="text-xs text-slate-400 mt-1">Isso pode levar alguns segundos.</p>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 mb-3 shadow-xs">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-slate-800">
                    Arraste o arquivo .xlsx ou .csv aqui
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    ou clique para procurar no seu computador
                  </p>
                  <span className="mt-3 inline-block px-2.5 py-1 text-[10px] font-semibold bg-white border border-slate-200 text-slate-600 rounded-md">
                    Exemplo: &quot;Projetos em execução - PROMAC, PROAC e ROUANET.xlsx&quot;
                  </span>
                </>
              )}
            </div>
          )}

          {/* Relatório de Importação Concluída */}
          {result && (
            <div className="border border-emerald-200 bg-emerald-50/70 rounded-xl p-4 space-y-3">
              <div className="flex items-center space-x-2 text-emerald-900 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Planilha processada com sucesso!</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-emerald-200">
                  <p className="text-[10px] text-slate-500 uppercase">Processados</p>
                  <p className="text-lg font-bold text-slate-800">{result.totalProcessed}</p>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-emerald-200">
                  <p className="text-[10px] text-emerald-600 uppercase">Novos</p>
                  <p className="text-lg font-bold text-emerald-700">+{result.inserted}</p>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-emerald-200">
                  <p className="text-[10px] text-sky-600 uppercase">Atualizados</p>
                  <p className="text-lg font-bold text-sky-700">{result.updated}</p>
                </div>
              </div>

              <div className="text-[11px] text-slate-600">
                <p><strong>Arquivo:</strong> {fileName}</p>
                <p><strong>Abas Identificadas:</strong> {result.sheets.join(', ')}</p>
              </div>

              <button
                onClick={handleResetAndClose}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors shadow"
              >
                Concluir e Visualizar no Kanban
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
