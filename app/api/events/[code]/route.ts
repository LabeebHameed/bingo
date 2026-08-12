import { NextRequest, NextResponse } from 'next/server';
import { events } from '@/app/lib/store';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const event = events.get(code);
  
  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  return NextResponse.json({
    code: event.code,
    title: event.title,
    status: event.status,
    participantCount: event.participants.size,
    durationMinutes: event.durationMinutes
  });
}
