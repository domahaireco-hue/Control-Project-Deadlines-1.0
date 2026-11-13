/**
 * PDF Report Generator (Landscape / Executivo)
 * Desenvolvido para Quest Consult
 * 
 * Gera o documento PDF em formato paisagem com a lista executiva
 * de prazos vencidos e vincendos para download direto e anexo em e-mails.
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Project, KanbanColumnId } from '@/types';
import { isProjectCompleted, formatDatePtBr, EMPTY_CELL_FALLBACK } from './spreadsheetService';

export interface GeneratedPdfReport {
  doc: jsPDF;
  filename: string;
  base64: string;
  download: () => void;
}

export class PdfReportService {
  /**
   * Gera o PDF paisagem executivo consolidado com as faixas de prazos
   */
  public static generateLandscapeReport(
    projects: Project[],
    selectedMechanism: string = 'Todos'
  ): GeneratedPdfReport {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const dateStr = new Date().toISOString().split('T')[0];
    const currentDate = new Date().toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const filename = `Quest_Consult_Relatorio_Prazos_${dateStr}.pdf`;

    // Filtra projetos ativos (exclui concluídos)
    const activeProjects = projects.filter((p) => !isProjectCompleted(p));

    const countRisk = activeProjects.filter((p) => (p.columnId === 'col_risk' || p.columnId === 'col_32') && !p.isInTreaty).length;
    const count45 = activeProjects.filter((p) => (p.columnId === 'col_45' || p.columnId === 'col_30') && !p.isInTreaty).length;
    const count60 = activeProjects.filter((p) => p.columnId === 'col_60' && !p.isInTreaty).length;
    const count90 = activeProjects.filter((p) => p.columnId === 'col_90' && !p.isInTreaty).length;
    const countTreaty = activeProjects.filter((p) => p.isInTreaty || p.columnId === 'col_treaty').length;

    // Cabeçalho Corporativo
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(10, 8, 277, 18, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('QUEST CONSULT • CONTROLE DE PRAZOS EXECUTIVO', 14, 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Emissão: ${currentDate} (Relatório Semanal de Segunda-feira) | Filtro: ${selectedMechanism}`, 14, 21);

    doc.setFont('helvetica', 'bold');
    doc.text(`Projetos em Acompanhamento: ${activeProjects.length}`, 220, 15);
    doc.setFont('helvetica', 'normal');
    doc.text(`32d: ${countRisk} | 45d: ${count45} | 60d: ${count60} | 90d: ${count90} | Tratativa: ${countTreaty}`, 200, 21);

    const sections: {
      id: KanbanColumnId;
      matchIds: string[];
      title: string;
      color: [number, number, number];
    }[] = [
      {
        id: 'col_risk',
        matchIds: ['col_risk', 'col_32'],
        title: '1. LIMITE LEGAL DE PRORROGAÇÃO - 32 DIAS / RISCO CRÍTICO (Ação Imediata (<= 32 dias ou Vencidos))',
        color: [185, 28, 28], // red-700
      },
      {
        id: 'col_45',
        matchIds: ['col_45', 'col_30'],
        title: '2. ALERTA DE PREPARAÇÃO DE PRORROGAÇÃO (33 a 45 dias) (Preparar documentação técnica)',
        color: [180, 83, 9], // amber-700
      },
      {
        id: 'col_60',
        matchIds: ['col_60'],
        title: '3. ATENÇÃO OPERACIONAL (46 a 60 dias) (Acompanhamento Regular)',
        color: [3, 105, 161], // sky-700
      },
      {
        id: 'col_90',
        matchIds: ['col_90'],
        title: '4. PRAZO SEGURO (Acima de 60 dias) (Planejamento e Execução)',
        color: [4, 120, 87], // emerald-700
      },
      {
        id: 'col_treaty',
        matchIds: ['col_treaty'],
        title: '5. EM TRATATIVA (Prorrogação Solicitada / Em Análise no Órgão)',
        color: [126, 34, 206], // purple-700
      },
    ];

    let currentY = 30;

    sections.forEach((sec) => {
      const groupProjects = activeProjects
        .filter((p) => {
          if (sec.id === 'col_treaty') {
            return p.isInTreaty || p.columnId === 'col_treaty';
          }
          if (p.isInTreaty || p.columnId === 'col_treaty') {
            return false;
          }
          return sec.matchIds.includes(p.columnId);
        })
        .sort((a, b) => (a.daysRemaining ?? 999999) - (b.daysRemaining ?? 999999));

      // Se passou muito do final da página, adiciona nova página
      if (currentY > 175) {
        doc.addPage('a4', 'landscape');
        currentY = 15;
      }

      // Faixa de título da seção
      doc.setFillColor(sec.color[0], sec.color[1], sec.color[2]);
      doc.rect(10, currentY, 277, 6, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(`${sec.title} — [ ${groupProjects.length} ${groupProjects.length === 1 ? 'projeto' : 'projetos'} ]`, 13, currentY + 4.2);

      currentY += 7;

      if (groupProjects.length === 0) {
        doc.setTextColor(100, 116, 139);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7.5);
        doc.text('Nenhum projeto registrado nesta faixa de prazo.', 14, currentY + 3);
        currentY += 7;
      } else {
        const rows = groupProjects.map((proj, idx) => {
          const days = proj.daysRemaining;
          let daysLabel = 'Sem Prazo';
          if (proj.isInTreaty) {
            daysLabel = 'Em Tratativa';
          } else if (days !== null && days !== undefined) {
            if (days <= 0) {
              daysLabel = `VENCIDO (${Math.abs(days)}d)`;
            } else if (days <= 32) {
              daysLabel = `${days}d (Limite 32d)`;
            } else if (days <= 45) {
              daysLabel = `${days}d (Alerta 45d)`;
            } else {
              daysLabel = `${days} dias`;
            }
          }

          const targetDateText = formatDatePtBr(proj.targetDate);

          const mechCode = [
            proj.lawMechanism || 'Geral',
            proj.amendmentType ? `(${proj.amendmentType})` : null,
            proj.code && proj.code !== EMPTY_CELL_FALLBACK ? `#${proj.code.split('\n')[0]}` : null,
          ].filter(Boolean).join(' ');

          const statusNotes = [
            proj.status || 'Em Execução',
            proj.notes && proj.notes !== EMPTY_CELL_FALLBACK ? `Obs: ${proj.notes}` : null,
            proj.readequationNotes ? `Readeq: ${proj.readequationNotes}` : null,
          ].filter(Boolean).join('\n');

          const kvLabel = proj.kvStatus === 'aprovada' 
            ? 'Aprovada' 
            : proj.kvStatus === 'em_aprovacao' 
            ? 'Em Aprovação' 
            : proj.kvStatus === 'reprovada' 
            ? 'Reprovada' 
            : 'Pendente';

          const isProac = proj.lawMechanism === 'PROAC' || (proj.lawMechanism && proj.lawMechanism.toUpperCase().includes('PROAC'));
          const signals = isProac
            ? `Agenda Viva: ${proj.agendaVivaRegistered ? 'Sim' : 'Pendente'}\nSis. PROAC: ${proj.proacSystemRegistered ? 'Sim' : 'Pendente'}`
            : '—';

          const projName = [
            proj.name,
            proj.client && proj.client !== EMPTY_CELL_FALLBACK ? `Proponente: ${proj.client}` : null,
          ].filter(Boolean).join('\n');

          return [
            String(idx + 1),
            projName,
            daysLabel,
            targetDateText,
            mechCode,
            statusNotes,
            kvLabel,
            signals,
          ];
        });

        autoTable(doc, {
          startY: currentY,
          head: [
            ['#', 'Nome do Projeto', 'Dias Restantes', 'Data Entrega', 'Mecanismo / Código', 'Status (Col C)', 'KV / Arte Digital', 'Sinalizações']
          ],
          body: rows,
          styles: {
            fontSize: 7,
            cellPadding: 1.5,
            overflow: 'linebreak',
            lineColor: [203, 213, 225],
            lineWidth: 0.2,
          },
          headStyles: {
            fillColor: [241, 245, 249],
            textColor: [15, 23, 42],
            fontStyle: 'bold',
            fontSize: 7.5,
          },
          alternateRowStyles: {
            fillColor: [250, 250, 250],
          },
          columnStyles: {
            0: { cellWidth: 8, halign: 'center' },
            1: { cellWidth: 70 },
            2: { cellWidth: 26, halign: 'center', fontStyle: 'bold' },
            3: { cellWidth: 22, halign: 'center' },
            4: { cellWidth: 40 },
            5: { cellWidth: 50 },
            6: { cellWidth: 26, halign: 'center' },
            7: { cellWidth: 35 },
          },
          margin: { left: 10, right: 10 },
        });

        // Atualiza a coordenada Y após a tabela
        currentY = (doc as any).lastAutoTable.finalY + 6;
      }
    });

    // Rodapé em todas as páginas
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Quest Consult • Sistema de Gestão de Prazos • Página ${i} de ${totalPages} • Destinatários: catelani, tk, lucas, bruno.britto @questconsult.com.br`,
        14,
        202
      );
    }

    // Gera o Base64 limpo (compatível com navegador e Node.js)
    let base64 = '';
    try {
      const dataUri = doc.output('datauristring');
      base64 = dataUri.includes(',') ? dataUri.split(',')[1] : dataUri;
    } catch {
      const arrayBuffer = doc.output('arraybuffer');
      if (typeof Buffer !== 'undefined') {
        base64 = Buffer.from(arrayBuffer).toString('base64');
      }
    }

    return {
      doc,
      filename,
      base64,
      download: () => {
        doc.save(filename);
      },
    };
  }
}
