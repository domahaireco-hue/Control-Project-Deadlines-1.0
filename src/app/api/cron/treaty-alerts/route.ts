import { NextRequest, NextResponse } from 'next/server';
import { AgentMailService } from '@/services/agentMailService';
import { ProjectService } from '@/services/projectService';
import { isSupabaseAdminConfigured } from '@/lib/supabaseAdmin';
import initialProjectsData from '@/data/initialProjects.json';
import { Project } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * Rotina Diária das 08:00 AM para Alertas Recorrentes de Tratativas (a cada 72 horas)
 * Destinatário: catelani@questconsult.com.br
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const force = searchParams.get('force') === 'true';

    let allProjects: Project[] = [];
    if (isSupabaseAdminConfigured) {
      allProjects = await ProjectService.serverFetchAllProjects();
    }
    if (allProjects.length === 0) {
      allProjects = initialProjectsData as Project[];
    }

    // Filtra projetos atualmente em tratativa
    const treatyProjects = allProjects.filter(
      (p) => p.isInTreaty || p.columnId === 'col_treaty'
    );

    if (treatyProjects.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhum projeto em tratativa no momento. Nenhum e-mail necessário.',
        treatyProjectsCount: 0,
      });
    }

    const now = new Date();
    const SEVENTY_TWO_HOURS_MS = 72 * 60 * 60 * 1000;

    // Verifica se já se passaram 72h desde o último envio para os projetos em tratativa
    const shouldSend = force || treatyProjects.some((p) => {
      if (!p.lastTreatyAlertAt) return true;
      const lastAlert = new Date(p.lastTreatyAlertAt);
      return now.getTime() - lastAlert.getTime() >= SEVENTY_TWO_HOURS_MS;
    });

    if (!shouldSend) {
      return NextResponse.json({
        success: true,
        message: 'Janela de 72 horas ainda não decorrida desde o último envio.',
        treatyProjectsCount: treatyProjects.length,
      });
    }

    // Dispara relatório consolidado das tratativas para catelani@questconsult.com.br via AgentMail
    const sendResult = await AgentMailService.sendTreatyRecurringDigest(treatyProjects);

    if (!sendResult.success) {
      return NextResponse.json(
        { error: 'Falha ao disparar e-mail via AgentMail', details: sendResult.error },
        { status: 500 }
      );
    }

    // Atualiza a data do último envio no Supabase
    if (isSupabaseAdminConfigured) {
      const updatedProjects = allProjects.map((p) => {
        if (p.isInTreaty || p.columnId === 'col_treaty') {
          return {
            ...p,
            lastTreatyAlertAt: now.toISOString(),
          };
        }
        return p;
      });
      await ProjectService.serverSaveProjectsBatch(updatedProjects);
    }

    return NextResponse.json({
      success: true,
      message: `Alerta de 72h enviado com sucesso via AgentMail para catelani@questconsult.com.br (${treatyProjects.length} projetos em tratativa).`,
      messageId: sendResult.messageId,
      treatyProjectsCount: treatyProjects.length,
      sentAt: now.toISOString(),
    });
  } catch (err: unknown) {
    console.error('[API /api/cron/treaty-alerts] Erro ao processar:', err);
    return NextResponse.json(
      { error: 'Falha interna ao executar rotina de tratativas.' },
      { status: 500 }
    );
  }
}

