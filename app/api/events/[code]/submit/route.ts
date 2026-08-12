import { NextRequest, NextResponse } from 'next/server';
import { events, checkBingoLines, calculateLeaderboard, broadcastToEvent, ActivityItem } from '@/app/lib/store';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const event = events.get(code);
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

    if (event.status !== 'active') {
      return NextResponse.json({ error: 'Event is not active' }, { status: 400 });
    }

    const { participantId, sessionToken, squareId, photoUrl, answer } = await req.json();

    const participant = event.participants.get(participantId);
    if (!participant || participant.sessionToken !== sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bingoCard = event.bingoCards.get(participantId);
    if (!bingoCard) return NextResponse.json({ error: 'Card not found' }, { status: 404 });

    const square = bingoCard.squares.find(s => s.id === squareId);
    if (!square) return NextResponse.json({ error: 'Square not found' }, { status: 404 });

    if (square.completed) {
      return NextResponse.json({ error: 'Square already completed' }, { status: 400 });
    }

    if (event.selfieRequired && !photoUrl) {
      return NextResponse.json({ error: 'Selfie is required' }, { status: 400 });
    }

    square.completed = true;
    square.photoUrl = photoUrl || null;
    square.answer = answer || null;
    square.completedAt = Date.now();
    
    // Assign random question from bank
    const randomQuestion = event.questions[Math.floor(Math.random() * event.questions.length)];
    square.questionAsked = randomQuestion;

    const previousLines = bingoCard.completedLines;
    bingoCard.completedSquares = bingoCard.squares.filter(s => s.completed).length;
    bingoCard.completedLines = checkBingoLines(bingoCard.squares);

    calculateLeaderboard(event);

    const targetName = square.targetParticipantId ? event.participants.get(square.targetParticipantId)?.nickname || 'someone' : '';
    
    let activityType: ActivityItem['type'] = 'square_complete';
    let message = `${participant.nickname} completed a square!`;

    if (bingoCard.completedLines > previousLines) {
      activityType = bingoCard.completedLines >= 12 ? 'full_bingo' : 'bingo_line';
      message = bingoCard.completedLines >= 12 ? `${participant.nickname} got a FULL BINGO!` : `${participant.nickname} completed a BINGO line!`;
    } else {
      if (targetName) {
        message = `${participant.nickname} connected with ${targetName}!`;
      }
    }

    const activity: ActivityItem = {
      id: randomUUID(),
      participantName: participant.nickname,
      targetName,
      timestamp: Date.now(),
      type: activityType,
      message
    };
    
    event.activityFeed.push(activity);

    broadcastToEvent(code, 'leaderboard_update', { leaderboard: event.leaderboard });
    broadcastToEvent(code, 'activity_feed', { activity });

    return NextResponse.json({ bingoCard });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
