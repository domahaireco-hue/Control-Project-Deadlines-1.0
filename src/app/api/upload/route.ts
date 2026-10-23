import { NextRequest, NextResponse } from 'next/server';
import { parseSpreadsheetBuffer } from '@/services/spreadsheetService';
import initialProjectsData from '@/data/initialProjects.json';
import { Project } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado. Forneça um arquivo .xlsx ou .csv válido.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    // Usa a base de dados padrão como referência para upsert
    const currentList = initialProjectsData as Project[];
    const { projects, result } = parseSpreadsheetBuffer(arrayBuffer, currentList);

    return NextResponse.json({
      success: true,
      result,
      totalProjectsCount: projects.length,
      message: `Planilha processada com sucesso: ${result.inserted} inseridos, ${result.updated} atualizados.`,
    });
  } catch (err: unknown) {
    console.error('[API /api/upload] Erro no processamento:', err);
    return NextResponse.json(
      { error: 'Falha interna ao processar a planilha.' },
      { status: 500 }
    );
  }
}
