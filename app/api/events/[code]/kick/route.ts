import { NextRequest, NextResponse } from 'next/server';
import { events, broadcastToEvent, calculateLeaderboard } from '@/app/lib/store';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const event = events.get(code);
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

    const { operatorSecret, participantId } = await req.json();
    if (event.operatorSecret !== operatorSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (event.participants.has(participantId)) {
      event.participants.delete(participantId);
      event.bingoCards.delete(participantId);
      calculateLeaderboard(event);

      if (event.status === 'lobby') {
        broadcastToEvent(code, 'lobby_update', {
          participants: Array.from(event.participants.values()).map(p => ({
            id: p.id,
            name: p.name,
            nickname: p.nickname,
            badge: p.badge
          })),
          participantCount: event.participants.size
        });
      } else {
        broadcastToEvent(code, 'participant_kicked', { participantId });
        broadcastToEvent(code, 'leaderboard_update', { leaderboard: event.leaderboard });
      }
      
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
