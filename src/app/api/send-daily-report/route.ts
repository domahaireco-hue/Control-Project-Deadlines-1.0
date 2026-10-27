import { NextRequest, NextResponse } from 'next/server';
import { notificationService, DEFAULT_RECIPIENTS } from '@/services/notificationService';
import initialProjectsData from '@/data/initialProjects.json';
import { Project } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    let projects: Project[] = [];
    try {
      const body = await request.json();
      if (Array.isArray(body?.projects) && body.projects.length > 0) {
        projects = body.projects;
      }
    } catch {
      // Sem body JSON
    }

    if (projects.length === 0) {
      projects = initialProjectsData as Project[];
    }

    const { log, summary } = await notificationService.sendDailySummaryReport(projects);

    return NextResponse.json({
      success: true,
      message: 'Relatório diário enviado com sucesso para os 4 destinatários cadastrados.',
      recipients: DEFAULT_RECIPIENTS.map((r) => r.email),
      log,
      summary,
    });
  } catch (err: unknown) {
    console.error('[API /api/send-daily-report] Erro ao enviar relatório diário:', err);
    return NextResponse.json(
      { error: 'Falha ao processar envio do relatório diário.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Validação opcional de segurança recomendada pela Vercel Cron
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  // Para agendadores externos tipo cron
  return POST(request);
}
