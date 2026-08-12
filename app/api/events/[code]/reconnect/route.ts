import { NextRequest, NextResponse } from 'next/server';
import { events, calculateLeaderboard } from '@/app/lib/store';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const event = events.get(code);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const { participantId, sessionToken } = await req.json();

    const participant = event.participants.get(participantId);
    if (!participant || participant.sessionToken !== sessionToken) {
      return NextResponse.json({ error: 'Unauthorized or not found' }, { status: 401 });
    }

    const bingoCard = event.bingoCards.get(participantId) || null;
    let remainingSeconds = 0;
    if (event.status === 'active' && event.endTimestamp) {
      remainingSeconds = Math.max(0, Math.floor((event.endTimestamp - Date.now()) / 1000));
    }

    return NextResponse.json({
      participant,
      bingoCard,
      leaderboard: event.leaderboard,
      timer: {
        remainingSeconds,
        status: event.status
      },
      event: {
        title: event.title,
        status: event.status,
        playMode: event.playMode
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
