"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminSidebar from "../components/AdminSidebar";

export default function AdminLaunchPage() {
  const router = useRouter();
  const [joinedList, setJoinedList] = useState<any[]>([]);
  const [operatorSession, setOperatorSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [copied, setCopied] = useState(false);

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
    
    es.addEventListener("lobby_update", (e) => {
      try {
        const data = JSON.parse(e.data);
        setJoinedList(data.participants || []);
      } catch(err) {}
    });

    return () => es.close();
  }, [operatorSession]);

  const handleRemove = async (id: string) => {
    if (!operatorSession) return;
    try {
      await fetch(`/api/events/${operatorSession.eventCode}/kick`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operatorSecret: operatorSession.operatorSecret,
          participantId: id,
        }),
      });
      // The SSE should push an updated roster automatically
    } catch(err) {
      console.error("Failed to remove participant", err);
    }
  };

  const handleStart = async () => {
    if (!operatorSession) return;
    setIsStarting(true);
    try {
      // Load any config overrides from localStorage
      const configOverride = localStorage.getItem("operator_config");
      const gridOverride = localStorage.getItem("operator_grid_config");
      
      let payload = { operatorSecret: operatorSession.operatorSecret } as any;
      
      if (configOverride) {
        Object.assign(payload, JSON.parse(configOverride));
      }
      if (gridOverride) {
        payload.gridConfig = JSON.parse(gridOverride);
      }

      const res = await fetch(`/api/events/${operatorSession.eventCode}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push("/admin/dashboard");
      } else {
        alert("Failed to start event");
        setIsStarting(false);
      }
    } catch(err) {
      console.error(err);
      setIsStarting(false);
    }
  };

  const joinUrl = operatorSession ? `${window.location.origin}/join?code=${operatorSession.eventCode}` : "";
  const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(joinUrl)}&bgcolor=ffffff&color=000000`;

  const copyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="min-h-screen bg-surface p-8">Loading...</div>;
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
      <AdminSidebar mode="wizard" activeKey="launch" />

      <main className="flex-grow flex flex-col p-margin-mobile md:p-margin-desktop bg-background overflow-y-auto min-h-screen">
        {/* Consistent Header Section */}
        <div className="flex items-end justify-between border-b-4 border-on-surface pb-stack-sm mb-stack-lg">
          <div>
            <span className="inline-block px-3 py-1 bg-tertiary-fixed text-on-tertiary-fixed border-2 border-on-surface font-label-bold text-label-bold uppercase mb-2 pop-shadow transform -rotate-2">
              Final Launch Lobby
            </span>
            <h2 className="font-display-lg text-display-lg text-on-surface uppercase leading-none md:text-[80px]">
              Ready to Launch
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

        {/* 12-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter max-w-[1280px] w-full flex-1">
          {/* Main Launch Banner & Roster */}
          <div className="lg:col-span-8 flex flex-col justify-between">
            <div className="flex flex-col gap-stack-md">
              {/* Launch Banner */}
              <div className="bg-tertiary-fixed text-on-tertiary-fixed border-4 border-on-surface p-6 pop-shadow flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                  <span className="font-label-bold text-xs uppercase text-on-tertiary-fixed font-bold">
                    PROJECTOR DISPLAY MODE
                  </span>
                  <h3 className="font-headline-lg text-3xl uppercase text-on-tertiary-fixed mt-1">
                    SCAN TO JOIN THE RALLY!
                  </h3>
                  <p className="font-body-lg text-body-lg text-on-tertiary-fixed font-bold">
                    Event Code: <strong className="bg-surface px-2 py-0.5 border border-on-surface text-primary">{operatorSession.eventCode}</strong>
                  </p>
                </div>

                <button
                  onClick={handleStart}
                  disabled={isStarting}
                  className="bg-primary text-on-primary font-headline-lg text-2xl uppercase px-8 py-5 border-4 border-on-surface pop-shadow hover:bg-primary-container cursor-pointer flex items-center gap-3 disabled:opacity-50"
                >
                  {isStarting ? "STARTING..." : "START GAME NOW!"}
                  <span className="material-symbols-outlined text-3xl">play_circle</span>
                </button>
              </div>

              {/* Roster */}
              <div className="bg-surface-container-low border-4 border-on-surface p-6 pop-shadow flex flex-col gap-stack-sm">
                <div className="flex justify-between items-center border-b-4 border-on-surface pb-3">
                  <h3 className="font-headline-md text-headline-md uppercase text-on-surface">
                    JOINED PARTICIPANTS ({joinedList.length})
                  </h3>
                  <span className="bg-primary text-on-primary px-3 py-1 font-label-bold text-xs uppercase border-2 border-on-surface">
                    READY TO START
                  </span>
                </div>

                {joinedList.length === 0 ? (
                  <p className="text-center p-8 text-on-surface-variant font-body-md italic">Waiting for participants to join...</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {joinedList.map((p) => (
                      <div
                        key={p.id}
                        className="bg-surface-container-lowest border-2 border-on-surface p-3 flex flex-col items-center text-center gap-2 pop-shadow-sm relative group"
                      >
                        <div className="w-10 h-10 rounded-full border-2 border-on-surface bg-primary text-on-primary flex items-center justify-center font-bold">
                          {p.name?.substring(0, 2).toUpperCase() || "?"}
                        </div>
                        <span className="font-label-bold text-xs text-on-surface font-bold truncate w-full">
                          {p.name}
                        </span>
                        <button
                          onClick={() => handleRemove(p.id)}
                          className="text-[10px] text-primary font-bold hover:underline uppercase"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Consistent Action Bar */}
            <div className="flex justify-between items-center pt-4 pb-8">
              <Link
                href="/admin/rewards-config"
                className="bg-surface border-4 border-on-surface px-6 py-4 font-label-bold text-label-bold uppercase pop-shadow"
              >
                ← Back to Step 4
              </Link>
            </div>
          </div>

          {/* QR Column */}
          <div className="lg:col-span-4 flex flex-col gap-stack-md">
            <div className="bg-surface-container-lowest border-4 border-on-surface p-6 pop-shadow flex flex-col items-center justify-center text-center gap-4">
              <h3 className="font-headline-md text-headline-md uppercase text-on-surface">
                SCAN WITH PHONE CAMERA
              </h3>
              <div 
                className="w-56 h-56 bg-surface border-4 border-on-surface p-2 pop-shadow flex flex-col items-center justify-center relative cursor-pointer hover:scale-105 transition-transform"
                onClick={() => setShowQRModal(true)}
              >
                <img src={qrImgUrl} alt="QR Code" className="w-full h-full object-contain" />
                <span className="font-label-bold text-xs uppercase bg-tertiary-fixed px-2 py-0.5 border border-on-surface absolute bottom-2">
                  {operatorSession.eventCode}
                </span>
              </div>
              <p className="font-body-md text-body-md text-secondary font-bold break-all">
                Direct Link: <span className="underline text-primary">{joinUrl}</span>
              </p>
              <button 
                onClick={copyLink}
                className="bg-surface border-2 border-on-surface px-4 py-2 font-label-bold uppercase text-xs hover:bg-surface-variant transition-colors"
              >
                {copied ? "✓ Copied!" : "Copy Share Link"}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Fullscreen QR Modal */}
      {showQRModal && (
        <div 
          className="fixed inset-0 z-50 bg-background/95 flex flex-col items-center justify-center p-8 backdrop-blur-sm cursor-pointer"
          onClick={() => setShowQRModal(false)}
        >
          <div className="bg-surface border-8 border-on-surface p-8 pop-shadow-lg flex flex-col items-center max-w-2xl w-full text-center">
            <h2 className="font-display-lg text-4xl md:text-6xl uppercase text-primary mb-6">SCAN TO JOIN</h2>
            <img src={qrImgUrl} alt="QR Code Large" className="w-64 h-64 md:w-96 md:h-96 object-contain mb-8 border-4 border-on-surface p-2" />
            <div className="bg-tertiary-fixed border-4 border-on-surface px-8 py-4 mb-4">
              <span className="font-label-bold text-lg uppercase block mb-1">Event Code</span>
              <span className="font-display-lg text-5xl font-bold tracking-widest">{operatorSession.eventCode}</span>
            </div>
            <p className="font-headline-md text-xl">{joinUrl}</p>
            <p className="font-label-bold mt-8 text-on-surface-variant">Click anywhere to close</p>
          </div>
        </div>
      )}
    </div>
  );
}
