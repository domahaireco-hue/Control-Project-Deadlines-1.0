/**
 * PDF Snapshot & Layout Capture Service
 * Desenvolvido para Quest Consult
 * 
 * Prepara a geração de snapshots dos 4 Kanbans para relatórios e anexos de e-mail
 */

import { Project, KanbanColumnId } from '@/types';

export interface SnapshotMetadata {
  company: string;
  systemName: string;
  generatedAt: string;
  totalProjects: number;
  criticalCount: number;
  filteredMechanism?: string;
}

export class PdfSnapshotService {
  /**
   * Dispara a impressão/exportação para PDF padrão executivo do navegador
   */
  public static printKanbanSnapshot(metadata: SnapshotMetadata) {
    if (typeof window === 'undefined') return;

    // Adiciona classe de estilo para impressão antes de invocar print
    document.body.classList.add('printing-kanban');
    
    // Configura o título do documento para o nome do arquivo gerado
    const originalTitle = document.title;
    const dateStr = new Date().toISOString().split('T')[0];
    document.title = `Quest_Consult_Relatorio_Prazos_${dateStr}`;

    window.print();

    // Restaura título e classe após o diálogo de impressão
    setTimeout(() => {
      document.title = originalTitle;
      document.body.classList.remove('printing-kanban');
    }, 500);
  }

  /**
   * Stub desacoplado preparado para renderização backend via Headless Browser (Puppeteer/Playwright)
   * ou biblioteca client-side (html2canvas + jsPDF) para anexar diretamente aos e-mails
   */
  public static async generatePdfBufferStub(
    _projects: Project[],
    metadata: SnapshotMetadata
  ): Promise<{ filename: string; contentType: string; simulatedSizeKb: number }> {
    console.log(`[PdfSnapshotService] Gerando snapshot para ${metadata.company}...`);
    
    // Simulação de processamento de layout
    await new Promise((res) => setTimeout(res, 400));

    const dateStr = new Date().toISOString().split('T')[0];
    return {
      filename: `Relatorio_Prazos_QuestConsult_${dateStr}.pdf`,
      contentType: 'application/pdf',
      simulatedSizeKb: 245,
    };
  }
}
