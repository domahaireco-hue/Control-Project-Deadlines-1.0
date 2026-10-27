import * as XLSX from 'xlsx';
import { Project, KanbanColumnId, ImportResult, LawMechanism, KvStatus } from '@/types';

export const EMPTY_CELL_FALLBACK = "Sem informação Migrada";

const MONTHS_MAP: Record<string, string> = { 
  'jan': '01', 'fev': '02', 'mar': '03', 'abr': '04', 'mai': '05', 'jun': '06', 
  'jul': '07', 'ago': '08', 'set': '09', 'out': '10', 'nov': '11', 'dez': '12', 
  'janeiro': '01', 'fevereiro': '02', 'março': '03', 'marco': '03', 'abril': '04', 
  'maio': '05', 'junho': '06', 'julho': '07', 'agosto': '08', 'setembro': '09', 
  'outubro': '10', 'novembro': '11', 'dezembro': '12' 
};

/**
 * Normaliza strings para comparação (remove acentos, espaços extras e converte para minúsculo)
 */
export function normalizeString(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

/**
 * Extrai data no formato YYYY-MM-DD a partir de expressões em texto
 * Ex: "até o dia 15 de jan 2027", "para 16 de janeiro de 2027", "em 10 de maio de 2026"
 */
export function extractDateFromText(txt: string | null | undefined): string | null {
  if (!txt) return null;
  const m = txt.match(/(?:ate|até|para|em)\s+(?:o\s+dia\s+)?(\d{1,2})\s+de\s+([a-zA-Zç]+)\s+(?:de\s+)?(\d{4})/i);
  if (m) {
    const day = m[1].padStart(2, '0');
    const monthName = normalizeString(m[2]);
    const year = m[3];
    const month = MONTHS_MAP[monthName];
    if (month) return `${year}-${month}-${day}`;
  }
  return null;
}

/**
 * Trata valores vazios ou inválidos da planilha
 */
export function sanitizeCell(value: unknown): string {
  if (value === null || value === undefined) return EMPTY_CELL_FALLBACK;
  const str = String(value).trim();
  if (
    str === '' || 
    str === 'None' || 
    str === 'null' || 
    str === 'N/A' || 
    str === '#VALUE!' || 
    str === '#REF!' || 
    str === '#N/A'
  ) {
    return EMPTY_CELL_FALLBACK;
  }
  return str;
}

/**
 * Converte data de múltiplos formatos (Excel Serial, DD/MM/AAAA, ISO, YYYY-MM-DD)
 */
export function parseDate(value: unknown): { isoDate: string | null; formatted: string } {
  if (value === null || value === undefined) {
    return { isoDate: null, formatted: EMPTY_CELL_FALLBACK };
  }

  // Se já for número de série do Excel (ex: 45000, 46022, 46387)
  if (typeof value === 'number') {
    if (value <= 0 || value < 1000) {
      return { isoDate: null, formatted: EMPTY_CELL_FALLBACK };
    }
    const dateObj = new Date((value - 25569) * 86400 * 1000);
    if (!isNaN(dateObj.getTime())) {
      const iso = dateObj.toISOString().split('T')[0];
      return { isoDate: iso, formatted: formatDatePtBr(iso) };
    }
  }

  const str = String(value).trim();
  if (!str || str === 'None' || str === 'N/A' || str.startsWith('#') || str === '0') {
    return { isoDate: null, formatted: EMPTY_CELL_FALLBACK };
  }

  // Se for ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const iso = str.split(' ')[0];
    return { isoDate: iso, formatted: formatDatePtBr(iso) };
  }

  // Formato DD/MM/YYYY ou DD/MM/YY
  const brMatch = str.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
  if (brMatch) {
    const day = brMatch[1].padStart(2, '0');
    const month = brMatch[2].padStart(2, '0');
    let year = brMatch[3];
    if (year.length === 2) year = `20${year}`;
    const iso = `${year}-${month}-${day}`;
    return { isoDate: iso, formatted: `${day}/${month}/${year}` };
  }

  // Tentativa de extrair data de texto livre
  const textDate = extractDateFromText(str);
  if (textDate) {
    return { isoDate: textDate, formatted: formatDatePtBr(textDate) };
  }

  return { isoDate: null, formatted: str };
}

export function formatDatePtBr(isoDate: string | null): string {
  if (!isoDate || isoDate === EMPTY_CELL_FALLBACK) return EMPTY_CELL_FALLBACK;
  try {
    const parts = isoDate.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  } catch {
    // fallback
  }
  return isoDate;
}

/**
 * Calcula dias restantes até a data prevista
 */
export function calculateDaysRemaining(targetDateIso: string | null): number | null {
  if (!targetDateIso) return null;
  const target = new Date(targetDateIso + 'T00:00:00');
  if (isNaN(target.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (Math.abs(days) > 10000) return null;
  return days;
}

/**
 * Determina a coluna Kanban com base nas janelas solicitadas:
 * - <= 32 dias: Risco Crítico de Prorrogação (col_risk)
 * - 33 a 45 dias: Alerta de Prorrogação (col_45)
 * - 46 a 60 dias: Atenção Operacional (col_60)
 * - > 60 dias: Prazo Seguro (col_90)
 */
export function determineKanbanColumn(daysRemaining: number | null): KanbanColumnId {
  if (daysRemaining === null) return 'col_90';
  if (daysRemaining <= 32) return 'col_risk';
  if (daysRemaining <= 45) return 'col_45';
  if (daysRemaining <= 60) return 'col_60';
  return 'col_90';
}

/**
 * Detecta o tipo de mecanismo/lei a partir do nome da aba
 */
export function detectMechanismFromSheetName(sheetName: string): LawMechanism {
  const norm = normalizeString(sheetName);
  if (norm.includes('rouanet')) return 'Rouanet';
  if (norm.includes('promac')) return 'PROMAC';
  if (norm.includes('proac')) return 'PROAC';
  if (norm.includes('emenda 2026')) return 'Emenda 2026';
  if (norm.includes('emenda')) return 'Emenda 24-25';
  if (norm.includes('esporte')) return 'Esportes';
  if (norm.includes('icms')) return 'MG - ICMS';
  return sheetName.trim() || 'Geral';
}

/**
 * Helper para detectar status de KV / Arte Digital a partir de texto
 */
export function detectKvStatusFromText(text: string): { status: KvStatus; sent: boolean } {
  const norm = normalizeString(text);
  if (
    norm.includes('arte aprovada') || 
    norm.includes('arte deferida') || 
    norm.includes('arte eaprovada') ||
    norm.includes('aprovado') ||
    norm.includes('projeto finalizado')
  ) {
    return { status: 'aprovada', sent: true };
  }
  if (
    norm.includes('arte enviada') || 
    norm.includes('enviado arte') || 
    norm.includes('enviado kv') || 
    norm.includes('em aprovacao') ||
    norm.includes('enviada alteracao')
  ) {
    return { status: 'em_aprovacao', sent: true };
  }
  if (norm.includes('reprovad') || norm.includes('diligencia')) {
    return { status: 'reprovada', sent: true };
  }
  return { status: 'nao_enviado', sent: false };
}

/**
 * Recalcula o status e datas cruzando Coluna C, Data da Readequação e Observações
 */
export function evaluateProjectStatusAndDates({
  statusColC,
  readeqCellVal,
  targetDateRaw,
  startDateRaw,
  notesRaw,
  daysCellVal,
}: {
  statusColC: string;
  readeqCellVal: unknown;
  targetDateRaw: unknown;
  startDateRaw: unknown;
  notesRaw: string;
  daysCellVal: unknown;
}): {
  status: string;
  startDate: string | null;
  targetDate: string | null;
  readequationDate: string | null;
  readequationNotes: string;
  daysRemaining: number | null;
  isCompleted: boolean;
  isInTreaty: boolean;
  columnId: KanbanColumnId;
} {
  const startDateParsed = parseDate(startDateRaw);
  const targetDateParsed = parseDate(targetDateRaw);
  const readeqParsed = parseDate(readeqCellVal);
  const readeqText = readeqCellVal ? String(readeqCellVal).trim() : '';

  // Extrai data de readequação se houver
  const textDateInNotes = extractDateFromText(notesRaw) || extractDateFromText(readeqText);
  const readequationDate = readeqParsed.isoDate || textDateInNotes || null;

  // Se houver uma data de readequação mais recente que a data final, adota a readequação
  let finalTargetDate = targetDateParsed.isoDate;
  if (readequationDate) {
    if (!finalTargetDate || readequationDate > finalTargetDate) {
      finalTargetDate = readequationDate;
    }
  }

  const combinedAll = normalizeString(`${statusColC} ${readeqText} ${notesRaw}`);

  // 1. Caso: CONCLUÍDO (Prestação de Contas Apresentada / Aprovada / Não precisa prorrogar / Finalizado)
  const isCompleted = 
    combinedAll.includes('prestacao de contas apresentada') ||
    combinedAll.includes('prestacao de contas aprovada') ||
    combinedAll.includes('pc apresentada') ||
    combinedAll.includes('pc aprovada') ||
    combinedAll.includes('pc enviada') ||
    combinedAll.includes('vai fazer pc') ||
    combinedAll.includes('entrou em periodo de pc') ||
    combinedAll.includes('projeto finalizado') ||
    combinedAll.includes('nao precisa pedir prorrogacao') ||
    combinedAll.includes('nao precisa prorrogar') ||
    combinedAll.includes('naoi precisa prorrogar') ||
    combinedAll.includes('nao vamos prorrogar') ||
    combinedAll.includes('nao precisa fazer nada');

  let finalStatus = statusColC || 'Em Execução';
  let isInTreaty = false;
  let daysRemaining: number | null = null;

  if (isCompleted) {
    isInTreaty = true;
    if (combinedAll.includes('aprovada')) {
      finalStatus = 'Prestação de Contas Aprovada';
    } else if (combinedAll.includes('nao precisa')) {
      finalStatus = 'Não precisa pedir Prorrogação';
    } else if (combinedAll.includes('finalizado')) {
      finalStatus = 'Projeto Finalizado';
    } else {
      finalStatus = 'Prestação de Contas Apresentada';
    }
    // Projetos concluídos não geram alarme regressivo
    daysRemaining = null;
  } else {
    // 2. Caso: Prorrogação Solicitada / Em Tratativa
    if (
      combinedAll.includes('pedido de prorrogacao') ||
      combinedAll.includes('solicitado pedido de prorrogacao') ||
      combinedAll.includes('solicitada a prorrogacao') ||
      combinedAll.includes('enviado pedido de prorrogacao') ||
      combinedAll.includes('reenviado pedido de prorrogacao') ||
      combinedAll.includes('diligencia')
    ) {
      finalStatus = 'Prorrogação Solicitada';
      isInTreaty = true;
    } else if (
      combinedAll.includes('aprovado prorrogacao') ||
      combinedAll.includes('prorrogacao aprovada') ||
      combinedAll.includes('readequacao deferida') ||
      combinedAll.includes('prorrogado ate')
    ) {
      finalStatus = 'Prorrogação Aprovada';
      isInTreaty = false;
    } else if (combinedAll.includes('desbloqueado')) {
      finalStatus = 'Desbloqueado';
    } else if (combinedAll.includes('bloqueado')) {
      finalStatus = 'Bloqueado';
    } else {
      finalStatus = statusColC || 'Em Execução';
    }

    // Calcula dias restantes com base na data final (readequada ou original)
    daysRemaining = calculateDaysRemaining(finalTargetDate);
    if (daysRemaining === null && daysCellVal !== undefined && typeof daysCellVal === 'number') {
      const rawDays = Math.round(daysCellVal);
      if (Math.abs(rawDays) < 10000) {
        daysRemaining = rawDays;
      }
    }
  }

  const columnId: KanbanColumnId = isCompleted 
    ? 'col_completed' 
    : (isInTreaty ? 'col_treaty' : determineKanbanColumn(daysRemaining));

  return {
    status: finalStatus,
    startDate: startDateParsed.isoDate,
    targetDate: finalTargetDate,
    readequationDate,
    readequationNotes: readeqText,
    daysRemaining,
    isCompleted,
    isInTreaty,
    columnId,
  };
}

/**
 * Parser de Planilha (.xlsx ou .csv em ArrayBuffer ou Uint8Array)
 */
export function parseSpreadsheetBuffer(
  buffer: ArrayBuffer | Uint8Array,
  currentProjects: Project[] = []
): { projects: Project[]; result: ImportResult } {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  
  const updatedProjectsMap = new Map<string, Project>();
  currentProjects.forEach((p) => {
    updatedProjectsMap.set(p.id, { ...p });
    if (p.code && p.code !== EMPTY_CELL_FALLBACK) {
      updatedProjectsMap.set(`code:${p.code.toLowerCase()}`, { ...p });
    }
    updatedProjectsMap.set(`name:${normalizeString(p.name)}`, { ...p });
  });

  const result: ImportResult = {
    totalProcessed: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: [],
    sheets: workbook.SheetNames,
  };

  const finalProjectsList: Project[] = [...currentProjects];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet || !sheet['!ref']) continue;

    const range = XLSX.utils.decode_range(sheet['!ref']);
    const lawMechanism = detectMechanismFromSheetName(sheetName);
    const isProac = lawMechanism === 'PROAC' || normalizeString(sheetName).includes('proac') || lawMechanism === 'MG - ICMS';

    // 1. Procura a linha de cabeçalho
    let headerRowIndex = 1;
    for (let r = range.s.r; r <= Math.min(range.e.r, range.s.r + 5); r++) {
      for (let c = range.s.c; c <= range.e.c; c++) {
        const cell = sheet[XLSX.utils.encode_cell({ r, c })];
        if (cell && normalizeString(String(cell.v)).includes('projeto')) {
          headerRowIndex = r;
          break;
        }
      }
      if (headerRowIndex !== 1) break;
    }

    // Identifica índices de colunas
    let colProject = 1; // Padrão coluna B
    let colStatusC = 2; // Padrão coluna C
    let colCode = -1;
    let colProponent = -1;
    let colSponsor = -1;
    let colStartDate = -1;
    let colTargetDate = -1;
    let colReadequacao = -1;
    let colDays = -1;
    let colArt = -1;
    let colNotes = -1;

    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = sheet[XLSX.utils.encode_cell({ r: headerRowIndex, c })];
      if (!cell || cell.v === undefined) continue;
      const norm = normalizeString(String(cell.v));

      if (norm.includes('projeto') && colProject === -1) colProject = c;
      else if ((norm.includes('pronac') || norm.includes('promac') || norm.includes('numero da emenda') || norm.includes('codigo')) && colCode === -1) colCode = c;
      else if ((norm.includes('proponente') || norm.includes('cliente')) && colProponent === -1) colProponent = c;
      else if (norm.includes('patrocinador') && colSponsor === -1) colSponsor = c;
      else if (norm.includes('readequacao') && colReadequacao === -1) colReadequacao = c;
      else if (norm.includes('inicio') && colStartDate === -1) colStartDate = c;
      else if ((norm.includes('data fim da execucao') || norm.includes('fim da execucao') || norm.includes('data fim')) && colTargetDate === -1) colTargetDate = c;
      else if (norm.includes('dias para vencer') || norm.includes('dias')) colDays = c;
      else if (norm.includes('envio de artes') || norm.includes('artes')) colArt = c;
      else if (norm.includes('observacao') || norm.includes('obs')) colNotes = c;
    }

    // 2. Itera pelas linhas de dados
    for (let r = headerRowIndex + 1; r <= range.e.r; r++) {
      const bCell = sheet[XLSX.utils.encode_cell({ r, c: colProject })];
      const aCell = sheet[XLSX.utils.encode_cell({ r, c: 0 })];
      
      const projectNameRaw = bCell?.v || (colProject !== 0 ? aCell?.v : null);
      if (!projectNameRaw) continue;
      const projectName = sanitizeCell(projectNameRaw);
      if (projectName === EMPTY_CELL_FALLBACK || projectName.length < 2) continue;

      result.totalProcessed++;

      const cCell = sheet[XLSX.utils.encode_cell({ r, c: colStatusC })];
      const statusCRaw = cCell ? String(cCell.v).trim() : '';

      const codeCell = colCode !== -1 ? sheet[XLSX.utils.encode_cell({ r, c: colCode })] : null;
      const proponentCell = colProponent !== -1 ? sheet[XLSX.utils.encode_cell({ r, c: colProponent })] : null;
      const sponsorCell = colSponsor !== -1 ? sheet[XLSX.utils.encode_cell({ r, c: colSponsor })] : null;
      const startDateCell = colStartDate !== -1 ? sheet[XLSX.utils.encode_cell({ r, c: colStartDate })] : null;
      const targetDateCell = colTargetDate !== -1 ? sheet[XLSX.utils.encode_cell({ r, c: colTargetDate })] : null;
      const readeqCell = colReadequacao !== -1 ? sheet[XLSX.utils.encode_cell({ r, c: colReadequacao })] : null;
      const daysCell = colDays !== -1 ? sheet[XLSX.utils.encode_cell({ r, c: colDays })] : null;
      const artCell = colArt !== -1 ? sheet[XLSX.utils.encode_cell({ r, c: colArt })] : null;
      const notesCell = colNotes !== -1 ? sheet[XLSX.utils.encode_cell({ r, c: colNotes })] : null;

      const codeRaw = codeCell ? sanitizeCell(codeCell.v) : EMPTY_CELL_FALLBACK;
      const proponentRaw = proponentCell ? sanitizeCell(proponentCell.v) : EMPTY_CELL_FALLBACK;
      const sponsorRaw = sponsorCell ? sanitizeCell(sponsorCell.v) : EMPTY_CELL_FALLBACK;
      const notesRaw = notesCell ? sanitizeCell(notesCell.v) : '';
      const artRaw = artCell ? String(artCell.v).trim() : '';

      // Recalcula o status e datas considerando OBSERVAÇÃO e Data da Readequação
      const evalResult = evaluateProjectStatusAndDates({
        statusColC: statusCRaw,
        readeqCellVal: readeqCell?.v,
        targetDateRaw: targetDateCell?.v,
        startDateRaw: startDateCell?.v,
        notesRaw,
        daysCellVal: daysCell?.v,
      });

      // Detecção de KV / Arte Digital
      const kvDetection = detectKvStatusFromText(`${artRaw} ${statusCRaw} ${notesRaw} ${String(readeqCell?.v || '')}`);

      // PROAC ICMS detecção (Agenda Viva e Sistema PROAC)
      const combinedNotes = normalizeString(`${statusCRaw} ${artRaw} ${notesRaw} ${String(readeqCell?.v || '')}`);
      let agendaViva = false;
      let proacSystem = false;
      if (isProac) {
        if (combinedNotes.includes('agenda viva')) agendaViva = true;
        if (combinedNotes.includes('sistema proac') || combinedNotes.includes('no sistema')) proacSystem = true;
      }

      const tags: string[] = [lawMechanism];
      if (evalResult.isCompleted) {
        tags.push('Concluído');
      }
      if (evalResult.isInTreaty) {
        tags.push('Projetos em Tratativa');
      }
      if (statusCRaw && !tags.includes(statusCRaw)) {
        tags.push(statusCRaw);
      }

      // Upsert
      const normName = normalizeString(projectName);
      const existingKey = `name:${normName}`;
      const existing = updatedProjectsMap.get(existingKey) || 
        (codeRaw !== EMPTY_CELL_FALLBACK ? updatedProjectsMap.get(`code:${codeRaw.toLowerCase()}`) : undefined);

      if (existing) {
        existing.code = codeRaw !== EMPTY_CELL_FALLBACK ? codeRaw : existing.code;
        existing.name = projectName;
        existing.client = proponentRaw !== EMPTY_CELL_FALLBACK ? proponentRaw : existing.client;
        existing.sponsor = sponsorRaw !== EMPTY_CELL_FALLBACK ? sponsorRaw : existing.sponsor;
        existing.responsible = proponentRaw !== EMPTY_CELL_FALLBACK ? proponentRaw : existing.responsible;
        existing.startDate = evalResult.startDate || existing.startDate;
        existing.targetDate = evalResult.targetDate || existing.targetDate;
        existing.readequationDate = evalResult.readequationDate || existing.readequationDate;
        existing.readequationNotes = evalResult.readequationNotes || existing.readequationNotes;
        existing.daysRemaining = evalResult.daysRemaining !== null ? evalResult.daysRemaining : existing.daysRemaining;
        existing.status = evalResult.status;
        existing.originalStatusColC = statusCRaw;
        existing.isCompleted = evalResult.isCompleted;
        existing.isInTreaty = evalResult.isInTreaty;
        existing.lawMechanism = lawMechanism;
        if (!existing.isManualColumn) {
          existing.columnId = evalResult.columnId;
        }
        if (!existing.kvStatus || existing.kvStatus === 'nao_enviado') {
          existing.kvStatus = kvDetection.status;
          existing.kvSent = kvDetection.sent;
        }
        if (isProac) {
          if (existing.agendaVivaRegistered === undefined) existing.agendaVivaRegistered = agendaViva;
          if (existing.proacSystemRegistered === undefined) existing.proacSystemRegistered = proacSystem;
        }
        existing.notes = notesRaw || existing.notes;
        existing.tags = Array.from(new Set([...existing.tags, ...tags]));
        existing.updatedAt = new Date().toISOString();

        result.updated++;
      } else {
        const newId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const newProject: Project = {
          id: newId,
          code: codeRaw,
          name: projectName,
          client: proponentRaw,
          sponsor: sponsorRaw,
          responsible: proponentRaw !== EMPTY_CELL_FALLBACK ? proponentRaw : 'Quest Consult',
          startDate: evalResult.startDate,
          targetDate: evalResult.targetDate,
          readequationDate: evalResult.readequationDate,
          readequationNotes: evalResult.readequationNotes,
          daysRemaining: evalResult.daysRemaining,
          status: evalResult.status,
          originalStatusColC: statusCRaw,
          isCompleted: evalResult.isCompleted,
          isInTreaty: evalResult.isInTreaty,
          lawMechanism,
          columnId: evalResult.columnId,
          isManualColumn: false,
          notes: notesRaw || EMPTY_CELL_FALLBACK,
          tags,
          kvStatus: kvDetection.status,
          kvSent: kvDetection.sent,
          agendaVivaRegistered: isProac ? agendaViva : undefined,
          proacSystemRegistered: isProac ? proacSystem : undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        finalProjectsList.push(newProject);
        updatedProjectsMap.set(newId, newProject);
        updatedProjectsMap.set(existingKey, newProject);
        if (codeRaw !== EMPTY_CELL_FALLBACK) {
          updatedProjectsMap.set(`code:${codeRaw.toLowerCase()}`, newProject);
        }

        result.inserted++;
      }
    }
  }

  return { projects: finalProjectsList, result };
}
