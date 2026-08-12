import { useState, useEffect, useRef } from 'react';

export function useSSE(eventCode: string | null) {
  const [lastEvent, setLastEvent] = useState<{ type: string; data: any } | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!eventCode) return;

    let retryTimeout: NodeJS.Timeout;
    let retryCount = 0;
    const maxBackoff = 5000;

    const connect = () => {
      setConnectionStatus('connecting');
      const es = new EventSource(`/api/sse/${eventCode}`);
      eventSourceRef.current = es;

      es.onopen = () => {
        setConnectionStatus('connected');
        retryCount = 0;
      };

      es.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          setLastEvent({ type: parsed.type || 'message', data: parsed });
        } catch (e) {
          setLastEvent({ type: 'message', data: event.data });
        }
      };

      const eventTypes = [
        'lobby_update',
        'game_started',
        'game_state',
        'timer_tick',
        'leaderboard_update',
        'activity_feed',
        'game_ended',
        'participant_kicked'
      ];

      eventTypes.forEach(eventType => {
        es.addEventListener(eventType, (event) => {
          try {
            setLastEvent({ type: eventType, data: JSON.parse((event as MessageEvent).data) });
          } catch(e) {
            console.error('Failed parsing SSE data for event:', eventType);
          }
        });
      });

      es.onerror = () => {
        setConnectionStatus('disconnected');
        es.close();
        const backoff = Math.min(1000 * Math.pow(2, retryCount), maxBackoff);
        retryCount++;
        retryTimeout = setTimeout(connect, backoff);
      };
    };

    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      clearTimeout(retryTimeout);
      setConnectionStatus('disconnected');
    };
  }, [eventCode]);

  return { lastEvent, connectionStatus };
}
