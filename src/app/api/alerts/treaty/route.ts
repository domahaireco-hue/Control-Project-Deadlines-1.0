import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/serverAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { projectFromDb } from '@/services/projectService';
import { AgentMailService } from '@/services/agentMailService';

export const dynamic = 'force-dynamic';

/**
 * Alerta imediato de Tratativa (enviado pelo servidor).
 * O navegador só informa o id do projeto; os dados e a chave do AgentMail ficam no servidor.
 * POST { projectId }
 */
export async function POST(req: NextRequest) {
  const token = req.cookies.get('quest_session_token')?.value;
  const user = token ? verifySessionToken(token) : null;
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  let projectId = '';
  try {
    const body = await req.json();
    projectId = typeof body?.projectId === 'string' ? body.projectId : '';
  } catch {
    // corpo inválido
  }
  if (!projectId) {
    return NextResponse.json({ error: 'projectId é obrigatório' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Banco de dados não configurado' }, { status: 500 });
  }

  const { data, error } = await admin.from('projects').select('*').eq('id', projectId).maybeSingle();
  if (error || !data) {
    return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 });
  }

  const project = projectFromDb(data);
  if (!project.isInTreaty && project.columnId !== 'col_treaty') {
    return NextResponse.json({ success: true, skipped: 'Projeto não está em tratativa' });
  }

  const result = await AgentMailService.sendTreatyImmediateAlert(project, user.name);
  if (!result.success) {
    return NextResponse.json({ error: 'Falha ao enviar alerta', details: result.error }, { status: 502 });
  }
  return NextResponse.json({ success: true, messageId: result.messageId });
}
