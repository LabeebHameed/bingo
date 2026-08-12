import { NextRequest, NextResponse } from 'next/server';
import { events } from '@/app/lib/store';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const event = events.get(code);
    if (!event) return new NextResponse('Event not found', { status: 404 });

    const { searchParams } = new URL(req.url);
    const operatorSecret = searchParams.get('operatorSecret');

    if (event.operatorSecret !== operatorSecret) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    let csvContent = 'Rank,Name,Nickname,CompletedSquares,CompletedLines,LastCompletionTime\n';
    
    for (const entry of event.leaderboard) {
      csvContent += `${entry.rank},"${entry.name}","${entry.nickname}",${entry.completedSquares},${entry.completedLines},${entry.lastCompletionTime ? new Date(entry.lastCompletionTime).toISOString() : ''}\n`;
    }

    csvContent += '\nParticipantName,SquareId,TargetName,Answer,PhotoUrl,QuestionAsked,CompletedAt\n';

    for (const [pId, card] of event.bingoCards.entries()) {
      const p = event.participants.get(pId);
      if (!p) continue;

      for (const sq of card.squares) {
        if (sq.completed && !sq.isFree) {
          const target = sq.targetParticipantId ? event.participants.get(sq.targetParticipantId)?.nickname : '';
          const time = sq.completedAt ? new Date(sq.completedAt).toISOString() : '';
          csvContent += `"${p.nickname}",${sq.id},"${target || ''}","${sq.answer || ''}","${sq.photoUrl || ''}","${sq.questionAsked || ''}",${time}\n`;
        }
      }
    }

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="event-${event.code}-export.csv"`,
      }
    });
  } catch (error: any) {
    return new NextResponse(error.message, { status: 400 });
  }
}
