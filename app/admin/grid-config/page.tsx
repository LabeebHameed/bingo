"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminSidebar from "../components/AdminSidebar";

interface GridSquare {
  id: number;
  label: string;
  isFree?: boolean;
}

export default function AdminGridConfigPage() {
  const router = useRouter();
  const [missionType, setMissionType] = useState("Selfie Quest");
  const [selectedSquareId, setSelectedSquareId] = useState<number>(13);
  const [operatorSession, setOperatorSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const s = localStorage.getItem("human_bingo_operator");
    if (s) {
      setOperatorSession(JSON.parse(s));
    }
    const savedGrid = localStorage.getItem("operator_grid_config");
    if (savedGrid) {
      try {
        const parsed = JSON.parse(savedGrid);
        if (parsed.squares) {
          setSquares(parsed.squares);
        }
      } catch (e) {}
    }
    setLoading(false);
  }, []);

  const defaultSquareLabels = [
    "Find Someone", "Find Someone", "Find Someone", "Find Someone", "Find Someone",
    "Find Someone", "Find Someone", "Find Someone", "Find Someone", "Find Someone",
    "Find Someone", "Find Someone", "Find Someone", "Find Someone", "Find Someone",
    "Find Someone", "Find Someone", "Find Someone", "Find Someone", "Find Someone",
    "Find Someone", "Find Someone", "Find Someone", "Find Someone", "Find Someone"
  ];

  const [squares, setSquares] = useState<GridSquare[]>(
    defaultSquareLabels.map((label, idx) => ({
      id: idx + 1,
      label: label,
      isFree: false,
    }))
  );

  const selectedSquare = squares.find((s) => s.id === selectedSquareId) || squares[0];

  const handleUpdateSelectedSquare = (newLabel: string) => {
    setSquares((prev) =>
      prev.map((s) => (s.id === selectedSquareId ? { ...s, label: newLabel, isFree: false } : s))
    );
  };

  const handleToggleSelectedFree = (enabled: boolean) => {
    setSquares((prev) =>
      prev.map((s) => {
        if (s.id === selectedSquareId) {
          return {
            ...s,
            isFree: enabled,
            label: enabled ? "FREE" : `Square #${s.id}`,
          };
        }
        // If enabling FREE on selected square, unset FREE on any other squares
        if (enabled) {
          return { ...s, isFree: false };
        }
        return s;
      })
    );
  };
  
  const handleNext = () => {
    localStorage.setItem("operator_grid_config", JSON.stringify({ squares }));
    router.push("/admin/rewards-config");
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
      <AdminSidebar mode="wizard" activeKey="grid" />

      <main className="flex-grow flex flex-col p-margin-mobile md:p-margin-desktop bg-background overflow-y-auto min-h-screen">
        {/* Consistent Header Section */}
        <div className="flex items-end justify-between border-b-4 border-on-surface pb-stack-sm mb-stack-lg">
          <div>
            <span className="inline-block px-3 py-1 bg-tertiary-fixed text-on-tertiary-fixed border-2 border-on-surface font-label-bold text-label-bold uppercase mb-2 pop-shadow transform -rotate-2">
              Step 2 of 3
            </span>
            <h2 className="font-display-lg text-display-lg text-on-surface uppercase leading-none md:text-[80px]">
              Bingo Grid Setup
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
          {/* Setup Controls */}
          <div className="lg:col-span-4 flex flex-col gap-stack-md">
            {/* Grid Config Card */}
            <div className="bg-surface border-4 border-on-surface p-6 pop-shadow flex flex-col gap-4">
              <h3 className="font-headline-md text-headline-md uppercase border-b-4 border-on-surface pb-2 text-on-surface">
                Grid Configuration
              </h3>

              {/* Set Selected Box as FREE Toggle Switch */}
              <div className="flex items-center justify-between border-b-2 border-on-surface/20 pb-3">
                <div className="pr-2">
                  <span className="font-body-md text-body-md font-bold block uppercase">
                    Set Selected Box as FREE
                  </span>
                  <span className="font-body-md text-body-md text-on-surface-variant text-xs">
                    {selectedSquare.isFree
                      ? `Box #${selectedSquare.id} is FREE space`
                      : `Box #${selectedSquare.id} is a task`}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(selectedSquare.isFree)}
                  onChange={(e) => handleToggleSelectedFree(e.target.checked)}
                  className="w-12 h-6 border-4 border-on-surface rounded-full cursor-pointer accent-primary shrink-0"
                />
              </div>

              <div>
                <label className="font-body-md text-body-md font-bold block mb-2 uppercase">Mission Category</label>
                <select
                  value={missionType}
                  onChange={(e) => setMissionType(e.target.value)}
                  className="w-full border-4 border-on-surface p-3 font-body-md text-body-md uppercase cursor-pointer bg-surface"
                >
                  <option>Selfie Quest (Icebreaker)</option>
                  <option>Letter Hunt (Scavenger)</option>
                  <option>QR Scan Rally</option>
                  <option>Custom Campus Tasks</option>
                </select>
              </div>
            </div>

            {/* Active Selected Square Edit Card */}
            <div className="bg-tertiary-fixed border-4 border-on-surface p-6 pop-shadow flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="bg-surface text-on-surface border border-on-surface px-2 py-0.5 font-label-bold text-xs uppercase">
                  Active Selection
                </span>
                {selectedSquare.isFree && (
                  <span className="bg-primary text-on-primary border border-on-surface px-2 py-0.5 font-label-bold text-xs uppercase font-bold animate-pulse">
                    FREE BLOCK
                  </span>
                )}
              </div>

              <h3 className="font-headline-md text-headline-md uppercase text-on-tertiary-fixed border-b-4 border-on-surface pb-2">
                Box #{selectedSquare.id}: {selectedSquare.label}
              </h3>

              {!selectedSquare.isFree ? (
                <div className="flex flex-col gap-2 mt-1">
                  <label className="font-label-bold text-xs uppercase text-on-tertiary-fixed">
                    Edit Box #{selectedSquare.id} Label:
                  </label>
                  <input
                    type="text"
                    value={selectedSquare.label}
                    onChange={(e) => handleUpdateSelectedSquare(e.target.value)}
                    placeholder="Enter task text..."
                    className="w-full border-4 border-on-surface p-3 font-body-md text-body-md bg-surface text-on-surface font-bold"
                  />
                </div>
              ) : (
                <p className="font-body-md text-sm text-on-tertiary-fixed font-bold">
                  This box is currently set as the FREE space. Turn off the &quot;Set Selected Box as FREE&quot; toggle above to edit its text.
                </p>
              )}
            </div>
          </div>

          {/* Bingo Grid Preview with Selected State */}
          <div className="lg:col-span-8 flex flex-col justify-between">
            <div className="bg-secondary-fixed border-4 border-on-surface p-6 pop-shadow flex flex-col">
              <div className="flex justify-between items-center border-b-4 border-on-surface pb-4 mb-6">
                <div>
                  <h3 className="font-headline-md text-headline-md uppercase">Live Grid Preview</h3>
                  <p className="font-label-bold text-xs uppercase text-secondary">
                    Click any box to select and toggle FREE or edit text
                  </p>
                </div>
                <span className="font-label-bold text-label-bold bg-surface border-2 border-on-surface px-3 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  Selected: Box #{selectedSquare.id}
                </span>
              </div>

              {/* 5x5 Grid */}
              <div className="grid grid-cols-5 gap-2">
                {squares.map((sq) => {
                  const isSelected = sq.id === selectedSquareId;

                  return (
                    <button
                      key={sq.id}
                      type="button"
                      onClick={() => setSelectedSquareId(sq.id)}
                      className={`aspect-square border-2 md:border-4 border-on-surface p-1 sm:p-2 flex flex-col items-center justify-center text-center cursor-pointer transition-all relative select-none ${
                        isSelected
                          ? "bg-tertiary-fixed text-on-tertiary-fixed ring-4 ring-primary scale-105 z-20 pop-shadow font-bold"
                          : sq.isFree
                          ? "bg-tertiary-fixed/90 text-on-tertiary-fixed hover:bg-tertiary-fixed pop-shadow-sm font-bold"
                          : "bg-surface hover:bg-surface-variant text-on-surface pop-shadow-sm"
                      }`}
                    >
                      {sq.isFree ? (
                        <span className="font-headline-md text-xs sm:text-base uppercase font-bold">FREE</span>
                      ) : (
                        <span className="font-label-bold text-[9px] sm:text-[11px] leading-tight uppercase font-bold line-clamp-3 px-0.5">
                          {sq.label}
                        </span>
                      )}

                      {isSelected && (
                        <span className="absolute top-1 right-1 bg-primary text-on-primary text-[8px] font-bold px-1 border border-on-surface uppercase">
                          SEL
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Bar - Navigates directly to Step 3 of 3 (Rewards Config) */}
            <div className="flex justify-between items-center pt-6 pb-8">
              <Link
                href="/admin/setup"
                className="bg-surface border-4 border-on-surface px-6 py-4 font-label-bold text-label-bold uppercase pop-shadow hover:bg-surface-variant"
              >
                ← Back
              </Link>
              <button
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
      </main>
    </div>
  );
}
