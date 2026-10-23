import { NextRequest, NextResponse } from 'next/server';
import { notificationService } from '@/services/notificationService';
import { CardMoveEvent } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CardMoveEvent;

    if (!body.cardId || !body.toColumn || !body.fromColumn) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos. Necessário cardId, fromColumn e toColumn.' },
        { status: 400 }
      );
    }

    const log = await notificationService.onCardMove(body);

    return NextResponse.json({
      success: true,
      log,
      recipients: notificationService.getRecipients(),
    });
  } catch (err: unknown) {
    console.error('[API /api/notify] Erro ao disparar notificação:', err);
    return NextResponse.json(
      { error: 'Falha ao processar disparo de notificação.' },
      { status: 500 }
    );
  }
}
