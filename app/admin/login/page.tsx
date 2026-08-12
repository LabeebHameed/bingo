"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveOperatorSession } from "../../lib/client-store";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@university.edu");
  const [password, setPassword] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [operatorSession, setOperatorSession] = useState<{eventCode: string; operatorSecret: string; title: string} | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    
    // Check for existing session
    const sessionStr = localStorage.getItem("human_bingo_operator");
    if (sessionStr) {
      try {
        setOperatorSession(JSON.parse(sessionStr));
      } catch (e) {
        // ignore
      }
    }
    
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    
    try {
      const defaultQuestions = [
        "What is one thing on your bucket list?",
        "What is your go-to karaoke song?",
        "If you could have any superpower, what would it be?",
        "What is the most spontaneous thing you've ever done?",
        "What is your favorite campus coffee spot?",
        "What is the best trip you've ever taken?",
        "What is your hidden talent?",
        "What is your favorite thing about this school?",
        "If you could travel anywhere right now, where would you go?",
        "What is something you want to learn this year?"
      ];
      // Default 25-square grid — labels will be replaced with participant names at game start
      const defaultSquareLabels = [
        "Find Someone", "Find Someone", "Find Someone", "Find Someone", "Find Someone",
        "Find Someone", "Find Someone", "Find Someone", "Find Someone", "Find Someone",
        "Find Someone", "Find Someone", "Find Someone", "Find Someone", "Find Someone",
        "Find Someone", "Find Someone", "Find Someone", "Find Someone", "Find Someone",
        "Find Someone", "Find Someone", "Find Someone", "Find Someone", "Find Someone",
      ];
      const gridConfig = { squares: defaultSquareLabels.map((label, idx) => ({ id: idx + 1, label, task: label, isFree: false })) };

      const res = await fetch("/api/events/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Campus Rally 2026",
          durationMinutes: 20,
          playMode: "solo",
          selfieRequired: true,
          questions: defaultQuestions,
          gridConfig,
        }),
      });
      const data = await res.json();
      
      if (data.eventCode && data.operatorSecret) {
        saveOperatorSession({
          eventCode: data.eventCode,
          operatorSecret: data.operatorSecret,
          title: "Campus Rally 2026",
        });
        router.push("/admin/setup");
      } else {
        alert("Failed to create event");
        setIsCreating(false);
      }
    } catch(err) {
      console.error(err);
      alert("Error creating event");
      setIsCreating(false);
    }
  };

  // Block Admin Login on Mobile Viewports
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background text-on-background flex flex-col items-center justify-center p-margin-mobile text-center font-body-md">
        <div className="bg-surface border-4 border-on-background p-8 pop-shadow max-w-md w-full flex flex-col items-center gap-5">
          <span className="material-symbols-outlined text-6xl text-primary">
            desktop_windows
          </span>
          <h2 className="font-headline-lg text-headline-lg uppercase text-on-background leading-tight">
            ADMIN PORTAL RESTRICTED TO DESKTOP
          </h2>
          <p className="font-body-md text-body-md text-secondary">
            Staff administration, game setup wizard, and projector controls must be accessed from a desktop or laptop browser.
          </p>
          <div className="bg-tertiary-fixed border-2 border-on-background p-3 pop-shadow text-on-tertiary-fixed font-label-bold text-xs uppercase w-full">
            Mobile devices are for player gameplay only.
          </div>
          <Link
            href="/join"
            className="w-full bg-primary text-on-primary border-4 border-on-background px-6 py-4 font-headline-md text-headline-md uppercase pop-shadow hover:bg-primary-container cursor-pointer transition-all mt-2"
          >
            Join as Player on Mobile
          </Link>
          <Link
            href="/"
            className="font-label-bold text-xs uppercase text-secondary underline hover:text-primary mt-1"
          >
            ← Return to Home Page
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen font-body-md text-on-background flex flex-col justify-center items-center p-margin-mobile md:p-margin-desktop relative overflow-hidden">
      {/* Background Dots/Grid Pattern */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.05] z-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, #1a1c1c 1px, transparent 1px), linear-gradient(to bottom, #1a1c1c 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      ></div>

      {/* Ambient Floating Decorative Elements */}
      <div className="absolute -top-10 -left-10 w-32 h-32 bg-secondary-fixed rounded-full border-4 border-on-background opacity-50 -z-10"></div>
      <div className="absolute bottom-10 -right-10 w-48 h-48 bg-primary-fixed rounded-full border-4 border-on-background opacity-50 -z-10"></div>

      {/* Login Card Container */}
      <main className="w-full max-w-[480px] bg-surface rounded-DEFAULT border-4 border-on-background pop-shadow flex flex-col relative z-10">
        {/* Header matching Stitch */}
        <header className="p-stack-md border-b-4 border-on-background flex flex-col items-center justify-center relative bg-surface-container-low rounded-t-DEFAULT overflow-visible">
          {/* Trophy Sticker Image */}
          <img
            src="/images/trophy-sticker.png"
            alt="Trophy Sticker"
            className="absolute -top-12 -right-8 w-28 h-28 md:w-32 md:h-32 z-20 hover:scale-110 transition-transform cursor-pointer drop-shadow-[4px_4px_0_rgba(0,0,0,1)] object-contain"
          />
          <h1 className="font-headline-lg text-headline-lg uppercase tracking-tighter text-center">
            Staff Portal
          </h1>
          <p className="font-label-bold text-label-bold text-on-surface-variant mt-1 uppercase text-center tracking-widest">
            Campus Rally Admin Login
          </p>
        </header>

        {/* Form Area */}
        {operatorSession ? (
          <div className="p-stack-md flex flex-col gap-stack-md bg-surface">
            <div className="flex flex-col items-center gap-2 mb-2 text-center">
              <span className="material-symbols-outlined text-4xl text-primary">event_available</span>
              <p className="font-body-lg text-body-lg text-on-surface">
                Active Event Found:<br />
                <strong className="text-xl uppercase">{operatorSession.title || operatorSession.eventCode}</strong>
              </p>
            </div>
            
            <button
              onClick={() => router.push("/admin/dashboard")}
              className="w-full bg-primary text-on-primary border-4 border-on-background py-4 font-headline-md text-headline-md uppercase pop-shadow hover:bg-primary-container transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Rejoin Dashboard</span>
              <span className="material-symbols-outlined">dashboard</span>
            </button>
            
            <button
              onClick={() => {
                localStorage.removeItem("human_bingo_operator");
                setOperatorSession(null);
              }}
              className="w-full bg-surface-variant text-on-surface-variant border-4 border-on-background py-4 font-headline-md text-headline-md uppercase pop-shadow hover:bg-surface-container-highest transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Create New Event</span>
              <span className="material-symbols-outlined">add_circle</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="p-stack-md flex flex-col gap-stack-md bg-surface">
            {/* Email Field */}
            <div className="flex flex-col gap-base input-focus">
              <label className="font-label-bold text-label-bold uppercase text-on-surface" htmlFor="email">
                University Staff Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@university.edu"
                required
                className="w-full p-3 font-body-md text-body-md border-4 border-on-background bg-surface-lowest rounded-DEFAULT input-focus transition-all"
              />
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-base input-focus">
              <div className="flex justify-between items-end">
                <label className="font-label-bold text-label-bold uppercase text-on-surface" htmlFor="password">
                  Staff Password
                </label>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert("Password reset link sent to staff administrator.");
                  }}
                  className="font-label-bold text-label-bold text-primary hover:underline transition-colors"
                >
                  Forgot?
                </a>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full p-3 font-body-md text-body-md border-4 border-on-background bg-surface-lowest rounded-DEFAULT input-focus transition-all"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isCreating}
              className="w-full mt-2 bg-primary text-on-primary border-4 border-on-background py-4 font-headline-md text-headline-md uppercase pop-shadow hover:bg-primary-container transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{isCreating ? "Creating..." : "Log In & Create Event"}</span>
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </form>
        )}

        {/* Footer Link */}
        <footer className="p-stack-sm border-t-4 border-on-background bg-surface-container-low text-center rounded-b-DEFAULT">
          <Link
            href="/"
            className="font-label-bold text-xs uppercase text-secondary hover:text-primary transition-colors inline-flex items-center gap-1"
          >
            <span>← Return to Campus Rally Landing</span>
          </Link>
        </footer>
      </main>
    </div>
  );
}
