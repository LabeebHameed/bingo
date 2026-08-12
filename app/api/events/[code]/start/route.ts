import { NextRequest, NextResponse } from 'next/server';
import { events, generateBingoCard, startTimer, broadcastToEvent, calculateLeaderboard } from '@/app/lib/store';

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

    const { operatorSecret, title, durationMinutes, playMode, gridConfig, questions } = await req.json();
    if (event.operatorSecret !== operatorSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (event.status !== 'lobby' && event.status !== 'paused') {
      return NextResponse.json({ error: 'Event cannot be started' }, { status: 400 });
    }

    // Apply any setup overrides sent by operator
    if (title) event.title = title;
    if (durationMinutes) event.durationMinutes = Number(durationMinutes);
    if (playMode) event.playMode = playMode;
    if (gridConfig?.squares) event.gridConfig = gridConfig;
    if (questions && Array.isArray(questions)) event.questions = questions;

    // Generate bingo cards for all participants if not already generated
    for (const p of event.participants.values()) {
      if (!event.bingoCards.has(p.id)) {
        const card = generateBingoCard(event, p.id);
        event.bingoCards.set(p.id, card);
      }
    }

    const previousStatus = event.status;
    event.status = 'active';
    if (!event.startTime || previousStatus === 'lobby') {
      event.startTime = Date.now();
      event.endTimestamp = Date.now() + event.durationMinutes * 60 * 1000;
    } else if (previousStatus === 'paused' && event.endTimestamp) {
      // Resume - no need to adjust timestamp in this simple version
    }

    calculateLeaderboard(event);
    startTimer(event);

    broadcastToEvent(code, 'game_started', {
      status: event.status,
      startTime: event.startTime,
      endTimestamp: event.endTimestamp,
      leaderboard: event.leaderboard
    });
    
    // Cards need to be pulled individually via reconnect or we could broadcast to all 
    // but the requirement is "Broadcasts game_started with each participant's card". 
    // SSE doesn't easily target a single client unless we check socket. 
    // The instructions say: "Broadcasts game_started with each participant's card."
    // As all clients get all SSE, they can filter their own card out.
    const allCards = Object.fromEntries(event.bingoCards);
    broadcastToEvent(code, 'cards_ready', { cards: allCards });

    return NextResponse.json({ success: true, status: event.status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
