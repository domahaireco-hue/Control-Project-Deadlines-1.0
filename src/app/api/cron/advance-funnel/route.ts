import { NextRequest, NextResponse } from 'next/server';
import { FunnelService } from '@/services/funnelService';
import initialProjectsData from '@/data/initialProjects.json';
import { Project } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * Endpoint de Cron Job / Rotina Diária de Prazos
 * Pode ser chamado por um agendador externo (Vercel Cron, GitHub Actions ou agendador local)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const force = searchParams.get('force') === 'true';

    const currentList = initialProjectsData as Project[];
    const { updatedProjects, result } = await FunnelService.checkAndAdvanceFunnel(currentList, force);

    return NextResponse.json({
      success: true,
      message: 'Rotina diária de avanço de funil executada com sucesso.',
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
