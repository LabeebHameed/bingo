import { NextRequest, NextResponse } from 'next/server';
import { events, broadcastToEvent, startTimer } from '@/app/lib/store';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const event = events.get(code);
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

    const { operatorSecret, action } = await req.json();
    if (event.operatorSecret !== operatorSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (action === 'pause') {
      if (event.status === 'active') {
        event.status = 'paused';
        if (event.timerInterval) {
          clearInterval(event.timerInterval);
          event.timerInterval = null;
        }
        broadcastToEvent(code, 'game_state', { status: 'paused' });
      }
    } else if (action === 'resume') {
      if (event.status === 'paused') {
        event.status = 'active';
        startTimer(event);
        broadcastToEvent(code, 'game_state', { status: 'active' });
      }
    } else if (action === 'end') {
      event.status = 'ended';
      event.endTimestamp = Date.now();
      if (event.timerInterval) {
        clearInterval(event.timerInterval);
        event.timerInterval = null;
      }
      broadcastToEvent(code, 'timer_tick', { remainingSeconds: 0, endTimestamp: event.endTimestamp, status: 'ended' });
      broadcastToEvent(code, 'game_ended', { leaderboard: event.leaderboard, status: 'ended' });
      broadcastToEvent(code, 'game_state', { status: 'ended' });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true, status: event.status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
