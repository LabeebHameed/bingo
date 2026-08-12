"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { BingoSession, loadSession, saveSession, clearSession } from "../lib/client-store";
import { useSSE } from "../hooks/useSSE";

export interface LeaderboardEntry {
  participantId: string;
  name: string;
  nickname: string;
  badge: string;
  completedLines: number;
  completedSquares: number;
  lastCompletionTime: number | null;
  rank: number;
}

export interface BingoSquare {
  id: number;
  label: string;
  task: string;
  completed: boolean;
  photoUrl: string | null;
  isFree: boolean;
  answer: string | null;
  questionAsked: string | null;
  completedAt: number | null;
  targetParticipantId: string | null;
}

export interface BingoCard {
  participantId: string;
  squares: BingoSquare[];
  completedLines: number;
  completedSquares: number;
}

export interface ActivityItem {
  id: string;
  message: string;
  timestamp: number;
  participantName?: string;
  targetName?: string;
  type?: string;
}

export interface GameContextValue {
  session: BingoSession | null;
  setSession: (s: BingoSession | null) => void;
  gameEvent: { title: string; status: string; durationMinutes: number; endTimestamp?: number } | null;
  leaderboard: LeaderboardEntry[];
  myCard: BingoCard | null;
  setMyCard: (card: BingoCard | null) => void;
  activityFeed: ActivityItem[];
  remainingSeconds: number;
  connectionStatus: "connecting" | "connected" | "disconnected";
  myRank: number;
  reconnecting: boolean;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<BingoSession | null>(null);
  const [gameEvent, setGameEvent] = useState<GameContextValue["gameEvent"]>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myCard, setMyCard] = useState<BingoCard | null>(null);
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [reconnecting, setReconnecting] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const { lastEvent, connectionStatus } = useSSE(session?.eventCode || null);

  // Hydrate session from localStorage on mount (client only)
  useEffect(() => {
    const s = loadSession();
    if (s) setSessionState(s);
    setHydrated(true);
  }, []);

  // Persist session to localStorage + cookie on change
  useEffect(() => {
    if (!hydrated) return;
    if (session) saveSession(session);
    else clearSession();
  }, [session, hydrated]);

  // Reconnect: when a session exists, restore state from server
  useEffect(() => {
    if (!session || !hydrated) return;

    const reconnect = async () => {
      setReconnecting(true);
      try {
        const res = await fetch(`/api/events/${session.eventCode}/reconnect`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            participantId: session.participantId,
            sessionToken: session.sessionToken,
          }),
        });

        if (!res.ok) {
          // Session is invalid (event ended, kicked, etc) — clear it
          if (res.status === 401 || res.status === 404) {
            setSessionState(null);
          }
          return;
        }

        const data = await res.json();
        if (data.bingoCard) setMyCard(data.bingoCard);
        if (data.leaderboard) setLeaderboard(data.leaderboard);
        if (data.event) setGameEvent({
          title: data.event.title,
          status: data.event.status,
          durationMinutes: 0,
        });
        if (data.timer?.remainingSeconds) setRemainingSeconds(data.timer.remainingSeconds);
      } catch (e) {
        console.error("Reconnect failed", e);
      } finally {
        setReconnecting(false);
      }
    };

    reconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]); // Only run once after hydration

  // Process SSE events
  useEffect(() => {
    if (!lastEvent) return;
    const { type, data } = lastEvent;

    switch (type) {
      case "connected":
        // Initial connection — update game status
        if (data.status) {
          setGameEvent((prev) =>
            prev
              ? { ...prev, status: data.status }
              : { title: data.title || "", status: data.status, durationMinutes: 0 }
          );
        }
        break;

      case "lobby_update":
        // Update participant count info for lobby
        if (data.participants) {
          // Could update a participants list if needed
        }
        break;

      case "game_started":
        setGameEvent((prev) =>
          prev
            ? { ...prev, status: "active", endTimestamp: data.endTimestamp }
            : { title: "", status: "active", durationMinutes: 0, endTimestamp: data.endTimestamp }
        );
        if (data.leaderboard) setLeaderboard(data.leaderboard);
        if (data.endTimestamp) {
          const remaining = Math.max(0, Math.floor((data.endTimestamp - Date.now()) / 1000));
          setRemainingSeconds(remaining);
        }
        break;

      case "cards_ready":
        // Server broadcasts all cards — find ours by participantId
        if (data.cards && session) {
          const myCardData = data.cards[session.participantId];
          if (myCardData) setMyCard(myCardData);
        }
        break;

      case "timer_tick":
        setRemainingSeconds(data.remainingSeconds ?? 0);
        break;

      case "leaderboard_update":
        if (data.leaderboard) setLeaderboard(data.leaderboard);
        break;

      case "activity_feed":
        if (data.activity) {
          setActivityFeed((prev) => [data.activity, ...prev].slice(0, 50));
        }
        break;

      case "game_state":
        if (data.status) {
          setGameEvent((prev) =>
            prev ? { ...prev, status: data.status } : null
          );
        }
        break;

      case "game_ended":
        setGameEvent((prev) => (prev ? { ...prev, status: "ended" } : null));
        if (data.leaderboard) setLeaderboard(data.leaderboard);
        break;

      case "participant_kicked":
        if (data.participantId === session?.participantId) {
          setSessionState(null);
        }
        break;
    }
  }, [lastEvent, session]);

  const setSession = useCallback((s: BingoSession | null) => {
    setSessionState(s);
    if (!s) {
      // Clear game state too
      setMyCard(null);
      setGameEvent(null);
      setLeaderboard([]);
      setActivityFeed([]);
      setRemainingSeconds(0);
    }
  }, []);

  const myRank = leaderboard.findIndex((l) => l.participantId === session?.participantId) + 1;

  return (
    <GameContext.Provider
      value={{
        session,
        setSession,
        gameEvent,
        leaderboard,
        myCard,
        setMyCard,
        activityFeed,
        remainingSeconds,
        connectionStatus,
        myRank: myRank > 0 ? myRank : 0,
        reconnecting,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGame must be used within a GameProvider");
  return context;
}
