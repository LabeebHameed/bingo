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

    // Initial fetch of full operator game state
    fetch(`/api/events/${operatorSession.eventCode}/reconnect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operatorSecret: operatorSession.operatorSecret })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.endTimestamp) setEndTimestamp(data.endTimestamp);
        if (data.leaderboard) setLeaderboard(data.leaderboard);
        if (data.activityFeed) setActivityFeed(data.activityFeed.slice(0, 8));
        if (data.timer?.remainingSeconds !== undefined) setSecondsLeft(data.timer.remainingSeconds);
      })
      .catch(() => {});

    const es = new EventSource(`/api/sse/${operatorSession.eventCode}`);

    const handleSSEMessage = (type: string, data: any) => {
      const payload = data.payload || data;
      if (type === "game_started" || type === "timer_tick") {
        if (payload.endTimestamp) setEndTimestamp(payload.endTimestamp);
        if (payload.remainingSeconds !== undefined) setSecondsLeft(payload.remainingSeconds);
      }
      if (type === "leaderboard_update") {
        if (payload.leaderboard) setLeaderboard(payload.leaderboard);
      }
      if (type === "activity_feed") {
        if (payload.activity) {
          setActivityFeed((prev) => [payload.activity, ...prev].slice(0, 8));
        } else if (payload.message) {
          setActivityFeed((prev) => [payload, ...prev].slice(0, 8));
        }
      }
    };

    es.addEventListener("game_started", (e) => {
      try { handleSSEMessage("game_started", JSON.parse(e.data)); } catch (err) {}
    });

    es.addEventListener("timer_tick", (e) => {
      try { handleSSEMessage("timer_tick", JSON.parse(e.data)); } catch (err) {}
    });

    es.addEventListener("leaderboard_update", (e) => {
      try { handleSSEMessage("leaderboard_update", JSON.parse(e.data)); } catch (err) {}
    });

    es.addEventListener("activity_feed", (e) => {
      try { handleSSEMessage("activity_feed", JSON.parse(e.data)); } catch (err) {}
    });

    es.onmessage = (e) => {
      try {
        const parsed = JSON.parse(e.data);
        if (parsed.type) handleSSEMessage(parsed.type, parsed);
      } catch (err) {}
    };

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

  const handleControl = async (action: "pause" | "resume" | "end") => {
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
      <AdminSidebar
        mode="operator"
        activeKey={activeTab === "feed" ? "feed" : activeTab === "qr" ? "qr" : "setup"}
        onTabSelect={(tab) => setActiveTab(tab)}
      />

      <div className="flex-1 flex flex-col min-h-screen p-margin-mobile md:p-margin-desktop overflow-y-auto">
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
              <section className="flex-1 flex flex-col border-4 border-on-surface bg-surface-lowest pop-shadow-lg p-6 max-h-[640px]">
                <div className="border-b-4 border-on-surface pb-4 mb-4 flex justify-between items-center">
                  <h2 className="font-headline-lg text-headline-lg uppercase text-primary">LATEST MOVES</h2>
                  <span className="font-label-bold text-xs uppercase bg-tertiary-fixed text-on-tertiary-fixed px-2 py-0.5 border border-on-surface">MAX 8 RECENT</span>
                </div>
                <div className="flex-grow overflow-y-auto space-y-3 pr-2 max-h-[500px]">
                  {activityFeed.length === 0 ? (
                    <p className="text-on-surface-variant p-4 italic">No activity yet. Game starting soon...</p>
                  ) : (
                    activityFeed.map((act, i) => {
                      const name = act.participantName || act.playerName || act.name || "Player";
                      const letter = (name[0] || "P").toUpperCase();
                      const messageText = act.message || `${name} completed "${act.targetName || act.squareLabel || 'Square'}"!`;
                      const isSystem = act.type === "system";

                      return (
                        <div key={i} className={`flex items-start gap-4 p-3 border-4 border-on-surface pop-shadow ${isSystem ? 'bg-primary text-on-primary' : 'bg-surface-bright text-on-surface'}`}>
                          <div className={`w-10 h-10 flex items-center justify-center font-headline-md text-headline-md border-2 border-on-surface flex-shrink-0 ${isSystem ? 'bg-on-primary text-primary' : 'bg-tertiary text-on-tertiary'}`}>
                            {isSystem ? '!' : letter}
                          </div>
                          <div className="flex-grow">
                            <p className={`font-label-bold text-xs uppercase tracking-widest mb-0.5 ${isSystem ? 'text-on-primary-container' : 'text-on-surface-variant'}`}>
                              {new Date(act.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {isSystem ? 'System' : 'Game'}
                            </p>
                            <p className={`font-body-md text-sm ${isSystem ? 'text-on-primary' : 'text-on-surface'}`}>
                              {messageText}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>

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
                    <button onClick={() => handleControl('pause')} className="bg-surface text-on-surface border-4 border-on-surface pop-shadow-sm hover:bg-surface-variant font-label-bold uppercase py-3">PAUSE</button>
                    <button onClick={() => handleControl('resume')} className="bg-primary text-on-primary border-4 border-on-surface pop-shadow-sm hover:bg-primary-container font-label-bold uppercase py-3">RESUME</button>
                  </div>
                  <button onClick={() => { if (window.confirm("End game?")) handleControl('end'); }} className="w-full bg-secondary text-on-secondary font-headline-md text-headline-md uppercase py-4 border-4 border-on-surface pop-shadow hover:bg-secondary-container transition-all cursor-pointer mt-2">END GAME</button>
                  <button onClick={handleExport} className="w-full bg-tertiary text-on-tertiary font-headline-md text-headline-md uppercase py-4 border-4 border-on-surface pop-shadow hover:bg-tertiary-container transition-all cursor-pointer mt-2">EXPORT CSV</button>
                </div>
              </section>

              <section className="w-full xl:w-80 flex flex-col border-4 border-on-surface bg-surface-lowest pop-shadow-lg p-6 max-h-[640px]">
                <div className="border-b-4 border-on-surface pb-4 mb-6">
                  <h2 className="font-headline-lg text-headline-lg uppercase text-tertiary">LEADERBOARD</h2>
                </div>
                <div className="space-y-3 flex-grow overflow-y-auto pr-1">
                  {leaderboard.length === 0 ? (
                    <p className="text-on-surface-variant italic p-2">No players on the board yet.</p>
                  ) : (
                    leaderboard.slice(0, 10).map((p, idx) => {
                      const isFiveOfFive = (p.completedLines || 0) >= 5 || (p.completedSquares || 0) >= 25;
                      return (
                        <div key={p.id || idx} className={`flex items-center justify-between p-3 border-2 border-on-surface pop-shadow ${isFiveOfFive ? 'bg-green-600 text-white font-bold border-green-950' : idx === 0 ? 'bg-tertiary-fixed text-on-tertiary-fixed' : 'bg-surface-container'}`}>
                          <div className="flex flex-col">
                            <span className={`font-headline-md text-headline-md ${isFiveOfFive ? 'text-white' : idx === 0 ? 'text-on-tertiary-fixed' : ''}`}>#{idx + 1} {p.nickname || p.name}</span>
                            <span className={`text-[10px] font-label-bold uppercase ${isFiveOfFive ? 'text-green-100' : 'opacity-75'}`}>{p.completedSquares || 0}/25 STAMPED</span>
                          </div>
                          <span className={`font-bold text-sm px-2.5 py-1 border-2 border-on-surface pop-shadow-sm ${isFiveOfFive ? 'bg-green-400 text-green-950 animate-bounce font-black' : 'bg-surface text-on-surface'}`} title="5-in-a-row BINGO lines">
                            {isFiveOfFive ? '🏆 5/5 BINGO!' : `${p.completedLines || 0}/5 LINES`}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            </div>
          )}

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
