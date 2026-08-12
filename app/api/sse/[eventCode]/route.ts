import { NextRequest } from 'next/server';
import { events, sseClients } from '@/app/lib/store';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventCode: string }> }
) {
  const { eventCode } = await params;

  if (!events.has(eventCode)) {
    return new Response('Event not found', { status: 404 });
  }

  let controllerRef: ReadableStreamDefaultController | null = null;

  const stream = new ReadableStream({
    start(controller) {
      controllerRef = controller;
      let clients = sseClients.get(eventCode);
      if (!clients) {
        clients = new Set();
        sseClients.set(eventCode, clients);
      }
      clients.add(controller);

      const event = events.get(eventCode)!;

      // Send initial state
      const initialPayload = JSON.stringify({
        type: 'connected',
        payload: {
          title: event.title,
          status: event.status,
          participantCount: event.participants.size
        }
      });
      controller.enqueue(new TextEncoder().encode(`data: ${initialPayload}\n\n`));
    },
    cancel() {
      if (controllerRef) {
        const clients = sseClients.get(eventCode);
        if (clients) {
          clients.delete(controllerRef);
          if (clients.size === 0) {
            sseClients.delete(eventCode);
          }
        }
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
