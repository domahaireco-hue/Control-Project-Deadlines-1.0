/**
 * Quest Deadline Control - TypeScript Domain Definitions
 * Desenvolvido para Quest Consult
 */

export type KanbanColumnId = 'col_90' | 'col_60' | 'col_45' | 'col_32' | 'col_30' | 'col_risk' | 'col_completed';

export type KvStatus = 'nao_enviado' | 'em_aprovacao' | 'aprovada' | 'reprovada';

export interface ProjectHistoryEntry {
  id: string;
  timestamp: string;
  user?: string;
  action: string;
  details?: string;
  changes?: { field: string; from: any; to: any }[];
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarInitials: string;
}

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
  // Novos campos solicitados:
  kvStatus?: KvStatus;               // Controle se KV/Arte Digital foi enviada, aprovada, em aprovação ou reprovada
  kvSent?: boolean;                  // Se KV/Arte já foi enviada para aprovação
  agendaVivaRegistered?: boolean;    // PROAC ICMS: 1) Se já foi cadastrado no Agenda Viva
  proacSystemRegistered?: boolean;   // PROAC ICMS: 2) Se já foi cadastrado no sistema do PROAC
  isInTreaty?: boolean;              // Projetos em tratativa (prorrogação solicitada, diligência, etc.)
  isCompleted?: boolean;             // Projetos Concluídos (prestação de contas apresentada, não precisa pedir prorrogação, etc.)
  readequationDate?: string | null;  // Data extraída da coluna Data da Readequação
  readequationNotes?: string;        // Anotações da coluna Data da Readequação
  originalStatusColC?: string;       // Status original extraído da Coluna C da planilha
  history?: ProjectHistoryEntry[];   // Histórico de alterações e auditoria de ajustes
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
