"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { loadSession, clearSession } from "../lib/client-store";

function JoinForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [gameCode, setGameCode] = useState("");
  const [existingSession, setExistingSession] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const codeParam = searchParams.get("code");
    if (codeParam) {
      setGameCode(codeParam.toUpperCase());
    }

    const session = loadSession();
    if (session) {
      setExistingSession(session);
    }
    setIsChecking(false);
  }, [searchParams]);

  const handleJoinCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const codeToTest = gameCode.trim().toUpperCase();
    if (!codeToTest) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/events/${codeToTest}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError(`Event "${codeToTest}" not found. Please check the code on the screen or scan the QR code.`);
        } else {
          setError("Failed to check event code. Please try again.");
        }
        setIsSubmitting(false);
        return;
      }

      const data = await res.json();
      if (data.status === "ended") {
        setError("This event has already ended.");
        setIsSubmitting(false);
        return;
      }

      sessionStorage.setItem("temp_join_code", codeToTest);
      router.push(`/lobby?code=${codeToTest}`);
    } catch (err) {
      console.error(err);
      setError("Network error validating code. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleRejoin = () => {
    router.push("/bingo");
  };

  const handleNewPlayer = () => {
    clearSession();
    setExistingSession(null);
  };

  if (isChecking) return null;

  if (existingSession) {
    return (
      <div className="bg-surface border-[4px] border-on-surface pop-shadow-lg p-6 md:p-8 flex flex-col gap-stack-md relative z-20">
        <div className="border-b-[4px] border-on-surface pb-3">
          <h2 className="font-headline-lg text-headline-lg uppercase text-on-surface">
            Welcome Back!
          </h2>
          <p className="font-body-md text-body-md text-secondary mt-1">
            We found an active session for <strong>{existingSession.name}</strong>.
          </p>
        </div>
        <button
          onClick={handleRejoin}
          className="mt-2 w-full bg-primary text-on-primary font-headline-md text-headline-md uppercase py-5 border-[4px] border-on-surface pop-shadow pop-shadow-active transition-transform duration-100 flex items-center justify-center gap-3 cursor-pointer hover:bg-primary-container active:scale-95"
        >
          <span>REJOIN GAME</span>
          <span
            className="material-symbols-outlined text-3xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            refresh
          </span>
        </button>
        <button
          onClick={handleNewPlayer}
          className="mt-2 w-full bg-surface text-secondary font-label-bold text-xs uppercase py-3 border-[4px] border-on-surface pop-shadow pop-shadow-active transition-transform duration-100 flex items-center justify-center gap-3 cursor-pointer hover:bg-surface-variant active:scale-95"
        >
          JOIN AS NEW PLAYER
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleJoinCode}
      className="bg-surface border-[4px] border-on-surface pop-shadow-lg p-6 md:p-8 flex flex-col gap-stack-md relative z-20"
    >
      <div className="border-b-[4px] border-on-surface pb-3">
        <h2 className="font-headline-lg text-headline-lg uppercase text-on-surface">
          Join Active Rally
        </h2>
        <p className="font-body-md text-body-md text-secondary mt-1">
          Enter the official event code displayed on the main projector screen to join.
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border-4 border-red-500 text-red-700 p-4 font-headline-md text-sm uppercase pop-shadow">
          ⚠️ {error}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label
          className="font-label-bold text-label-bold uppercase text-on-surface flex items-center gap-2"
          htmlFor="gameCode"
        >
          <span className="material-symbols-outlined text-lg text-primary">qr_code_2</span>
          Rally Event Code
        </label>
        <div className="input-focus relative border-[4px] border-on-surface bg-surface-container-lowest transition-shadow duration-200">
          <input
            id="gameCode"
            type="text"
            value={gameCode}
            onChange={(e) => setGameCode(e.target.value.toUpperCase())}
            placeholder="e.g. BINGO-A3X9"
            required
            className="w-full border-none bg-transparent font-headline-md text-2xl md:text-3xl text-on-surface p-4 tracking-widest uppercase focus:outline-none focus:ring-0 placeholder:text-on-surface-variant/40"
          />
        </div>
      </div>

      <div className="bg-secondary-fixed border-2 border-on-surface p-3 pop-shadow flex items-center gap-3">
        <span className="material-symbols-outlined text-secondary text-2xl">qr_code_scanner</span>
        <p className="font-label-bold text-xs uppercase text-on-surface">
          Scanning a campus QR code automatically jumps directly to Step 2!
        </p>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 w-full bg-primary text-on-primary font-headline-md text-headline-md uppercase py-5 border-[4px] border-on-surface pop-shadow pop-shadow-active transition-transform duration-100 flex items-center justify-center gap-3 cursor-pointer hover:bg-primary-container active:scale-95 disabled:opacity-50"
      >
        <span>{isSubmitting ? "VERIFYING CODE..." : "ENTER GAME CODE"}</span>
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

export default function JoinPage() {
  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-body-md selection:bg-primary-container selection:text-on-primary-container relative overflow-x-hidden">
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
        <div className="w-full max-w-[540px] flex flex-col justify-center relative z-20 mx-auto">
          <div className="inline-block bg-tertiary-fixed border-[3px] border-on-surface px-6 py-2 self-start transform -rotate-3 pop-shadow mb-[-12px] z-30">
            <span className="font-label-bold text-label-bold text-on-tertiary-fixed uppercase font-bold">
              Step 1 of 2: Enter Game Code
            </span>
          </div>

          <Suspense fallback={<div className="p-8 text-center bg-surface border-[4px] border-on-surface">Loading...</div>}>
            <JoinForm />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
