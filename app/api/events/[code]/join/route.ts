import { NextRequest, NextResponse } from 'next/server';
import { events, generateId, generateSessionToken, Participant, broadcastToEvent, ActivityItem, generateBingoCard, calculateLeaderboard } from '@/app/lib/store';
import { randomUUID as uuid } from 'crypto';

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

    if (event.status === 'ended') {
      return NextResponse.json({ error: 'Rally event has ended. No new participants can join.' }, { status: 400 });
    }

    const { name, nickname, badge } = await req.json();

    if (!name || !nickname) {
      return NextResponse.json({ error: 'Name and nickname are required' }, { status: 400 });
    }

    const participantId = generateId();
    const sessionToken = generateSessionToken();

    const participant: Participant = {
      id: participantId,
      name,
      nickname,
      badge: badge || 'fire',
      sessionToken,
      joinedAt: Date.now()
    };

    event.participants.set(participantId, participant);

    // If joining while game is already active or paused, generate their Bingo card immediately
    if (event.status === 'active' || event.status === 'paused') {
      generateBingoCard(event, participantId);
      calculateLeaderboard(event);
      broadcastToEvent(code, 'leaderboard_update', { leaderboard: event.leaderboard });
    }

    const activity: ActivityItem = {
      id: uuid(),
      participantName: nickname,
      targetName: '',
      timestamp: Date.now(),
      type: 'join',
      message: `${nickname} joined the rally!`
    };
    event.activityFeed.push(activity);

    broadcastToEvent(code, 'lobby_update', {
      participants: Array.from(event.participants.values()).map(p => ({
        id: p.id,
        name: p.name,
        nickname: p.nickname,
        badge: p.badge
      })),
      participantCount: event.participants.size,
      activity
    });
    broadcastToEvent(code, 'activity_feed', { activity });

    return NextResponse.json({ participantId, sessionToken, eventCode: code, eventStatus: event.status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
