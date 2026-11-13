import { NextRequest, NextResponse } from 'next/server';
import { notificationService, DEFAULT_RECIPIENTS } from '@/services/notificationService';
import { ProjectService } from '@/services/projectService';
import { isSupabaseAdminConfigured } from '@/lib/supabaseAdmin';
import initialProjectsData from '@/data/initialProjects.json';
import { Project } from '@/types';
import { AgentMailService } from '@/services/agentMailService';
import { PdfReportService } from '@/services/pdfReportService';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    let projects: Project[] = [];
    let pdfBase64: string | undefined;
    let filename: string | undefined;
    let recipients: string[] | undefined;

    try {
      const body = await request.json();
      if (Array.isArray(body?.projects) && body.projects.length > 0) {
        projects = body.projects;
      }
      if (typeof body?.pdfBase64 === 'string' && body.pdfBase64.length > 0) {
        pdfBase64 = body.pdfBase64;
      }
      if (typeof body?.filename === 'string') {
        filename = body.filename;
      }
      if (Array.isArray(body?.recipients) && body.recipients.length > 0) {
        recipients = body.recipients;
      }
    } catch {
      // Sem body JSON (ex: GET / Cron)
    }

    if (projects.length === 0 && isSupabaseAdminConfigured) {
      projects = await ProjectService.serverFetchAllProjects();
    }

    if (projects.length === 0) {
      projects = initialProjectsData as Project[];
    }

    // Se o base64 do PDF não foi fornecido (ex: chamada automática de cron na Vercel),
    // o relatório em PDF formato paisagem é gerado automaticamente no backend.
    if (!pdfBase64) {
      const generated = PdfReportService.generateLandscapeReport(projects);
      pdfBase64 = generated.base64;
      filename = filename || generated.filename;
    }

    // Dispara via AgentMail com o anexo PDF em modo paisagem
    const mailResult = await AgentMailService.sendReportWithPdfAttachment({
      pdfBase64,
      filename,
      recipients,
    });

    const { log, summary } = await notificationService.sendDailySummaryReport(projects);

    return NextResponse.json({
      success: true,
      emailSent: mailResult.success,
      messageId: mailResult.messageId,
      mailError: mailResult.error,
      message: mailResult.success
        ? 'Relatório com PDF anexo enviado com sucesso para os 4 destinatários via AgentMail.'
        : `Relatório registrado localmente, mas houve falha no envio do e-mail: ${mailResult.error || 'Erro desconhecido'}`,
      recipients: recipients || DEFAULT_RECIPIENTS.map((r) => r.email),
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
