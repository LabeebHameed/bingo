"use client";

import { useState, Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AdminSidebar from "../components/AdminSidebar";

function SetupFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isReadOnly = searchParams.get("mode") === "readonly";

  const [rallyTitle, setRallyTitle] = useState("Fall 2026 Campus Welcome Rally");
  const [capacity, setCapacity] = useState(250);
  const [duration, setDuration] = useState(45);
  const [playMode, setPlayMode] = useState<"solo" | "squad">("solo");
  const [operatorSession, setOperatorSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const s = localStorage.getItem("human_bingo_operator");
    if (s) {
      const parsed = JSON.parse(s);
      setOperatorSession(parsed);
      if (parsed.title) setRallyTitle(parsed.title);
    }
    setLoading(false);
  }, []);

  const handleNext = () => {
    localStorage.setItem("operator_config", JSON.stringify({
      title: rallyTitle,
      capacity,
      durationMinutes: duration,
      playMode
    }));
    router.push("/admin/grid-config");
  };

  const handleStartEditing = () => {
    router.push("/admin/setup");
  };

  if (loading) return <div className="min-h-screen bg-surface p-8">Loading setup...</div>;
  
  if (!operatorSession) {
    return (
      <div className="min-h-screen bg-surface p-8 flex flex-col items-center justify-center font-body-md text-on-surface">
        <h2 className="font-headline-lg text-headline-lg mb-4">No active event. Create one first.</h2>
        <Link href="/admin/login" className="bg-primary text-on-primary px-6 py-3 font-label-bold uppercase pop-shadow">
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-surface text-on-surface font-body-md min-h-screen flex flex-col md:flex-row">
      {/* Reusable Sidebar Component */}
      <AdminSidebar mode={isReadOnly ? "operator" : "wizard"} activeKey="setup" />

      {/* Main Setup Content Area */}
      <main className="flex-grow flex flex-col p-margin-mobile md:p-margin-desktop bg-background overflow-y-auto min-h-screen">
        {/* Consistent Top Header */}
        <div className="flex items-end justify-between border-b-4 border-on-surface pb-stack-sm mb-stack-lg">
          <div>
            <span className="inline-block px-3 py-1 bg-tertiary-fixed text-on-tertiary-fixed border-2 border-on-surface font-label-bold text-label-bold uppercase mb-2 pop-shadow transform -rotate-2">
              {isReadOnly ? "Game Setup Preview" : "Step 1 of 3"}
            </span>
            <h2 className="font-display-lg text-display-lg text-on-surface uppercase leading-none md:text-[80px]">
              {isReadOnly ? "Game Setup Summary" : "Game Setup"}
            </h2>
          </div>
          <div className="hidden md:block w-32 h-32 relative">
            <img
              alt="Campus Mascot Sticker"
              className="absolute inset-0 w-full h-full object-contain transform rotate-6 drop-shadow-md"
              src="/images/mascot-bulldog.png"
            />
          </div>
        </div>

        {/* Read-Only Preview Mode Screen */}
        {isReadOnly ? (
          <div className="flex flex-col gap-stack-md max-w-[1280px] w-full flex-1">
            {/* Top Preview Banner */}
            <div className="bg-secondary-fixed border-4 border-on-surface p-6 pop-shadow flex justify-between items-center">
              <div>
                <span className="font-label-bold text-xs uppercase text-secondary">Active Configuration</span>
                <h3 className="font-headline-lg text-headline-lg uppercase text-on-surface">
                  {rallyTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleStartEditing}
                className="bg-primary text-on-primary font-headline-md text-headline-md uppercase px-6 py-3 border-4 border-on-surface pop-shadow hover:bg-primary-container cursor-pointer flex items-center gap-2"
              >
                <span className="material-symbols-outlined">edit</span>
                <span>EDIT SETUP</span>
              </button>
            </div>

            {/* 2-Column Summary Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
              {/* Card 1: General Parameters */}
              <div className="bg-surface border-4 border-on-surface p-6 pop-shadow flex flex-col gap-4">
                <h4 className="font-headline-md text-headline-md uppercase border-b-4 border-on-surface pb-2">
                  General Settings
                </h4>
                <div className="flex flex-col gap-3">
                  <div>
                    <span className="font-label-bold text-xs uppercase text-secondary">Play Mode:</span>
                    <span className="font-headline-md text-base uppercase block text-primary">
                      {playMode === "solo" ? "Solo Run (Individual Cards)" : "Squad Up (Teams of 4)"}
                    </span>
                  </div>
                  <div>
                    <span className="font-label-bold text-xs uppercase text-secondary">Target Capacity:</span>
                    <span className="font-headline-md text-base uppercase block text-on-surface">
                      {capacity} Players
                    </span>
                  </div>
                  <div>
                    <span className="font-label-bold text-xs uppercase text-secondary">Timer Duration:</span>
                    <span className="font-headline-md text-base uppercase block text-on-surface">
                      {duration} Minutes
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Grid & Rewards Overview */}
              <div className="bg-surface border-4 border-on-surface p-6 pop-shadow flex flex-col gap-4">
                <h4 className="font-headline-md text-headline-md uppercase border-b-4 border-on-surface pb-2">
                  Grid & Reward Overview
                </h4>
                <div className="flex flex-col gap-3">
                  <div>
                    <span className="font-label-bold text-xs uppercase text-secondary">Bingo Grid:</span>
                    <span className="font-headline-md text-base uppercase block text-primary">
                      5x5 Grid (25 Squares Configured)
                    </span>
                  </div>
                  <div>
                    <span className="font-label-bold text-xs uppercase text-secondary">Reward Tiers:</span>
                    <span className="font-body-md text-sm block font-bold text-on-surface">
                      Tier 1: Grand Champion ($50 Gift Card)
                    </span>
                    <span className="font-body-md text-sm block text-on-surface-variant">
                      Tier 2: 5-in-a-Row Winner (Tumbler + Voucher)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-between items-center pt-4 pb-8">
              <Link
                href="/admin/dashboard"
                className="bg-surface border-4 border-on-surface px-6 py-4 font-label-bold text-label-bold uppercase pop-shadow hover:bg-surface-variant"
              >
                ← Back to Operator Dashboard
              </Link>
              <button
                type="button"
                onClick={handleStartEditing}
                className="bg-primary text-on-primary font-headline-md text-headline-md uppercase px-8 py-4 border-4 border-on-surface pop-shadow hover:bg-primary-container transition-all flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined">edit</span>
                <span>EDIT SETUP</span>
              </button>
            </div>
          </div>
        ) : (
          /* Editable Form Mode Screen */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter max-w-[1280px] w-full flex-1">
            {/* Main Form Area */}
            <div className="lg:col-span-8 flex flex-col gap-stack-md">
              {/* Rally Title Field */}
              <div className="bg-surface border-4 border-on-surface p-6 pop-shadow flex flex-col gap-2">
                <label className="font-headline-md text-headline-md uppercase text-on-surface">
                  Rally Title
                </label>
                <p className="font-body-md text-body-md text-on-surface-variant mb-2">
                  This title will appear at the top of all participant screens and big projector displays.
                </p>
                <input
                  type="text"
                  value={rallyTitle}
                  onChange={(e) => setRallyTitle(e.target.value)}
                  className="w-full border-4 border-on-surface p-4 font-headline-md text-headline-md bg-surface-container-lowest focus:outline-none focus:ring-4 focus:ring-primary"
                />
              </div>

              {/* Play Mode Selection */}
              <div className="bg-surface border-4 border-on-surface p-6 pop-shadow flex flex-col gap-4">
                <h3 className="font-headline-md text-headline-md uppercase text-on-surface border-b-4 border-on-surface pb-2">
                  Play Mode Selection
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setPlayMode("solo")}
                    className={`border-4 border-on-surface p-5 text-left pop-shadow transition-all flex flex-col justify-between cursor-pointer ${
                      playMode === "solo"
                        ? "bg-tertiary-fixed text-on-tertiary-fixed border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] scale-[1.02]"
                        : "bg-surface text-on-surface hover:bg-surface-variant"
                    }`}
                  >
                    <div>
                      <span className="material-symbols-outlined text-3xl mb-2">person</span>
                      <h4 className="font-headline-md text-headline-md uppercase">Solo Run</h4>
                      <p className="font-body-md text-sm mt-1">Every student competes individually on their own bingo card.</p>
                    </div>
                    <span className="font-label-bold text-xs uppercase mt-4 block font-bold">
                      {playMode === "solo" ? "✓ Selected" : "Select Solo"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPlayMode("squad")}
                    className={`border-4 border-on-surface p-5 text-left pop-shadow transition-all flex flex-col justify-between cursor-pointer ${
                      playMode === "squad"
                        ? "bg-tertiary-fixed text-on-tertiary-fixed border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] scale-[1.02]"
                        : "bg-surface text-on-surface hover:bg-surface-variant"
                    }`}
                  >
                    <div>
                      <span className="material-symbols-outlined text-3xl mb-2">groups</span>
                      <h4 className="font-headline-md text-headline-md uppercase">Squad Up</h4>
                      <p className="font-body-md text-sm mt-1">Players join teams of 4 to fill grid squares collectively.</p>
                    </div>
                    <span className="font-label-bold text-xs uppercase mt-4 block font-bold">
                      {playMode === "squad" ? "✓ Selected" : "Select Squad"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Event Capacity & Duration Sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-surface border-4 border-on-surface p-6 pop-shadow flex flex-col gap-2">
                  <label className="font-headline-md text-headline-md uppercase">Target Capacity</label>
                  <span className="font-display-lg text-3xl text-primary font-bold">{capacity} Players</span>
                  <input
                    type="range"
                    min="50"
                    max="1000"
                    step="50"
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full accent-primary cursor-pointer mt-2"
                  />
                </div>

                <div className="bg-surface border-4 border-on-surface p-6 pop-shadow flex flex-col gap-2">
                  <label className="font-headline-md text-headline-md uppercase">Timer Duration</label>
                  <span className="font-display-lg text-3xl text-primary font-bold">{duration} Minutes</span>
                  <input
                    type="range"
                    min="10"
                    max="120"
                    step="5"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full accent-primary cursor-pointer mt-2"
                  />
                </div>
              </div>
            </div>

            {/* Side Info & Action Panel */}
            <div className="lg:col-span-4 flex flex-col justify-between">
              <div className="bg-secondary-fixed border-4 border-on-surface p-6 pop-shadow flex flex-col gap-4">
                <h3 className="font-headline-md text-headline-md uppercase text-on-surface border-b-4 border-on-surface pb-2">
                  Wizard Status
                </h3>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between font-label-bold text-xs uppercase">
                    <span>Current Progress</span>
                    <span>Step 1 of 3</span>
                  </div>
                  <div className="w-full bg-surface border-2 border-on-surface h-4 overflow-hidden">
                    <div className="bg-primary h-full w-1/3"></div>
                  </div>
                </div>
                <p className="font-body-md text-body-md text-on-surface">
                  Configuring general parameters. In the next step, you will customize the 25 bingo grid tasks.
                </p>
              </div>

              {/* Bottom Action Bar */}
              <div className="flex justify-between items-center pt-6 pb-8">
                <Link
                  href="/"
                  className="bg-surface border-4 border-on-surface px-6 py-4 font-label-bold text-label-bold uppercase pop-shadow hover:bg-surface-variant"
                >
                  Cancel
                </Link>
                <button
                  type="button"
                  onClick={handleNext}
                  className="bg-primary text-on-primary font-headline-md text-headline-md uppercase px-8 py-4 border-4 border-on-surface pop-shadow hover:bg-primary-container transition-all flex items-center gap-2 cursor-pointer"
                >
                  Next Step
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                    arrow_forward
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function AdminSetupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface p-8">Loading setup...</div>}>
      <SetupFormContent />
    </Suspense>
  );
}
