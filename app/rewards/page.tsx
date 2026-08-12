"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type CompletedSquare = {
  id: string;
  label: string;
  photoUrl?: string;
  answer?: string;
  questionAsked?: string;
  completedAt: number;
};

export default function RewardsPage() {
  const [session, setSession] = useState<any>(null);
  const [completedLines, setCompletedLines] = useState(0);
  const [completedSquares, setCompletedSquares] = useState<CompletedSquare[]>([]);
  const [totalSquares, setTotalSquares] = useState(25);

  useEffect(() => {
    const storedSession = localStorage.getItem("human_bingo_session");
    if (storedSession) {
      const parsedSession = JSON.parse(storedSession);
      setSession(parsedSession);

      const fetchState = async () => {
        try {
          const res = await fetch(`/api/events/${parsedSession.eventCode}/reconnect`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionToken: parsedSession.sessionToken }),
          });
          if (res.ok) {
            const data = await res.json();
            
            // Reconstruct completed squares and lines from data
            const squares = data.participant.squares || [];
            
            const completed = squares
              .filter((s: any) => s.completed)
              .map((s: any) => ({
                id: s.id,
                label: s.label,
                photoUrl: s.photoUrl,
                answer: s.answer,
                questionAsked: s.questionAsked,
                completedAt: s.completedAt,
              }))
              .sort((a: any, b: any) => b.completedAt - a.completedAt);
              
            setCompletedSquares(completed);
            setCompletedLines(data.participant.completedLines || 0);
            
            // Assume 25 squares total based on Bingo 5x5
            setTotalSquares(squares.length > 0 ? squares.length : 25);
          }
        } catch (error) {
          console.error("Failed to reconnect", error);
        }
      };

      fetchState();
    }
  }, []);

  const photosCount = completedSquares.filter(s => s.photoUrl).length;
  
  const badges = [
    { 
      title: "First Stamp", 
      desc: "Completed your first bingo task", 
      icon: "stars", 
      status: completedSquares.length >= 1 ? "Unlocked" : "Locked" 
    },
    { 
      title: "Selfie Master", 
      desc: "Took 5 selfies with classmates", 
      icon: "photo_camera", 
      status: photosCount >= 5 ? "Unlocked" : "Locked" 
    },
    { 
      title: "Row Runner", 
      desc: "Completed 1 full bingo line", 
      icon: "straighten", 
      status: completedLines >= 1 ? "Unlocked" : "Locked" 
    },
    { 
      title: "Campus Legend", 
      desc: "Complete all 25 bingo squares", 
      icon: "workspace_premium", 
      status: completedSquares.length >= totalSquares && totalSquares > 0 ? "Unlocked" : "Locked" 
    },
  ];

  let rewardTitle = "Participant Ribbon";
  let rewardDesc = "Thanks for participating! Complete more squares to unlock better rewards.";
  let rewardClaimCode = `RALLY-PARTICIPANT-${session?.participantId?.substring(0,6).toUpperCase()}`;

  if (completedSquares.length >= totalSquares && totalSquares > 0) {
    rewardTitle = "Grand Champion Trophy & Swag Pack";
    rewardDesc = "Unlocked by completing the entire Bingo board! Show this screen at the Student Union booth to claim your Grand Champion reward.";
    rewardClaimCode = `RALLY-CHAMP-${session?.participantId?.substring(0,6).toUpperCase()}`;
  } else if (completedLines >= 1) {
    rewardTitle = "Varsity Hoodie & Swag Pack";
    rewardDesc = "Unlocked by getting BINGO (5 in a row)! Show this screen at the Student Union booth to claim your physical reward.";
    rewardClaimCode = `RALLY-HOODIE-${session?.participantId?.substring(0,6).toUpperCase()}`;
  }

  const handleDownloadCollection = () => {
    const photos = completedSquares.filter(s => s.photoUrl);
    const content = JSON.stringify(photos, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my-bingo-collection-${session?.nickname || 'player'}-${session?.eventCode || 'event'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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
              military_tech
            </span>
            <h1 className="font-display-lg-mobile text-display-lg-mobile text-primary tracking-tighter uppercase">
              EARNED REWARDS
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
        {/* Unlocked Reward Card */}
        <div className="bg-tertiary-fixed border-4 border-on-surface p-6 pop-shadow flex flex-col gap-4 relative overflow-hidden">
          <div className="flex justify-between items-start border-b-4 border-on-surface pb-3">
            <div>
              <span className="bg-primary text-on-primary px-3 py-1 font-label-bold text-xs uppercase border border-on-surface">
                CLAIM READY
              </span>
              <h2 className="font-headline-lg text-headline-lg uppercase text-on-tertiary-fixed mt-2">
                {rewardTitle}
              </h2>
            </div>
            <img src="/images/trophy-sticker.png" alt="Trophy Sticker" className="w-20 h-20 object-contain" />
          </div>
          <p className="font-body-lg text-body-lg text-on-tertiary-fixed">
            {rewardDesc}
          </p>
          <button
            onClick={() => alert(`Reward claim code: ${rewardClaimCode} verified by staff.`)}
            className="w-full bg-primary text-on-primary border-4 border-on-surface py-4 font-headline-md text-headline-md uppercase pop-shadow hover:bg-primary-container cursor-pointer"
          >
            Claim Reward
          </button>
        </div>

        {/* Unlocked Badges */}
        <div className="bg-surface border-4 border-on-surface p-6 pop-shadow flex flex-col gap-4">
          <h3 className="font-headline-md text-headline-md uppercase border-b-4 border-on-surface pb-2 text-on-surface">
            Achievement Badges
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {badges.map((b, idx) => (
              <div
                key={idx}
                className={`border-4 border-on-surface p-4 pop-shadow-sm flex items-center gap-3 ${
                  b.status === "Unlocked" ? "bg-surface-container-lowest" : "bg-surface-variant opacity-60"
                }`}
              >
                <span className="material-symbols-outlined text-4xl text-primary">{b.icon}</span>
                <div>
                  <h4 className="font-headline-md text-sm uppercase text-on-surface">{b.title}</h4>
                  <p className="font-body-md text-xs text-secondary">{b.desc}</p>
                  <span
                    className={`font-label-bold text-[10px] uppercase inline-block mt-1 px-2 py-0.5 border ${
                      b.status === "Unlocked"
                        ? "bg-tertiary-fixed text-on-tertiary-fixed border-on-surface"
                        : "bg-surface-dim text-secondary border-on-surface"
                    }`}
                  >
                    {b.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* My Selfie Collection */}
        <div className="bg-surface border-4 border-on-surface p-6 pop-shadow flex flex-col gap-4">
          <div className="flex justify-between items-center border-b-4 border-on-surface pb-2">
            <h3 className="font-headline-md text-headline-md uppercase text-on-surface">
              My Selfie Collection
            </h3>
            {photosCount > 0 && (
              <button
                onClick={handleDownloadCollection}
                className="bg-primary text-on-primary px-3 py-1 font-label-bold text-xs uppercase border-2 border-on-surface pop-shadow hover:bg-primary-container"
              >
                Download Data
              </button>
            )}
          </div>

          {photosCount > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {completedSquares.filter(s => s.photoUrl).map((sq) => (
                <div key={sq.id} className="bg-surface border-4 border-on-surface pop-shadow flex flex-col overflow-hidden">
                  {/* Selfie image */}
                  <div className="relative h-40 bg-black">
                    <img src={sq.photoUrl} alt={sq.label} className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2">
                      <span className="font-label-bold text-xs text-white uppercase">{sq.label}</span>
                    </div>
                  </div>
                  {/* Q&A */}
                  <div className="p-3 flex flex-col gap-1">
                    {sq.questionAsked && (
                      <span className="font-label-bold text-xs uppercase text-secondary">
                        Asked: {sq.questionAsked}
                      </span>
                    )}
                    {sq.answer && (
                      <span className="font-body-md text-sm font-bold text-on-surface">
                        "{sq.answer}"
                      </span>
                    )}
                    <span className="font-label-bold text-[10px] uppercase text-on-surface-variant">
                      {new Date(sq.completedAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 font-body-md text-secondary">
              No selfies yet! Go complete some squares to build your collection.
            </div>
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t-4 border-on-surface shadow-[0px_-4px_0px_0px_rgba(0,0,0,1)] z-40">
        <div className="max-w-[640px] mx-auto flex justify-around py-2">
          <Link
            href="/bingo"
            className="flex flex-col items-center text-on-surface font-label-bold text-xs uppercase hover:text-primary"
          >
            <span className="material-symbols-outlined text-2xl">grid_on</span>
            <span>Card</span>
          </Link>
          <Link
            href="/rank"
            className="flex flex-col items-center text-on-surface font-label-bold text-xs uppercase hover:text-primary"
          >
            <span className="material-symbols-outlined text-2xl">leaderboard</span>
            <span>Leaderboard</span>
          </Link>
          <Link
            href="/rewards"
            className="flex flex-col items-center text-primary font-label-bold text-xs uppercase"
          >
            <span className="material-symbols-outlined text-2xl">military_tech</span>
            <span>Rewards</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
