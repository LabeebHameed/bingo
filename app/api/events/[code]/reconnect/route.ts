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

    const body = await req.json();
    const { participantId, sessionToken, operatorSecret } = body;

    // Operator reconnection check
    if (operatorSecret && event.operatorSecret === operatorSecret) {
      let remainingSeconds = 0;
      if (event.status === 'active' && event.endTimestamp) {
        remainingSeconds = Math.max(0, Math.floor((event.endTimestamp - Date.now()) / 1000));
      }
      return NextResponse.json({
        event: {
          title: event.title,
          status: event.status,
          playMode: event.playMode,
          durationMinutes: event.durationMinutes,
        },
        participants: Array.from(event.participants.values()),
        leaderboard: event.leaderboard,
        activityFeed: event.activityFeed,
        rewardTiers: event.rewardTiers,
        endTimestamp: event.endTimestamp,
        timer: {
          remainingSeconds,
          status: event.status,
          endTimestamp: event.endTimestamp
        }
      });
    }

    // Participant reconnection check
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
      rewardTiers: event.rewardTiers,
      timer: {
        remainingSeconds,
        status: event.status,
        endTimestamp: event.endTimestamp
      },
      event: {
        title: event.title,
        status: event.status,
        playMode: event.playMode,
        durationMinutes: event.durationMinutes,
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
