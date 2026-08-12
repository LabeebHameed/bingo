"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGame } from "../context/GameContext";
import { startCamera, stopCamera, captureFrame, checkCameraPermission } from "../utils/camera";
import { compressImage } from "../utils/imageCompressor";
function triggerConfetti() {
  if (typeof window === "undefined") return;
  try {
    const canvas = document.createElement("canvas");
    canvas.style.position = "fixed";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100vw";
    canvas.style.height = "100vh";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "99999";
    document.body.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: { x: number; y: number; vx: number; vy: number; color: string; size: number; alpha: number }[] = [];
    const colors = ["#ff0055", "#00e5ff", "#ffcc00", "#ff3399", "#00ff66"];

    for (let i = 0; i < 80; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.7) * 14,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        alpha: 1,
      });
    }

    const startTime = Date.now();
    function animate() {
      const elapsed = Date.now() - startTime;
      if (elapsed > 2000) {
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
        return;
      }
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.3;
        p.alpha -= 0.015;
        if (ctx) {
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fillStyle = p.color;
          ctx.fillRect(p.x, p.y, p.size, p.size);
          ctx.restore();
        }
      }
      requestAnimationFrame(animate);
    }
    animate();
  } catch (e) {}
}

interface Square {
  id: number;
  label: string;
  task: string;
  completed: boolean;
  photoUrl?: string;
  isFree?: boolean;
}

const WINNING_LINES = [
  [0, 1, 2, 3, 4], [5, 6, 7, 8, 9], [10, 11, 12, 13, 14], [15, 16, 17, 18, 19], [20, 21, 22, 23, 24],
  [0, 5, 10, 15, 20], [1, 6, 11, 16, 21], [2, 7, 12, 17, 22], [3, 8, 13, 18, 23], [4, 9, 14, 19, 24],
  [0, 6, 12, 18, 24], [4, 8, 12, 16, 20],
];

export default function BingoGridPage() {
  const router = useRouter();
  const { session, myCard, gameEvent, connectionStatus } = useGame();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [activeSquare, setActiveSquare] = useState<Square | null>(null);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [answer, setAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [cameraStatus, setCameraStatus] = useState<'idle' | 'requesting' | 'active' | 'denied' | 'error'>('idle');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const [localSquares, setLocalSquares] = useState<Square[]>([]);

  useEffect(() => {
    if (!session) {
      router.push("/join");
    } else if (gameEvent?.status === "lobby") {
      router.push(`/lobby?code=${session.eventCode}`);
    }
  }, [session, gameEvent, router]);

  useEffect(() => {
    if (gameEvent?.status === "ended") {
      router.push("/rewards"); // Ensure we have a rewards page, or gracefully handle
    }
  }, [gameEvent, router]);

  useEffect(() => {
    if (myCard?.squares) {
      setLocalSquares(myCard.squares as Square[]);
    }
  }, [myCard]);

  // Clean up camera on unmount
  useEffect(() => {
    return () => stopCamera(streamRef.current);
  }, []);

  const countCompletedLines = (squaresList: Square[]) => {
    let count = 0;
    for (const line of WINNING_LINES) {
      if (line.every((index) => squaresList[index]?.completed)) {
        count++;
      }
    }
    return count;
  };

  const completedLinesCount = countCompletedLines(localSquares);

  const handleSquareClick = (sq: Square) => {
    if (sq.isFree) return;
    setActiveSquare(sq);
    setCapturedPhotoUrl(sq.photoUrl || null);
    setCapturedBlob(null);
    setAnswer("");
    setCameraStatus('idle');
  };

  const handleStartCamera = async () => {
    setCameraStatus('requesting');
    try {
      const status = await checkCameraPermission();
      if (status === 'denied') {
        setCameraStatus('denied');
        return;
      }
      if (videoRef.current) {
        const stream = await startCamera(videoRef.current, facingMode);
        streamRef.current = stream;
        setCameraStatus('active');
      }
    } catch (e) {
      console.error(e);
      setCameraStatus('error');
    }
  };

  const handleToggleFacingMode = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    if (cameraStatus === 'active') {
      handleStartCamera();
    }
  };

  const handleSnapPhoto = async () => {
    if (videoRef.current && cameraStatus === 'active') {
      try {
        const blob = await captureFrame(videoRef.current);
        const url = URL.createObjectURL(blob);
        setCapturedPhotoUrl(url);
        setCapturedBlob(blob);
        stopCamera(streamRef.current);
        streamRef.current = null;
        setCameraStatus('idle');
      } catch (e) {
        console.error('Snap failed', e);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file);
        const url = URL.createObjectURL(compressed);
        setCapturedPhotoUrl(url);
        setCapturedBlob(compressed);
        if (streamRef.current) {
          stopCamera(streamRef.current);
          streamRef.current = null;
          setCameraStatus('idle');
        }
      } catch (err) {
        console.error('File process failed', err);
      }
    }
  };

  const handleSaveSelfie = async () => {
    if (!activeSquare || !session) return;
    if (!capturedBlob && !capturedPhotoUrl) return; // Need photo

    setIsSubmitting(true);
    try {
      let finalUrl = capturedPhotoUrl;
      
      // If it's a new upload, send it
      if (capturedBlob) {
        const formData = new FormData();
        formData.append("file", capturedBlob, "selfie.jpg");
        const uploadRes = await fetch("/api/upload-selfie", {
          method: "POST",
          body: formData,
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          finalUrl = uploadData.url;
        }
      }

      const res = await fetch(`/api/events/${session.eventCode}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId: session.participantId,
          sessionToken: session.sessionToken,
          squareId: activeSquare.id,
          photoUrl: finalUrl,
          answer: answer
        }),
      });

      if (res.ok) {
        const prevLines = completedLinesCount;
        
        // Optimistic UI update
        setLocalSquares((prev) =>
          prev.map((s) =>
            s.id === activeSquare.id ? { ...s, completed: true, photoUrl: finalUrl || "" } : s
          )
        );

        // Check if line completed
        setTimeout(() => {
          const newSquares = localSquares.map((s) =>
            s.id === activeSquare.id ? { ...s, completed: true, photoUrl: finalUrl || "" } : s
          );
          if (countCompletedLines(newSquares) > prevLines) {
            triggerConfetti();
          }
        }, 100);

        setActiveSquare(null);
      } else {
        alert("Submission failed. Try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Submission failed. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    stopCamera(streamRef.current);
    streamRef.current = null;
    setActiveSquare(null);
  };

  if (!session) return null;

  if (localSquares.length === 0) {
    return (
      <div className="bg-background text-on-background min-h-screen flex flex-col items-center justify-center p-margin-mobile text-center font-body-md">
        <div className="bg-surface border-4 border-on-surface p-8 pop-shadow-lg max-w-sm w-full flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full border-4 border-on-surface bg-primary text-on-primary flex items-center justify-center pop-shadow animate-pulse">
            <span className="material-symbols-outlined text-3xl font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>
              grid_view
            </span>
          </div>
          <h2 className="font-headline-lg text-headline-lg uppercase text-on-surface">Loading Bingo Card...</h2>
          <p className="font-body-md text-secondary text-sm font-bold">
            Syncing your unique 5x5 card with the event server.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-body-md selection:bg-primary-container selection:text-on-primary-container pb-28">
      {/* Top Header */}
      <header className="bg-surface w-full top-0 sticky border-b-4 border-on-surface shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-40">
        <div className="flex justify-between items-center px-margin-mobile md:px-margin-desktop py-base w-full max-w-[1280px] mx-auto">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full border-2 border-on-surface ${connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <h1 className="font-display-lg-mobile text-display-lg-mobile text-primary tracking-tighter uppercase ml-2">
              CAMPUS RALLY
            </h1>
          </div>
          <Link
            href="/"
            className="bg-primary text-on-primary border-2 border-on-surface px-3 py-1 font-label-bold text-xs uppercase pop-shadow hover:bg-primary-container"
          >
            ← Exit
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-[640px] mx-auto w-full p-margin-mobile flex flex-col gap-4">
        {/* Game Stats Header */}
        <div className="bg-secondary-fixed border-4 border-on-surface p-4 pop-shadow flex justify-between items-center">
          <div>
            <span className="font-label-bold text-xs uppercase text-secondary">Step 3 of 3: Active Card</span>
            <h2 className="font-headline-md text-headline-md uppercase text-on-surface">
              {completedLinesCount}/5 STAMPED
            </h2>
          </div>
          <div className="bg-surface border-2 border-on-surface px-3 py-1 font-label-bold text-xs uppercase pop-shadow text-primary font-bold">
            {completedLinesCount} Line{completedLinesCount === 1 ? "" : "s"} Completed
          </div>
        </div>

        {/* B I N G O Letter Highlight Tracker */}
        <div className="w-full bg-surface border-4 border-on-surface p-3 pop-shadow flex flex-col items-center gap-2">
          <div className="flex justify-between items-center w-full">
            <span className="font-label-bold text-xs uppercase text-secondary">
              BINGO Letters Unlocked:
            </span>
            {completedLinesCount > 0 && (
              <span className="bg-primary text-on-primary px-2 py-0.5 font-label-bold text-xs uppercase border border-on-surface pop-shadow animate-pulse">
                {completedLinesCount >= 5 ? "FULL BINGO!" : `${completedLinesCount} BINGO LINE!`}
              </span>
            )}
          </div>

          <div className="flex justify-between items-center w-full gap-2 pt-1">
            {["B", "I", "N", "G", "O"].map((letter, idx) => {
              const isLit = completedLinesCount > idx;
              return (
                <div
                  key={letter}
                  className={`flex-1 aspect-square max-w-[64px] border-4 border-on-surface flex items-center justify-center font-display-lg text-2xl sm:text-3xl transition-all duration-300 ${
                    isLit
                      ? "bg-tertiary-fixed text-on-tertiary-fixed font-bold pop-shadow scale-105 border-on-surface"
                      : "bg-surface-variant text-on-surface-variant/40 border-on-surface/40"
                  }`}
                >
                  {letter}
                </div>
              );
            })}
          </div>
        </div>

        {/* Clean Uniform 5x5 Bingo Grid */}
        <div className="grid grid-cols-5 gap-1.5 md:gap-2 bg-surface-container border-4 border-on-surface p-2 md:p-3 pop-shadow-lg">
          {localSquares.map((sq) => {
            if (sq.isFree) {
              return (
                <div
                  key={sq.id}
                  className="aspect-square w-full h-full bg-tertiary-fixed text-on-tertiary-fixed border-2 md:border-4 border-on-surface p-1 flex flex-col items-center justify-center text-center pop-shadow-sm select-none relative overflow-hidden"
                >
                  <span className="font-headline-md text-xs sm:text-base uppercase leading-none font-bold">
                    FREE
                  </span>
                </div>
              );
            }

            return (
              <button
                key={sq.id}
                type="button"
                onClick={() => handleSquareClick(sq)}
                className={`aspect-square w-full h-full border-2 md:border-4 border-on-surface p-1 sm:p-2 flex flex-col items-center justify-center text-center cursor-pointer transition-all relative overflow-hidden select-none active:scale-95 pop-shadow-sm ${
                  sq.completed && !sq.photoUrl
                    ? "bg-primary text-on-primary"
                    : "bg-surface hover:bg-surface-variant text-on-surface"
                }`}
              >
                {sq.photoUrl ? (
                  <>
                    <img
                      src={sq.photoUrl}
                      alt={sq.label}
                      className="absolute inset-0 w-full h-full object-cover z-0"
                    />
                    <div className="absolute inset-0 bg-black/40 z-10"></div>
                    <span
                      className="material-symbols-outlined text-white text-base sm:text-xl absolute top-1 right-1 z-20 drop-shadow font-bold"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      check_circle
                    </span>
                    <span className="font-label-bold text-[9px] sm:text-[11px] leading-tight uppercase text-white font-bold drop-shadow z-20 line-clamp-2 w-full text-center px-1 mt-auto mb-1">
                      {sq.label}
                    </span>
                  </>
                ) : (
                  <>
                    {sq.completed && (
                      <span
                        className="material-symbols-outlined text-on-primary text-base sm:text-xl absolute top-1 right-1 font-bold z-20"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        check_circle
                      </span>
                    )}
                    <span
                      className={`font-label-bold text-[10px] sm:text-[13px] leading-tight uppercase font-bold w-full text-center px-0.5 line-clamp-3 break-words ${
                        sq.completed ? "text-on-primary" : "text-on-surface"
                      }`}
                    >
                      {sq.label}
                    </span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </main>

      {/* Bingo Task & Selfie Modal Popup */}
      {activeSquare && (
        <div className="fixed inset-0 bg-on-background/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-surface border-4 border-on-surface p-6 max-w-sm w-full pop-shadow-lg flex flex-col gap-4 relative mt-auto mb-auto">
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 border-2 border-on-surface bg-primary text-on-primary w-8 h-8 font-bold flex items-center justify-center pop-shadow cursor-pointer z-50"
            >
              ✕
            </button>

            <div className="border-b-4 border-on-surface pb-3 pt-2">
              <span className="bg-tertiary-fixed text-on-tertiary-fixed border border-on-surface px-2 py-0.5 font-label-bold text-xs uppercase inline-block mb-1">
                BINGO TASK #{activeSquare.id}
              </span>
              <h3 className="font-headline-md text-headline-md uppercase text-on-surface">
                {activeSquare.label}
              </h3>
            </div>

            <div className="bg-surface-container-lowest border-4 border-on-surface p-4 pop-shadow flex flex-col gap-2">
              <span className="font-label-bold text-xs uppercase text-primary font-bold">Task:</span>
              <p className="font-body-lg text-body-lg text-on-surface font-bold leading-snug">
                {activeSquare.task}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-label-bold text-xs uppercase text-on-surface font-bold">Your Answer (optional)</label>
              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type answer here..."
                className="w-full border-4 border-on-surface bg-surface-container-lowest p-3 font-body-md focus:outline-none"
              />
            </div>

            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />

            <div className="flex flex-col gap-3">
              <span className="font-label-bold text-xs uppercase text-on-surface font-bold">Proof (Selfie)</span>

              {/* Keep video element in DOM unconditionally so videoRef is never null when starting camera */}
              <div className={`relative w-full h-48 border-4 border-on-surface pop-shadow overflow-hidden bg-black ${capturedPhotoUrl || cameraStatus === 'active' ? 'block' : 'hidden'}`}>
                {capturedPhotoUrl ? (
                  <>
                    <img src={capturedPhotoUrl} alt="Captured Selfie" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setCapturedPhotoUrl(null);
                        setCapturedBlob(null);
                        setCameraStatus('idle');
                      }}
                      className="absolute top-2 right-2 bg-primary text-on-primary text-xs font-label-bold px-2 py-1 border border-on-surface uppercase cursor-pointer z-30"
                    >
                      Retake
                    </button>
                  </>
                ) : (
                  <>
                    <video ref={videoRef} playsInline autoPlay muted className="w-full h-full object-cover transform scale-x-[-1]" />
                    <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-4 z-30">
                      <button type="button" onClick={handleToggleFacingMode} className="bg-surface p-2 border-2 border-on-surface rounded-full cursor-pointer">
                        <span className="material-symbols-outlined">flip_camera_ios</span>
                      </button>
                      <button type="button" onClick={handleSnapPhoto} className="bg-primary text-on-primary px-4 py-2 border-2 border-on-surface font-label-bold uppercase cursor-pointer pop-shadow">
                        Snap Photo 📸
                      </button>
                    </div>
                  </>
                )}
              </div>

              {!capturedPhotoUrl && cameraStatus !== 'active' && (
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleStartCamera}
                    className="w-full bg-primary text-on-primary border-4 border-on-surface p-4 font-headline-md text-headline-md uppercase pop-shadow hover:bg-primary-container cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-2xl">photo_camera</span>
                    <span>{cameraStatus === 'requesting' ? 'OPENING CAMERA...' : 'TAKE SELFIE NOW'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-surface text-secondary border-4 border-on-surface p-2 font-label-bold text-xs uppercase cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">upload_file</span>
                    <span>Upload from gallery</span>
                  </button>
                  {cameraStatus === 'denied' && (
                    <p className="text-red-500 font-label-bold text-xs text-center">Camera permission denied. Use upload option above.</p>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleSaveSelfie}
              disabled={!capturedPhotoUrl || isSubmitting}
              className="w-full bg-tertiary-fixed text-on-tertiary-fixed border-4 border-on-surface py-4 font-headline-md text-headline-md uppercase pop-shadow hover:bg-tertiary-fixed-dim cursor-pointer flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:pointer-events-none"
            >
              <span className="material-symbols-outlined text-2xl">check_circle</span>
              <span>{isSubmitting ? "STAMPING..." : "STAMP BINGO SQUARE ✨"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t-4 border-on-surface p-2 shadow-[0px_-4px_0px_0px_rgba(0,0,0,1)] z-40 flex justify-around items-center">
        <Link
          href="/bingo"
          className="flex flex-col items-center text-primary font-label-bold text-xs uppercase"
        >
          <span
            className="material-symbols-outlined text-2xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            grid_view
          </span>
          <span>CARD</span>
        </Link>
        <Link
          href="/rank"
          className="flex flex-col items-center text-secondary font-label-bold text-xs uppercase hover:text-primary"
        >
          <span className="material-symbols-outlined text-2xl">leaderboard</span>
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
