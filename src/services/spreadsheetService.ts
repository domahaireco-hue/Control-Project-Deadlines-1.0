import * as XLSX from 'xlsx';
import { Project, KanbanColumnId, ImportResult, LawMechanism } from '@/types';

export const EMPTY_CELL_FALLBACK = "Sem informação Migrada";

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
 * Trata valores vazios ou inválidos da planilha
 */
export function sanitizeCell(value: unknown): string {
  if (value === null || value === undefined) return EMPTY_CELL_FALLBACK;
  const str = String(value).trim();
  if (str === '' || str === 'None' || str === 'null' || str === 'N/A' || str === '#VALUE!' || str === '#REF!') {
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

  // Se já for número de série do Excel (ex: 45000)
  if (typeof value === 'number') {
    // 25569 é o offset de dias entre 1900-01-01 e 1970-01-01
    const dateObj = new Date((value - 25569) * 86400 * 1000);
    if (!isNaN(dateObj.getTime())) {
      const iso = dateObj.toISOString().split('T')[0];
      return { isoDate: iso, formatted: formatDatePtBr(iso) };
    }
  }

  const str = String(value).trim();
  if (!str || str === 'None' || str === 'N/A' || str.startsWith('#')) {
    return { isoDate: null, formatted: EMPTY_CELL_FALLBACK };
  }

  // Verifica se é no formato ISO YYYY-MM-DD ou Date
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const iso = str.split(' ')[0];
    return { isoDate: iso, formatted: formatDatePtBr(iso) };
  }

  // Verifica formato DD/MM/YYYY ou DD/MM/YY
  const brMatch = str.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
  if (brMatch) {
    const day = brMatch[1].padStart(2, '0');
    const month = brMatch[2].padStart(2, '0');
    let year = brMatch[3];
    if (year.length === 2) {
      year = `20${year}`;
    }
    const iso = `${year}-${month}-${day}`;
    return { isoDate: iso, formatted: `${day}/${month}/${year}` };
  }

  // Retorna texto sanitizado se for texto como "abril de 2028"
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
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Determina a coluna Kanban com base nos dias restantes:
 * - <= 15 dias: Risco (15 Dias)
 * - 16 a 30 dias: 30 Dias
 * - 31 a 60 dias: 60 Dias
 * - > 60 dias: 90 Dias
 */
export function determineKanbanColumn(daysRemaining: number | null): KanbanColumnId {
  if (daysRemaining === null) return 'col_90';
  if (daysRemaining <= 15) return 'col_risk';
  if (daysRemaining <= 30) return 'col_30';
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
 * Parser de Planilha (.xlsx ou .csv em ArrayBuffer ou Uint8Array)
 */
export function parseSpreadsheetBuffer(
  buffer: ArrayBuffer | Uint8Array,
  currentProjects: Project[] = []
): { projects: Project[]; result: ImportResult } {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  
  const updatedProjectsMap = new Map<string, Project>();
  // Indexa projetos atuais por ID e por Nome normalizado para Upsert
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
    if (!sheet) continue;

    // Converte a aba para matriz de células
    const rawData = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null });
    if (!rawData || rawData.length === 0) continue;

    // 1. Procura a linha de cabeçalho
    let headerRowIndex = -1;
    for (let r = 0; r < Math.min(rawData.length, 10); r++) {
      const row = rawData[r] as unknown[];
      if (!row) continue;
      const rowStr = row.map((cell) => normalizeString(String(cell || ''))).join(' ');
      if (rowStr.includes('projeto') || rowStr.includes('nome')) {
        headerRowIndex = r;
        break;
      }
    }

    if (headerRowIndex === -1) {
      continue; // Não é uma aba de projetos padrão
    }

    const headerRow = (rawData[headerRowIndex] as unknown[]).map((c) => String(c || '').trim());
    
    // Mapeamento de índices de colunas
    let colProject = -1;
    let colCode = -1;
    let colProponent = -1;
    let colSponsor = -1;
    let colStartDate = -1;
    let colTargetDate = -1;
    let colStatus = -1;
    let colDays = -1;
    let colNotes = -1;

    headerRow.forEach((colName, idx) => {
      const norm = normalizeString(colName);
      if (norm.includes('projeto') && colProject === -1) colProject = idx;
      else if ((norm.includes('pronac') || norm.includes('promac') || norm.includes('codigo') || norm.includes('emenda')) && colCode === -1) colCode = idx;
      else if ((norm.includes('proponente') || norm.includes('cliente') || norm.includes('responsavel')) && colProponent === -1) colProponent = idx;
      else if (norm.includes('patrocinador') && colSponsor === -1) colSponsor = idx;
      else if ((norm.includes('readequacao') || norm.includes('inicio') || norm.includes('data_inicio')) && colStartDate === -1) colStartDate = idx;
      else if ((norm.includes('fim') || norm.includes('previsao') || norm.includes('vencimento')) && colTargetDate === -1) colTargetDate = idx;
      else if (norm.includes('status') || norm.includes('situacao')) colStatus = idx;
      else if (norm.includes('dias para vencer') || norm.includes('dias')) colDays = idx;
      else if (norm.includes('observacao') || norm.includes('obs')) colNotes = idx;
    });

    if (colProject === -1) continue;

    const lawMechanism = detectMechanismFromSheetName(sheetName);

    // 2. Itera pelas linhas de dados
    for (let r = headerRowIndex + 1; r < rawData.length; r++) {
      const row = rawData[r] as unknown[];
      if (!row) continue;

      const projectNameRaw = row[colProject];
      if (!projectNameRaw) continue;
      const projectName = sanitizeCell(projectNameRaw);
      if (projectName === EMPTY_CELL_FALLBACK || projectName.length < 2) continue;

      result.totalProcessed++;

      // Extrai campos
      const codeRaw = colCode !== -1 ? sanitizeCell(row[colCode]) : EMPTY_CELL_FALLBACK;
      const proponentRaw = colProponent !== -1 ? sanitizeCell(row[colProponent]) : EMPTY_CELL_FALLBACK;
      const sponsorRaw = colSponsor !== -1 ? sanitizeCell(row[colSponsor]) : EMPTY_CELL_FALLBACK;
      const statusRaw = colStatus !== -1 ? sanitizeCell(row[colStatus]) : 'Em Execução';
      const notesRaw = colNotes !== -1 ? sanitizeCell(row[colNotes]) : EMPTY_CELL_FALLBACK;

      // Tratamento de Datas
      const startDateParsed = colStartDate !== -1 ? parseDate(row[colStartDate]) : { isoDate: null, formatted: EMPTY_CELL_FALLBACK };
      const targetDateParsed = colTargetDate !== -1 ? parseDate(row[colTargetDate]) : { isoDate: null, formatted: EMPTY_CELL_FALLBACK };

      // Dias restantes (calcula do targetDate ou lê da coluna se número)
      let daysRemaining = calculateDaysRemaining(targetDateParsed.isoDate);
      if (daysRemaining === null && colDays !== -1) {
        const rawDays = row[colDays];
        if (typeof rawDays === 'number' && !isNaN(rawDays)) {
          daysRemaining = Math.round(rawDays);
        }
      }

      const columnId = determineKanbanColumn(daysRemaining);

      // Upsert: verifica se já existe
      const normName = normalizeString(projectName);
      const existingKey = `name:${normName}`;
      const existing = updatedProjectsMap.get(existingKey) || 
        (codeRaw !== EMPTY_CELL_FALLBACK ? updatedProjectsMap.get(`code:${codeRaw.toLowerCase()}`) : undefined);

      if (existing) {
        // Atualiza campos
        existing.code = codeRaw !== EMPTY_CELL_FALLBACK ? codeRaw : existing.code;
        existing.name = projectName;
        existing.client = proponentRaw !== EMPTY_CELL_FALLBACK ? proponentRaw : existing.client;
        existing.sponsor = sponsorRaw !== EMPTY_CELL_FALLBACK ? sponsorRaw : existing.sponsor;
        existing.responsible = proponentRaw !== EMPTY_CELL_FALLBACK ? proponentRaw : existing.responsible;
        existing.startDate = startDateParsed.isoDate || existing.startDate;
        existing.targetDate = targetDateParsed.isoDate || existing.targetDate;
        existing.daysRemaining = daysRemaining !== null ? daysRemaining : existing.daysRemaining;
        existing.status = statusRaw !== EMPTY_CELL_FALLBACK ? statusRaw : existing.status;
        existing.lawMechanism = lawMechanism;
        // Se usuário não moveu manualmente, atualiza coluna
        if (!existing.isManualColumn) {
          existing.columnId = columnId;
        }
        existing.notes = notesRaw !== EMPTY_CELL_FALLBACK ? notesRaw : existing.notes;
        existing.updatedAt = new Date().toISOString();

        result.updated++;
      } else {
        // Insere novo
        const newId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const newProject: Project = {
          id: newId,
          code: codeRaw,
          name: projectName,
          client: proponentRaw,
          sponsor: sponsorRaw,
          responsible: proponentRaw !== EMPTY_CELL_FALLBACK ? proponentRaw : 'Quest Consult',
          startDate: startDateParsed.isoDate,
          targetDate: targetDateParsed.isoDate,
          daysRemaining: daysRemaining,
          status: statusRaw !== EMPTY_CELL_FALLBACK ? statusRaw : 'Em Execução',
          lawMechanism: lawMechanism,
          columnId: columnId,
          isManualColumn: false,
          notes: notesRaw,
          tags: [lawMechanism],
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
