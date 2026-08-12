"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminTaskDetailsPage() {
  const [operatorSession, setOperatorSession] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const s = localStorage.getItem("human_bingo_operator");
    if (s) {
      const parsed = JSON.parse(s);
      setOperatorSession(parsed);

      // Fetch real submissions via reconnect/export endpoint
      fetch(`/api/events/${parsed.eventCode}/reconnect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operatorSecret: parsed.operatorSecret }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.activityFeed) {
            setSubmissions(data.activityFeed.filter((a: any) => a.type === "square_complete" || a.type === "bingo_line"));
          }
        })
        .catch((e) => console.error(e))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-body-md">
      {/* Top Header */}
      <header className="bg-surface border-b-4 border-on-surface p-margin-mobile md:px-margin-desktop sticky top-0 z-50 pop-shadow">
        <div className="max-w-[1280px] mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl font-bold">fact_check</span>
            <h1 className="font-display-lg text-display-lg text-primary uppercase tracking-tighter">
              TASK SUBMISSIONS & MODERATION
            </h1>
          </div>
          <Link
            href="/admin/dashboard"
            className="font-label-bold text-label-bold uppercase bg-surface-container border-2 border-on-surface px-3 py-1 pop-shadow"
          >
            Dashboard
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-[1280px] mx-auto w-full p-margin-mobile md:p-margin-desktop flex flex-col gap-stack-md my-stack-md">
        <div className="bg-surface-container-lowest border-4 border-on-surface pop-shadow p-6 flex flex-col gap-stack-sm">
          <div className="flex justify-between items-center border-b-4 border-on-surface pb-3">
            <h2 className="font-headline-lg text-headline-lg uppercase text-on-surface">
              SUBMITTED SELFIES & ANSWERS ({submissions.length})
            </h2>
            <span className="bg-tertiary-fixed border-2 border-on-surface px-3 py-1 font-label-bold text-xs uppercase">
              MODERATOR QUEUE
            </span>
          </div>

          {submissions.length === 0 ? (
            <div className="text-center p-12 bg-surface-container-low border-2 border-on-surface font-body-md text-on-surface-variant italic">
              No submissions received yet. Live selfies and answers will appear here in real time as players complete squares.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {submissions.map((sub, idx) => (
                <div
                  key={sub.id || idx}
                  className="border-4 border-on-surface bg-surface-container-low p-4 pop-shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-primary-container text-on-primary-container border-2 border-on-surface flex items-center justify-center font-bold text-xl pop-shadow-sm">
                      <span className="material-symbols-outlined text-3xl">face</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-headline-md text-headline-md uppercase text-on-surface">
                        {sub.participantName || sub.message}
                      </span>
                      <span className="font-label-bold text-xs text-secondary">
                        Time: {new Date(sub.timestamp || Date.now()).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  <div className="bg-surface border-2 border-on-surface p-3 flex flex-col gap-1 max-w-md w-full">
                    <p className="font-body-md text-body-md font-bold text-on-surface">
                      {sub.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
