"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminSidebar from "../components/AdminSidebar";

export default function OperatorDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"feed" | "setup" | "qr">("feed");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [endTimestamp, setEndTimestamp] = useState<number | null>(null);
  
  const [operatorSession, setOperatorSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [activityFeed, setActivityFeed] = useState<any[]>([]);
  
  useEffect(() => {
    const s = localStorage.getItem("human_bingo_operator");
    if (s) {
      setOperatorSession(JSON.parse(s));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!operatorSession?.eventCode) return;
    const es = new EventSource(`/api/sse/${operatorSession.eventCode}`);
    
    es.addEventListener("game_started", (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.endTimestamp) setEndTimestamp(data.endTimestamp);
      } catch(err) {}
    });
    
    es.addEventListener("timer_tick", (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.endTimestamp) setEndTimestamp(data.endTimestamp);
      } catch(err) {}
    });

    es.addEventListener("leaderboard_update", (e) => {
      try {
        const data = JSON.parse(e.data);
        setLeaderboard(data.leaderboard || []);
      } catch(err) {}
    });

    es.addEventListener("activity_feed", (e) => {
      try {
        const data = JSON.parse(e.data);
        // Prepend new activity
        setActivityFeed(prev => [data, ...prev].slice(0, 20));
      } catch(err) {}
    });
    
    // Also trigger a reconnect manually to fetch initial full state in case we missed events
    fetch(`/api/events/${operatorSession.eventCode}/reconnect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operatorSecret: operatorSession.operatorSecret })
    }).then(res => res.json()).then(data => {
      if (data.endTimestamp) setEndTimestamp(data.endTimestamp);
      if (data.leaderboard) setLeaderboard(data.leaderboard);
      // activity logs aren't strictly returned in reconnect by default but we will get them over SSE
    }).catch(() => {});

    return () => es.close();
  }, [operatorSession]);

  useEffect(() => {
    if (!endTimestamp) return;
    
    const updateTimer = () => {
      const remaining = Math.max(0, Math.floor((endTimestamp - Date.now()) / 1000));
      setSecondsLeft(remaining);
    };
    
    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [endTimestamp]);

  const handleControl = async (action: string) => {
    if (!operatorSession) return;
    try {
      await fetch(`/api/events/${operatorSession.eventCode}/control`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operatorSecret: operatorSession.operatorSecret, action })
      });
    } catch(err) {
      console.error(err);
    }
  };

  const handleExport = () => {
    if (!operatorSession) return;
    window.open(`/api/events/${operatorSession.eventCode}/export?operatorSecret=${operatorSession.operatorSecret}`, "_blank");
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (loading) return <div className="min-h-screen bg-surface p-8">Loading dashboard...</div>;
  
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

  const joinUrl = `${window.location.origin}/join?code=${operatorSession.eventCode}`;
  const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(joinUrl)}&bgcolor=ffffff&color=000000`;

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col md:flex-row font-body-md overflow-x-hidden">
      {/* Reusable Shared Admin Sidebar Component */}
      <AdminSidebar
        mode="operator"
        activeKey={activeTab === "feed" ? "feed" : activeTab === "qr" ? "qr" : "setup"}
        onTabSelect={(tab) => setActiveTab(tab)}
      />

      {/* Main Display Area */}
      <div className="flex-1 flex flex-col min-h-screen p-margin-mobile md:p-margin-desktop overflow-y-auto">
        {/* Standardized Header Section matching all other Admin Pages */}
        <div className="flex items-end justify-between border-b-4 border-on-surface pb-stack-sm mb-stack-lg">
          <div>
            <span className="inline-block px-3 py-1 bg-tertiary-fixed text-on-tertiary-fixed border-2 border-on-surface font-label-bold text-label-bold uppercase mb-2 pop-shadow transform -rotate-2">
              {activeTab === "feed" ? "Live Broadcast Mode" : "Event Access Code"}
            </span>
            <h2 className="font-display-lg text-display-lg text-on-surface uppercase leading-none md:text-[80px]">
              {activeTab === "feed" ? "Active Live Feed" : "QR Code Display"}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-primary text-on-primary border-4 border-on-surface px-4 py-2 flex items-center gap-2 pop-shadow">
              <span className="material-symbols-outlined text-[24px]">timer</span>
              <span className="font-headline-md text-xl">{formatTime(secondsLeft)}</span>
            </div>
            <div className="hidden md:block w-24 h-24 relative">
              <img
                alt="Campus Mascot Sticker"
                className="absolute inset-0 w-full h-full object-contain transform rotate-6 drop-shadow-md"
                src="/images/mascot-bulldog.png"
              />
            </div>
          </div>
        </div>

        <main className="flex-grow flex flex-col">
          {activeTab === "feed" && (
            <div className="flex-grow flex flex-col xl:flex-row gap-gutter h-full min-h-[600px]">
              {/* Left Column: Activity Feed */}
              <section className="flex-1 flex flex-col border-4 border-on-surface bg-surface-lowest pop-shadow-lg p-6">
                <div className="border-b-4 border-on-surface pb-4 mb-6">
                  <h2 className="font-headline-lg text-headline-lg uppercase text-primary">LATEST MOVES</h2>
                </div>
                <div className="flex-grow overflow-y-auto space-y-4 pr-2">
                  {activityFeed.length === 0 ? (
                    <p className="text-on-surface-variant p-4 italic">No activity yet. Game starting soon...</p>
                  ) : (
                    activityFeed.map((act, i) => (
                      <div key={i} className={`flex items-start gap-4 p-4 border-4 border-on-surface pop-shadow ${act.type === 'system' ? 'bg-primary text-on-primary' : 'bg-surface-bright text-on-surface'}`}>
                        <div className={`w-12 h-12 flex items-center justify-center font-headline-md text-headline-md border-2 border-on-surface flex-shrink-0 ${act.type === 'system' ? 'bg-on-primary text-primary' : 'bg-tertiary text-on-tertiary'}`}>
                          {act.type === 'system' ? '!' : (act.playerName?.[0]?.toUpperCase() || 'P')}
                        </div>
                        <div className="flex-grow">
                          <p className={`font-label-bold text-label-bold uppercase tracking-widest mb-1 ${act.type === 'system' ? 'text-on-primary-container' : 'text-on-surface-variant'}`}>
                            {new Date(act.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {act.type === 'system' ? 'System' : 'Game'}
                          </p>
                          <p className={`font-body-lg text-body-lg ${act.type === 'system' ? 'text-on-primary' : 'text-on-surface'}`}>
                            {act.type === 'system' ? (
                              act.message
                            ) : (
                              <><span className="font-bold">{act.playerName}</span> claimed "{act.squareLabel}"</>
                            )}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* Middle Column: Giant Countdown Timer */}
              <section className="w-full xl:w-96 flex flex-col border-4 border-on-surface bg-surface-lowest pop-shadow-lg p-6 justify-between items-center text-center">
                <div className="w-full border-b-4 border-on-surface pb-4 mb-6">
                  <h2 className="font-headline-lg text-headline-lg uppercase text-secondary">TIME REMAINING</h2>
                </div>
                <div className="my-auto py-8">
                  <div className={`font-display-lg text-[72px] xl:text-[96px] tracking-tighter leading-none font-bold ${secondsLeft > 60 ? 'text-primary' : secondsLeft > 30 ? 'text-tertiary' : 'text-secondary animate-pulse'}`}>
                    {formatTime(secondsLeft)}
                  </div>
                  <p className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-widest mt-4">
                    {secondsLeft === 0 ? "Time's Up!" : "Rally Event Active"}
                  </p>
                </div>
                <div className="w-full pt-6 border-t-4 border-on-surface flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-2 w-full">
                    <button
                      onClick={() => handleControl('pause')}
                      className="bg-surface text-on-surface border-4 border-on-surface pop-shadow-sm hover:bg-surface-variant font-label-bold uppercase py-3"
                    >
                      PAUSE
                    </button>
                    <button
                      onClick={() => handleControl('resume')}
                      className="bg-primary text-on-primary border-4 border-on-surface pop-shadow-sm hover:bg-primary-container font-label-bold uppercase py-3"
                    >
                      RESUME
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      if (window.confirm("Are you sure you want to end the game?")) {
                        handleControl('end');
                      }
                    }}
                    className="w-full bg-secondary text-on-secondary font-headline-md text-headline-md uppercase py-4 border-4 border-on-surface pop-shadow hover:bg-secondary-container transition-all cursor-pointer mt-2"
                  >
                    END GAME
                  </button>
                  <button
                    onClick={handleExport}
                    className="w-full bg-tertiary text-on-tertiary font-headline-md text-headline-md uppercase py-4 border-4 border-on-surface pop-shadow hover:bg-tertiary-container transition-all cursor-pointer mt-2"
                  >
                    EXPORT CSV
                  </button>
                </div>
              </section>

              {/* Right Column: Live Leaderboard */}
              <section className="w-full xl:w-80 flex flex-col border-4 border-on-surface bg-surface-lowest pop-shadow-lg p-6">
                <div className="border-b-4 border-on-surface pb-4 mb-6">
                  <h2 className="font-headline-lg text-headline-lg uppercase text-tertiary">LEADERBOARD</h2>
                </div>
                <div className="space-y-4 flex-grow overflow-y-auto">
                  {leaderboard.length === 0 ? (
                    <p className="text-on-surface-variant italic p-2">No players on the board yet.</p>
                  ) : (
                    leaderboard.slice(0, 10).map((p, idx) => (
                      <div key={p.id || idx} className={`flex items-center justify-between p-3 border-2 border-on-surface pop-shadow ${idx === 0 ? 'bg-tertiary-fixed text-on-tertiary-fixed' : 'bg-surface-container'}`}>
                        <span className={`font-headline-md text-headline-md ${idx === 0 ? 'text-on-tertiary-fixed' : ''}`}>#{idx + 1} {p.name}</span>
                        <span className="font-bold text-sm bg-surface text-on-surface px-2 py-0.5 border border-on-surface">{p.score || 0}/25</span>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          )}

          {/* QR Code Tab View */}
          {activeTab === "qr" && (
            <div className="flex-grow flex flex-col items-center justify-center border-4 border-on-surface bg-surface p-8 pop-shadow-lg text-center max-w-2xl mx-auto my-auto">
              <span className="bg-tertiary-fixed text-on-tertiary-fixed border-2 border-on-surface px-4 py-1 font-label-bold text-sm uppercase mb-4 pop-shadow">
                Projector Mode Entry
              </span>
              <h2 className="font-display-lg text-display-lg uppercase text-primary mb-2">
                SCAN TO JOIN RALLY
              </h2>
              <p className="font-body-lg text-body-lg text-on-surface mb-6">
                Scan with your phone camera or visit <span className="font-bold underline text-primary">{joinUrl}</span>
              </p>

              {/* Big Screen QR Code Image */}
              <div className="border-8 border-on-surface p-6 bg-white pop-shadow-lg mb-6 max-w-xs">
                <img
                  src={qrImgUrl}
                  alt="Rally Join QR Code"
                  className="w-64 h-64 object-contain"
                />
              </div>

              <div className="bg-secondary-fixed border-4 border-on-surface p-4 pop-shadow text-center w-full max-w-sm">
                <span className="font-label-bold text-xs uppercase text-secondary block">Rally Access Code:</span>
                <span className="font-display-lg text-4xl text-on-surface tracking-widest font-bold">{operatorSession.eventCode}</span>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
