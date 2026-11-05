import { NextRequest, NextResponse } from 'next/server';
import { FunnelService } from '@/services/funnelService';
import { ProjectService } from '@/services/projectService';
import { isSupabaseAdminConfigured } from '@/lib/supabaseAdmin';
import initialProjectsData from '@/data/initialProjects.json';
import { Project } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * Endpoint de Cron Job / Rotina Diária de Prazos
 * Pode ser chamado por um agendador externo (Vercel Cron, GitHub Actions ou agendador local)
 */
export async function GET(request: NextRequest) {
  try {
    // Validação opcional de segurança recomendada pela Vercel Cron
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const force = searchParams.get('force') === 'true';

    let currentList: Project[] = [];
    let source = 'local_json';

    // Se o Supabase estiver configurado, busca projetos reais da nuvem
    if (isSupabaseAdminConfigured) {
      const dbProjects = await ProjectService.serverFetchAllProjects();
      if (dbProjects.length > 0) {
        currentList = dbProjects;
        source = 'supabase';
      }
    }

    // Fallback caso o banco ainda não tenha dados ou não esteja configurado
    if (currentList.length === 0) {
      currentList = initialProjectsData as Project[];
    }

    const { updatedProjects, result } = await FunnelService.checkAndAdvanceFunnel(currentList, force);

    // Se a fonte for o Supabase e houve avanço, persiste de volta no banco
    if (source === 'supabase' && result.movedCount > 0) {
      await ProjectService.serverSaveProjectsBatch(updatedProjects);
    }

    return NextResponse.json({
      success: true,
      message: 'Rotina diária de avanço de funil executada com sucesso.',
      dataSource: source,
      stats: result,
      totalProjectsInDatabase: updatedProjects.length,
    });
  } catch (err: unknown) {
    console.error('[API /api/cron/advance-funnel] Erro ao executar rotina:', err);
    return NextResponse.json(
      { error: 'Falha ao executar rotina diária de avanço de funil.' },
      { status: 500 }
    );
  }
}
