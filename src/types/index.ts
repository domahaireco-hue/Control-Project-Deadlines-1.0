/**
 * Quest Deadline Control - TypeScript Domain Definitions
 * Desenvolvido para Quest Consult
 */

export type KanbanColumnId = 'col_90' | 'col_60' | 'col_30' | 'col_risk';

export type LawMechanism = 
  | 'Rouanet' 
  | 'PROAC' 
  | 'PROMAC' 
  | 'Emenda 2026' 
  | 'Emenda 24-25' 
  | 'Esportes' 
  | 'MG - ICMS' 
  | 'Geral' 
  | string;

export interface Project {
  id: string;
  code: string;                      // PRONAC / PROMAC / Emenda / Código
  name: string;                      // Nome do Projeto
  client: string;                    // Proponente / Cliente
  sponsor: string;                   // Patrocinador / Parceiro
  responsible: string;               // Responsável / Líder do Projeto
  startDate: string | null;          // Data de Início ou Data da Readequação (YYYY-MM-DD)
  targetDate: string | null;         // Data de Entrega Prevista / Data Fim da Execução (YYYY-MM-DD)
  daysRemaining: number | null;      // Dias restantes calculados dinamicamente
  status: string;                    // "Em Execução", "No prazo", "Atrasado", "Desbloqueado", etc.
  lawMechanism: LawMechanism;        // Lei de Incentivo / Aba de Origem
  columnId: KanbanColumnId;          // Coluna atual no Kanban
  isManualColumn: boolean;           // True se movido manualmente pelo usuário (trava auto-avanço)
  notes: string;                     // Observações adicionais
  tags: string[];                    // Marcadores e etiquetas
  createdAt: string;
  updatedAt: string;
}

export interface KanbanColumnConfig {
  id: KanbanColumnId;
  title: string;
  subtitle: string;
  badgeLabel: string;
  minDays?: number;
  maxDays?: number;
  accentColor: string;
  lightBg: string;
  borderClass: string;
  badgeClass: string;
  headerBg: string;
}

export interface SpreadsheetRow {
  [key: string]: string | number | null | undefined;
}

export interface ImportResult {
  totalProcessed: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: string[];
  sheets: string[];
}

export interface CardMoveEvent {
  cardId: string;
  projectName: string;
  fromColumn: KanbanColumnId;
  toColumn: KanbanColumnId;
  timestamp: string;
  movedBy: string;
  reason?: string;
  autoAdvancement?: boolean;
}

export interface NotificationRecipient {
  name: string;
  email: string;
  role: string;
}

export interface NotificationPayload {
  to: NotificationRecipient[];
  subject: string;
  body: string;
  htmlContent: string;
  attachmentPdf?: boolean;
  event: CardMoveEvent;
}

export interface NotificationLog {
  id: string;
  timestamp: string;
  recipients: string[];
  subject: string;
  preview: string;
  status: 'SENT_MOCK' | 'FAILED' | 'QUEUED';
  eventData?: CardMoveEvent;
}
