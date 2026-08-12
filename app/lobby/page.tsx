"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useGame } from "../context/GameContext";
import { saveSession } from "../lib/client-store";

function LobbyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, setSession, gameEvent, connectionStatus } = useGame();
  
  const [gameCode, setGameCode] = useState("");
  const [realName, setRealName] = useState("");
  const [nickname, setNickname] = useState("");
  const [starterBadge, setStarterBadge] = useState<"fire" | "bolt" | "rabbit">("fire");
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const codeParam = searchParams.get("code") || sessionStorage.getItem("temp_join_code");
    if (codeParam) {
      setGameCode(codeParam.toUpperCase());
    } else if (!session) {
      router.push("/join");
    }
  }, [searchParams, session, router]);

  useEffect(() => {
    if (session && (gameEvent?.status === "active" || gameEvent?.status === "paused")) {
      window.location.href = "/bingo";
    } else if (session && gameEvent?.status === "ended") {
      window.location.href = "/rewards";
    }
  }, [session, gameEvent]);

  // Polling fallback to guarantee instant transition when host starts game
  useEffect(() => {
    if (!session?.eventCode) return;

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/events/${session.eventCode}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === "active" || data.status === "paused") {
            window.location.href = "/bingo";
          } else if (data.status === "ended") {
            window.location.href = "/rewards";
          }
        }
      } catch (e) {}
    };

    checkStatus();
    const interval = setInterval(checkStatus, 1500);
    return () => clearInterval(interval);
  }, [session]);

  const handleEnterGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameCode) return;
    
    setIsJoining(true);
    setError("");
    
    try {
      const res = await fetch(`/api/events/${gameCode}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: realName, nickname, badge: starterBadge }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to join game");
      }
      
      const sessionData = {
        eventCode: gameCode,
        participantId: data.participantId,
        sessionToken: data.sessionToken,
        name: realName,
        nickname: nickname,
        badge: starterBadge,
      };
      // saveSession also sets the hb_session cookie for middleware auth
      saveSession(sessionData);
      setSession(sessionData);
      
      sessionStorage.removeItem("temp_join_code");

      // If joining late while game is already active or paused, enter game immediately
      if (data.eventStatus === "active" || data.eventStatus === "paused") {
        window.location.href = "/bingo";
      }
    } catch (err: any) {
      setError(err.message);
      setIsJoining(false);
    }
  };

  if (session) {
    return (
      <div className="bg-surface border-[4px] border-on-surface pop-shadow-lg p-6 md:p-8 flex flex-col gap-stack-md relative z-20 text-center">
        <h2 className="font-headline-lg text-headline-lg uppercase text-on-surface">
          Waiting Room
        </h2>
        
        <div className="py-8 flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-full border-[4px] border-on-surface bg-primary text-on-primary flex items-center justify-center pop-shadow animate-pulse">
             <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              hourglass_top
            </span>
          </div>
          <p className="font-headline-md text-headline-md text-secondary uppercase">
            Waiting for host to start...
          </p>
        </div>

        <div className="bg-surface-container-lowest border-4 border-on-surface p-4 pop-shadow">
          <p className="font-label-bold text-label-bold uppercase text-on-surface mb-2">Connection Status</p>
          <div className="flex items-center justify-center gap-2">
            <div className={`w-3 h-3 rounded-full border-2 border-on-surface ${connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="font-body-md uppercase font-bold">{connectionStatus}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleEnterGame}
      className="bg-secondary-fixed border-[4px] border-on-surface pop-shadow-lg p-6 md:p-8 flex flex-col gap-stack-md relative z-20"
    >
      <h2 className="font-headline-md text-headline-md uppercase text-on-surface border-b-[4px] border-on-surface pb-2">
        Profile Setup
      </h2>
      
      {error && (
        <div className="bg-red-100 border-2 border-red-500 text-red-700 p-2 font-label-bold">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label
          className="font-label-bold text-label-bold uppercase text-on-surface flex items-center gap-2"
          htmlFor="realName"
        >
          <span className="material-symbols-outlined text-lg">badge</span>
          Real Name
        </label>
        <div className="input-focus relative border-[4px] border-on-surface bg-surface-container-lowest transition-shadow duration-200">
          <input
            id="realName"
            type="text"
            value={realName}
            onChange={(e) => setRealName(e.target.value)}
            placeholder="Jane Doe"
            required
            className="w-full border-none bg-transparent font-body-lg text-body-lg text-on-surface p-4 focus:outline-none focus:ring-0 placeholder:text-on-surface-variant/50"
          />
        </div>
        <p className="font-body-md text-body-md text-on-surface-variant text-sm">
          For official prize claims and admin verification.
        </p>
      </div>

      <div className="flex flex-col gap-2 mt-stack-sm">
        <label
          className="font-label-bold text-label-bold uppercase text-on-surface flex items-center gap-2"
          htmlFor="nickname"
        >
          <span className="material-symbols-outlined text-lg">sports_esports</span>
          Display Nickname
        </label>
        <div className="input-focus relative border-[4px] border-on-surface bg-surface-container-lowest transition-shadow duration-200">
          <input
            id="nickname"
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="RallyChamp99"
            required
            className="w-full border-none bg-transparent font-body-lg text-body-lg text-on-surface p-4 focus:outline-none focus:ring-0 placeholder:text-on-surface-variant/50"
          />
        </div>
        <p className="font-body-md text-body-md text-on-surface-variant text-sm">
          This is what other players will see on the leaderboard.
        </p>
      </div>

      <div className="flex flex-col gap-2 mt-stack-sm">
        <span className="font-label-bold text-label-bold uppercase text-on-surface">
          Starter Badge
        </span>
        <div className="flex gap-4 relative z-30">
          <button
            type="button"
            onClick={() => setStarterBadge("fire")}
            className={`w-16 h-16 border-[4px] border-on-surface pop-shadow flex items-center justify-center transition-all cursor-pointer relative z-30 pointer-events-auto active:scale-95 ${
              starterBadge === "fire"
                ? "bg-primary text-on-primary ring-4 ring-tertiary-fixed-dim scale-105"
                : "bg-tertiary-fixed-dim text-on-surface hover:bg-tertiary-fixed"
            }`}
          >
            <span
              className="material-symbols-outlined text-3xl pointer-events-none"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              local_fire_department
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStarterBadge("bolt")}
            className={`w-16 h-16 border-[4px] border-on-surface pop-shadow flex items-center justify-center transition-all cursor-pointer relative z-30 pointer-events-auto active:scale-95 ${
              starterBadge === "bolt"
                ? "bg-primary text-on-primary ring-4 ring-tertiary-fixed-dim scale-105"
                : "bg-secondary-fixed-dim text-on-surface hover:bg-secondary-fixed"
            }`}
          >
            <span
              className="material-symbols-outlined text-3xl pointer-events-none"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              bolt
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStarterBadge("rabbit")}
            className={`w-16 h-16 border-[4px] border-on-surface pop-shadow flex items-center justify-center transition-all cursor-pointer relative z-30 pointer-events-auto active:scale-95 ${
              starterBadge === "rabbit"
                ? "bg-primary text-on-primary ring-4 ring-tertiary-fixed-dim scale-105"
                : "bg-surface-variant text-on-surface hover:bg-surface-container-high"
            }`}
          >
            <span
              className="material-symbols-outlined text-3xl pointer-events-none"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              cruelty_free
            </span>
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isJoining}
        className="mt-stack-md w-full bg-primary text-on-primary font-headline-md text-headline-md uppercase py-4 border-[4px] border-on-surface pop-shadow pop-shadow-active transition-transform duration-100 flex items-center justify-center gap-2 cursor-pointer hover:bg-primary-container active:scale-95 text-center relative z-40 pointer-events-auto disabled:opacity-50 disabled:pointer-events-none"
      >
        <span>{isJoining ? "JOINING..." : "ENTER THE GAME"}</span>
        <span
          className="material-symbols-outlined text-3xl"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          arrow_forward
        </span>
      </button>
    </form>
  );
}

export default function LobbyPage() {
  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-body-md overflow-x-hidden selection:bg-primary-container selection:text-on-primary-container">
      <header className="bg-surface w-full top-0 sticky border-b-4 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-50">
        <div className="flex justify-between items-center px-margin-mobile md:px-margin-desktop py-base w-full max-w-[1280px] mx-auto">
          <Link href="/" className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-3xl font-bold text-primary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              sports_score
            </span>
            <h1 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-primary tracking-tighter uppercase">
              CAMPUS RALLY
            </h1>
          </Link>
          <Link
            href="/"
            className="text-xs font-label-bold uppercase bg-surface border-2 border-on-surface px-3 py-1 pop-shadow"
          >
            Home
          </Link>
        </div>
      </header>

      <main className="flex-grow w-full max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg flex flex-col justify-center relative z-10">
        <div className="w-full max-w-[600px] flex flex-col justify-center relative z-20 mx-auto">
          <div className="inline-block bg-primary border-[3px] border-on-surface px-6 py-2 self-end transform rotate-3 pop-shadow mb-[-12px] z-30">
            <span className="font-label-bold text-label-bold text-on-primary uppercase font-bold">
              Step 2 of 2: Profile Setup
            </span>
          </div>

          <Suspense fallback={<div className="p-8 text-center bg-secondary-fixed border-[4px] border-on-surface">Loading...</div>}>
            <LobbyContent />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
