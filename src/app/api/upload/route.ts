import { NextRequest, NextResponse } from 'next/server';
import { parseSpreadsheetBuffer } from '@/services/spreadsheetService';
import { ProjectService } from '@/services/projectService';
import { isSupabaseAdminConfigured } from '@/lib/supabaseAdmin';
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

    let currentList: Project[] = [];
    if (isSupabaseAdminConfigured) {
      currentList = await ProjectService.serverFetchAllProjects();
    }
    if (currentList.length === 0) {
      currentList = initialProjectsData as Project[];
    }

    const { projects, result } = parseSpreadsheetBuffer(arrayBuffer, currentList);

    // Se o Supabase estiver ativo no servidor, persiste as alterações na nuvem
    if (isSupabaseAdminConfigured) {
      await ProjectService.serverSaveProjectsBatch(projects);
    }

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
