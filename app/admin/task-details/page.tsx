"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AdminSidebar from "../components/AdminSidebar";

export default function AdminTaskDetailsPage() {
  const [operatorSession, setOperatorSession] = useState<any>(null);
  const [bingoCards, setBingoCards] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [inspectSquare, setInspectSquare] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"cards" | "selfies">("cards");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const s = localStorage.getItem("human_bingo_operator");
    if (s) {
      const parsed = JSON.parse(s);
      setOperatorSession(parsed);

      fetch(`/api/events/${parsed.eventCode}/reconnect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operatorSecret: parsed.operatorSecret }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.bingoCards) {
            setBingoCards(data.bingoCards);
            if (data.bingoCards.length > 0) {
              setSelectedPlayer(data.bingoCards[0]);
            }
          }
          if (data.activityFeed) {
            setSubmissions(data.activityFeed.filter((a: any) => a.type === "square_complete"));
          }
        })
        .catch((e) => console.error(e))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) return <div className="min-h-screen bg-surface p-8">Loading verification matrix...</div>;

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

  // Extract all completed squares with photos across all players
  const allSelfieSubmissions: any[] = [];
  bingoCards.forEach((player) => {
    if (player.card?.squares) {
      player.card.squares.forEach((sq: any) => {
        if (sq.completed && sq.photoUrl) {
          allSelfieSubmissions.push({
            playerName: player.nickname || player.participantName,
            square: sq,
            completedAt: sq.completedAt
          });
        }
      });
    }
  });

  return (
    <div className="bg-surface text-on-surface font-body-md min-h-screen flex flex-col md:flex-row">
      <AdminSidebar mode="operator" activeKey="tasks" />

      <main className="flex-grow flex flex-col p-margin-mobile md:p-margin-desktop bg-background overflow-y-auto min-h-screen">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b-4 border-on-surface pb-stack-sm mb-stack-lg gap-4">
          <div>
            <span className="inline-block px-3 py-1 bg-tertiary-fixed text-on-tertiary-fixed border-2 border-on-surface font-label-bold text-xs uppercase mb-2 pop-shadow transform -rotate-1">
              Verification & Proof Inspector
            </span>
            <h1 className="font-display-lg text-display-lg text-on-surface uppercase leading-none md:text-[60px]">
              VERIFY BINGO CARDS & SELFIES
            </h1>
          </div>

          <div className="flex border-4 border-on-surface bg-surface pop-shadow">
            <button
              onClick={() => setActiveTab("cards")}
              className={`px-6 py-3 font-headline-md text-headline-md uppercase transition-colors cursor-pointer ${
                activeTab === "cards" ? "bg-primary text-on-primary" : "text-on-surface hover:bg-surface-variant"
              }`}
            >
              Player Cards ({bingoCards.length})
            </button>
            <button
              onClick={() => setActiveTab("selfies")}
              className={`px-6 py-3 font-headline-md text-headline-md uppercase transition-colors cursor-pointer ${
                activeTab === "selfies" ? "bg-primary text-on-primary" : "text-on-surface hover:bg-surface-variant"
              }`}
            >
              All Selfies ({allSelfieSubmissions.length})
            </button>
          </div>
        </div>

        {/* Tab 1: Player Bingo Cards Inspector */}
        {activeTab === "cards" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter flex-1">
            {/* Player Selection Sidebar */}
            <div className="lg:col-span-4 flex flex-col border-4 border-on-surface bg-surface-lowest p-4 pop-shadow max-h-[700px]">
              <h3 className="font-headline-md text-headline-md uppercase border-b-4 border-on-surface pb-2 mb-4 text-primary">
                Participants ({bingoCards.length})
              </h3>
              <div className="space-y-2 overflow-y-auto flex-grow pr-1">
                {bingoCards.length === 0 ? (
                  <p className="text-on-surface-variant italic p-4">No participants joined yet.</p>
                ) : (
                  bingoCards.map((p) => {
                    const isSelected = selectedPlayer?.participantId === p.participantId;
                    const lines = p.card?.completedLines || 0;
                    const stamped = p.card?.squares?.filter((s: any) => s.completed).length || 0;
                    const isWinner = lines >= 5 || stamped >= 25;

                    return (
                      <button
                        key={p.participantId}
                        onClick={() => setSelectedPlayer(p)}
                        className={`w-full text-left p-3 border-4 border-on-surface pop-shadow transition-all cursor-pointer flex justify-between items-center ${
                          isSelected
                            ? "bg-primary text-on-primary border-on-surface scale-[1.02]"
                            : isWinner
                              ? "bg-green-600 text-white font-bold"
                              : "bg-surface text-on-surface hover:bg-surface-variant"
                        }`}
                      >
                        <div className="flex flex-col min-w-0 pr-2">
                          <span className="font-headline-md text-sm uppercase truncate font-bold">
                            {p.nickname || p.participantName}
                          </span>
                          <span className="text-[10px] font-label-bold uppercase opacity-80">
                            {stamped}/25 Stamped
                          </span>
                        </div>
                        <span className={`font-label-bold text-xs px-2 py-1 border border-on-surface uppercase ${
                          isWinner ? "bg-green-300 text-green-950 font-black" : "bg-surface text-on-surface"
                        }`}>
                          {lines}/5 LINES
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Selected Player's 5x5 Bingo Grid */}
            <div className="lg:col-span-8 flex flex-col border-4 border-on-surface bg-surface-lowest p-6 pop-shadow">
              {selectedPlayer ? (
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center border-b-4 border-on-surface pb-3">
                    <div>
                      <span className="font-label-bold text-xs uppercase text-secondary">Inspecting Player Card:</span>
                      <h2 className="font-headline-lg text-headline-lg uppercase text-primary">
                        {selectedPlayer.nickname || selectedPlayer.participantName}
                      </h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-tertiary-fixed text-on-tertiary-fixed border-2 border-on-surface px-3 py-1 font-label-bold text-xs uppercase">
                        {selectedPlayer.card?.completedLines || 0}/5 LINES
                      </span>
                      <span className="bg-surface text-on-surface border-2 border-on-surface px-3 py-1 font-label-bold text-xs uppercase">
                        {selectedPlayer.card?.squares?.filter((s: any) => s.completed).length || 0}/25 STAMPED
                      </span>
                    </div>
                  </div>

                  <p className="font-body-md text-xs text-on-surface-variant">
                    Click on any completed square below to inspect the selfie photo, Q&A answer, and timestamp.
                  </p>

                  {/* 5x5 Grid Display */}
                  <div className="grid grid-cols-5 gap-2 aspect-square max-w-[540px] mx-auto w-full border-4 border-on-surface p-2 bg-surface">
                    {selectedPlayer.card?.squares?.map((sq: any) => (
                      <button
                        key={sq.id}
                        onClick={() => setInspectSquare({ square: sq, playerName: selectedPlayer.nickname || selectedPlayer.participantName })}
                        className={`aspect-square w-full h-full border-2 border-on-surface p-1 flex flex-col items-center justify-center text-center relative overflow-hidden transition-all cursor-pointer ${
                          sq.completed
                            ? sq.photoUrl
                              ? "bg-black text-white"
                              : "bg-primary text-on-primary"
                            : "bg-surface-container-low text-on-surface"
                        }`}
                      >
                        {sq.photoUrl ? (
                          <>
                            <img src={sq.photoUrl} alt={sq.label} className="absolute inset-0 w-full h-full object-cover z-0" />
                            <div className="absolute inset-0 bg-black/40 z-10"></div>
                            <span className="material-symbols-outlined text-white text-xs absolute top-1 right-1 z-20 font-bold">
                              check_circle
                            </span>
                            <span className="font-label-bold text-[9px] uppercase text-white z-20 truncate w-full px-0.5 mt-auto">
                              {sq.label}
                            </span>
                          </>
                        ) : (
                          <>
                            {sq.isFree ? (
                              <span className="font-headline-md text-xs uppercase text-primary font-bold">FREE</span>
                            ) : (
                              <span className="font-label-bold text-[9px] uppercase line-clamp-2 px-0.5">
                                {sq.label}
                              </span>
                            )}
                            {sq.completed && (
                              <span className="material-symbols-outlined text-xs absolute top-1 right-1 font-bold z-20">
                                check_circle
                              </span>
                            )}
                          </>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center text-on-surface-variant italic">Select a player to view their card.</div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: All Uploaded Selfies Gallery */}
        {activeTab === "selfies" && (
          <div className="flex flex-col border-4 border-on-surface bg-surface-lowest p-6 pop-shadow flex-1">
            <h3 className="font-headline-lg text-headline-lg uppercase border-b-4 border-on-surface pb-3 mb-6 text-primary">
              RALLY SELFIE PROOF GALLERY ({allSelfieSubmissions.length})
            </h3>

            {allSelfieSubmissions.length === 0 ? (
              <div className="p-12 text-center bg-surface-container border-2 border-on-surface text-on-surface-variant italic">
                No selfie photos uploaded yet. Selfies taken by players will appear here in real time.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {allSelfieSubmissions.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => setInspectSquare({ square: item.square, playerName: item.playerName })}
                    className="border-4 border-on-surface bg-surface p-3 pop-shadow cursor-pointer hover:scale-[1.02] transition-all flex flex-col gap-2"
                  >
                    <div className="relative h-48 bg-black border-2 border-on-surface overflow-hidden">
                      <img src={item.square.photoUrl} alt={item.square.label} className="w-full h-full object-cover" />
                      <div className="absolute bottom-0 inset-x-0 bg-black/70 p-2">
                        <span className="font-headline-md text-xs text-white uppercase block truncate">{item.playerName}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="font-label-bold text-xs uppercase text-primary font-bold truncate">
                        {item.square.label}
                      </span>
                      {item.square.answer && (
                        <p className="font-body-md text-xs italic text-on-surface font-semibold line-clamp-2">
                          "{item.square.answer}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Selfie & Proof Inspection Modal */}
        {inspectSquare && (
          <div className="fixed inset-0 bg-on-background/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-surface border-4 border-on-surface p-6 max-w-md w-full pop-shadow-lg flex flex-col gap-4 relative">
              <button
                onClick={() => setInspectSquare(null)}
                className="absolute top-3 right-3 border-2 border-on-surface bg-primary text-on-primary w-8 h-8 font-bold flex items-center justify-center pop-shadow cursor-pointer z-50"
              >
                ✕
              </button>

              <div className="border-b-4 border-on-surface pb-3">
                <span className="bg-tertiary-fixed text-on-tertiary-fixed border border-on-surface px-2 py-0.5 font-label-bold text-xs uppercase inline-block mb-1">
                  PLAYER: {inspectSquare.playerName}
                </span>
                <h3 className="font-headline-md text-headline-md uppercase text-on-surface">
                  {inspectSquare.square.label}
                </h3>
              </div>

              {inspectSquare.square.photoUrl ? (
                <div className="relative w-full h-64 border-4 border-on-surface bg-black overflow-hidden pop-shadow">
                  <img src={inspectSquare.square.photoUrl} alt="Selfie Proof" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="p-8 text-center bg-surface-container border-2 border-on-surface italic">
                  No photo attached to this square.
                </div>
              )}

              <div className="bg-surface-container-lowest border-4 border-on-surface p-4 pop-shadow flex flex-col gap-2">
                <span className="font-label-bold text-xs uppercase text-secondary font-bold">Task Details:</span>
                <p className="font-body-md text-sm font-bold text-on-surface">
                  {inspectSquare.square.task}
                </p>

                {inspectSquare.square.questionAsked && (
                  <div className="mt-2 pt-2 border-t border-on-surface/20 flex flex-col gap-1">
                    <span className="font-label-bold text-xs uppercase text-primary font-bold">
                      Question Asked: {inspectSquare.square.questionAsked}
                    </span>
                    <p className="font-headline-md text-base text-on-surface">
                      "{inspectSquare.square.answer || "No answer typed"}"
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="font-label-bold text-xs uppercase text-secondary">
                  Completed At: {inspectSquare.square.completedAt ? new Date(inspectSquare.square.completedAt).toLocaleTimeString() : "N/A"}
                </span>
                <span className="bg-green-600 text-white border border-on-surface font-label-bold text-xs uppercase px-3 py-1">
                  VERIFIED ✓
                </span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
