"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type LeaderboardEntry = {
  participantId: string;
  nickname: string;
  completedSquares: number;
  completedLines: number;
  totalSquares: number;
  completedAt: number | null; // Timestamp
  rank?: number;
};

export default function LeaderboardPage() {
  const [session, setSession] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [gameEnded, setGameEnded] = useState(false);
  const [gameStartedAt, setGameStartedAt] = useState<number | null>(null);

  useEffect(() => {
    const storedSession = localStorage.getItem("human_bingo_session");
    if (storedSession) {
      const parsedSession = JSON.parse(storedSession);
      setSession(parsedSession);

      const fetchLeaderboard = async () => {
        try {
          const res = await fetch(`/api/events/${parsedSession.eventCode}/reconnect`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              participantId: parsedSession.participantId,
              sessionToken: parsedSession.sessionToken,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.leaderboard) {
              setLeaderboard(data.leaderboard);
            }
            if (data.timer?.status === "ended") {
              setGameEnded(true);
            }
          }
        } catch (error) {
          console.error("Failed to reconnect", error);
        }
      };

      fetchLeaderboard();

      // Set up SSE
      const evtSource = new EventSource(`/api/sse/${parsedSession.eventCode}`);

      const handleUpdate = (data: any) => {
        const board = data.leaderboard || data.payload?.leaderboard;
        if (board) setLeaderboard(board);
      };
      
      evtSource.addEventListener("leaderboard_update", (e) => {
        try {
          handleUpdate(JSON.parse(e.data));
        } catch (err) {}
      });

      evtSource.onmessage = (e) => {
        try {
          const parsed = JSON.parse(e.data);
          if (parsed.type === "leaderboard_update") {
            handleUpdate(parsed);
          }
        } catch(err) {}
      };

      evtSource.addEventListener("game_ended", () => {
        setGameEnded(true);
      });

      return () => {
        evtSource.close();
      };
    }
  }, []);

  const formatTime = (completedAt: number | null) => {
    if (!completedAt || !gameStartedAt) return "--";
    const diffSeconds = Math.floor((completedAt - gameStartedAt) / 1000);
    if (diffSeconds < 0) return "0s";
    const mins = Math.floor(diffSeconds / 60);
    const secs = diffSeconds % 60;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const getBadgeName = (entry: LeaderboardEntry, rank: number) => {
    if (rank === 1) return "Gold Rally Champion";
    if (rank === 2) return "Silver Sprinter";
    if (rank === 3) return "Bronze Hustler";
    if (entry.completedLines > 0) return "Bingo Achiever";
    return "Task Tracker";
  };

  const rankedPlayers = leaderboard.map((player, idx) => ({
    ...player,
    rank: idx + 1,
  }));

  const top3 = rankedPlayers.slice(0, 3);
  const others = rankedPlayers;

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-body-md selection:bg-primary-container selection:text-on-primary-container pb-24">
      {/* Top Header */}
      <header className="bg-surface w-full top-0 sticky border-b-4 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-50">
        <div className="flex justify-between items-center px-margin-mobile md:px-margin-desktop py-base w-full max-w-[1280px] mx-auto">
          <div className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-3xl font-bold text-primary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              emoji_events
            </span>
            <h1 className="font-display-lg-mobile text-display-lg-mobile text-primary tracking-tighter uppercase">
              RALLY LEADERBOARD
            </h1>
          </div>
          <Link
            href="/"
            className="bg-primary text-on-primary border-2 border-on-surface px-3 py-1 font-label-bold text-xs uppercase pop-shadow hover:bg-primary-container"
          >
            ← Exit to Hub
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[640px] mx-auto w-full p-margin-mobile flex flex-col gap-stack-md">
        
        {gameEnded && (
          <div className="bg-primary text-on-primary border-4 border-on-surface p-4 pop-shadow text-center">
            <h2 className="font-headline-lg uppercase">Game Over - Final Rankings!</h2>
          </div>
        )}

        {/* Top 3 Podium Cards */}
        {top3.length > 0 && (
          <div className="grid grid-cols-3 gap-2 items-end pt-4">
            {/* #2 Rank */}
            {top3[1] ? (
              <div className={`bg-surface-container border-4 border-on-surface p-3 pop-shadow text-center flex flex-col items-center gap-1 ${session?.participantId === top3[1].participantId ? 'ring-4 ring-primary' : ''}`}>
                <span className="font-headline-md text-2xl text-secondary">#2</span>
                <span className="font-label-bold text-xs uppercase font-bold break-all">{top3[1].nickname} {session?.participantId === top3[1].participantId && "(YOU)"}</span>
                <span className="bg-secondary text-on-secondary px-2 py-0.5 text-[10px] font-label-bold">
                  {top3[1].completedSquares}/{top3[1].totalSquares}
                </span>
                <span className="text-[9px] uppercase font-bold text-secondary">{top3[1].completedLines} Lines</span>
              </div>
            ) : <div className="p-3" />}

            {/* #1 Rank Podium */}
            {top3[0] ? (
              <div className={`bg-tertiary-fixed border-4 border-on-surface p-4 pop-shadow text-center flex flex-col items-center gap-1 transform -translate-y-2 ${session?.participantId === top3[0].participantId ? 'ring-4 ring-primary' : ''}`}>
                <span className="material-symbols-outlined text-4xl text-on-tertiary-fixed">crown</span>
                <span className="font-headline-md text-3xl text-on-tertiary-fixed">#1</span>
                <span className="font-headline-md text-sm uppercase text-on-tertiary-fixed break-all">{top3[0].nickname} {session?.participantId === top3[0].participantId && "(YOU)"}</span>
                <span className="bg-primary text-on-primary px-3 py-1 text-xs font-label-bold uppercase border border-on-surface">
                  {top3[0].completedSquares}/{top3[0].totalSquares}
                </span>
                <span className="text-[10px] uppercase font-bold text-on-tertiary-fixed">{top3[0].completedLines} Lines</span>
              </div>
            ) : <div className="p-4" />}

            {/* #3 Rank */}
            {top3[2] ? (
              <div className={`bg-surface-container-low border-4 border-on-surface p-3 pop-shadow text-center flex flex-col items-center gap-1 ${session?.participantId === top3[2].participantId ? 'ring-4 ring-primary' : ''}`}>
                <span className="font-headline-md text-2xl text-secondary">#3</span>
                <span className="font-label-bold text-xs uppercase font-bold break-all">{top3[2].nickname} {session?.participantId === top3[2].participantId && "(YOU)"}</span>
                <span className="bg-secondary text-on-secondary px-2 py-0.5 text-[10px] font-label-bold">
                  {top3[2].completedSquares}/{top3[2].totalSquares}
                </span>
                <span className="text-[9px] uppercase font-bold text-secondary">{top3[2].completedLines} Lines</span>
              </div>
            ) : <div className="p-3" />}
          </div>
        )}

        {/* Full Leaderboard List */}
        <div className="bg-surface border-4 border-on-surface pop-shadow p-4 flex flex-col gap-3">
          <h3 className="font-headline-md text-headline-md uppercase border-b-4 border-on-surface pb-2 text-on-surface">
            All Live Rankings
          </h3>

          <div className="flex flex-col gap-2">
            {others.map((player) => {
              const isMe = session?.participantId === player.participantId;
              const isFiveOfFive = (player.completedLines || 0) >= 5 || (player.completedSquares || 0) >= 25;

              return (
                <div
                  key={player.participantId}
                  className={`border-4 p-3 flex justify-between items-center pop-shadow ${
                    isFiveOfFive
                      ? 'bg-green-600 text-white border-green-950 font-bold'
                      : isMe
                        ? 'bg-surface-bright border-primary ring-4 ring-primary'
                        : 'bg-surface-container-lowest border-on-surface'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`font-headline-md text-xl w-8 text-center ${isFiveOfFive ? 'text-white font-black' : 'text-primary'}`}>
                      #{player.rank}
                    </span>
                    <div>
                      <h4 className={`font-headline-md text-sm uppercase flex items-center gap-2 ${isFiveOfFive ? 'text-white' : 'text-on-surface'}`}>
                        {player.nickname}
                        {isMe && <span className="bg-primary text-on-primary px-1.5 py-0.5 text-[9px] font-bold uppercase rounded-sm border border-on-surface">YOU</span>}
                      </h4>
                      <span className={`font-label-bold text-xs uppercase ${isFiveOfFive ? 'text-green-100' : 'text-secondary'}`}>
                        {isFiveOfFive ? '🏆 GRAND BINGO CHAMPION' : getBadgeName(player, player.rank!)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <span className={`font-bold text-xs px-2 py-0.5 border-2 border-on-surface pop-shadow-sm ${
                      isFiveOfFive ? 'bg-green-300 text-green-950 font-black animate-bounce' : 'bg-surface text-on-surface'
                    }`}>
                      {isFiveOfFive ? '🏆 5/5 BINGO!' : `${player.completedLines || 0}/5 LINES`}
                    </span>
                    <span className={`font-label-bold text-[10px] uppercase ${isFiveOfFive ? 'text-green-100' : 'text-secondary'}`}>
                      {player.completedSquares || 0}/25 STAMPED
                    </span>
                  </div>
                </div>
              );
            })}
            
            {others.length === 0 && (
              <div className="text-center py-4 font-body-md text-secondary">
                No players yet.
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t-4 border-on-surface p-2 shadow-[0px_-4px_0px_0px_rgba(0,0,0,1)] z-40 flex justify-around items-center">
        <Link
          href="/bingo"
          className="flex flex-col items-center text-secondary font-label-bold text-xs uppercase hover:text-primary"
        >
          <span className="material-symbols-outlined text-2xl">grid_view</span>
          <span>CARD</span>
        </Link>

        <Link
          href="/rank"
          className="flex flex-col items-center text-primary font-label-bold text-xs uppercase"
        >
          <span
            className="material-symbols-outlined text-2xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            leaderboard
          </span>
          <span>LEADERBOARD</span>
        </Link>

        <Link
          href="/rewards"
          className="flex flex-col items-center text-secondary font-label-bold text-xs uppercase hover:text-primary"
        >
          <span className="material-symbols-outlined text-2xl">military_tech</span>
          <span>REWARDS</span>
        </Link>
      </nav>
    </div>
  );
}
