"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminSidebar from "../components/AdminSidebar";

export default function AdminRewardsConfigPage() {
  const router = useRouter();

  const [tier1Prize, setTier1Prize] = useState("Campus Store $50 Gift Card + VIP Rally Hoodie");
  const [tier2Prize, setTier2Prize] = useState("Official Rally Champion Tumbler + Dining Voucher");
  const [tier3Prize, setTier3Prize] = useState("Exclusive Digital Rally Finisher Badge");

  useEffect(() => {
    const saved = localStorage.getItem("operator_rewards_config");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.tier1) setTier1Prize(parsed.tier1);
        if (parsed.tier2) setTier2Prize(parsed.tier2);
        if (parsed.tier3) setTier3Prize(parsed.tier3);
      } catch (e) {}
    }
  }, []);

  const handleNext = () => {
    localStorage.setItem("operator_rewards_config", JSON.stringify({
      tier1: tier1Prize,
      tier2: tier2Prize,
      tier3: tier3Prize,
    }));
    router.push("/admin/launch");
  };

  return (
    <div className="bg-surface text-on-surface font-body-md min-h-screen flex flex-col md:flex-row">
      <AdminSidebar mode="wizard" activeKey="rewards" />

      <main className="flex-grow flex flex-col p-margin-mobile md:p-margin-desktop bg-background overflow-y-auto min-h-screen">
        {/* Consistent Header Section */}
        <div className="flex items-end justify-between border-b-4 border-on-surface pb-stack-sm mb-stack-lg">
          <div>
            <span className="inline-block px-3 py-1 bg-tertiary-fixed text-on-tertiary-fixed border-2 border-on-surface font-label-bold text-label-bold uppercase mb-2 pop-shadow transform -rotate-2">
              Step 3 of 3
            </span>
            <h2 className="font-display-lg text-display-lg text-on-surface uppercase leading-none md:text-[80px]">
              Reward Tiers
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
          {/* Main Form Area */}
          <div className="lg:col-span-8 flex flex-col gap-stack-md">
            {/* Tier 1: Grand Prize */}
            <div className="bg-surface border-4 border-on-surface p-6 pop-shadow flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-3xl text-primary font-bold">emoji_events</span>
                <div>
                  <h3 className="font-headline-md text-headline-md uppercase text-on-surface">
                    Tier 1: Grand Champion (Full Blackout)
                  </h3>
                  <p className="font-body-md text-xs text-on-surface-variant">
                    Awarded to the first players who fill all 25 bingo squares.
                  </p>
                </div>
              </div>
              <input
                type="text"
                value={tier1Prize}
                onChange={(e) => setTier1Prize(e.target.value)}
                placeholder="Enter Tier 1 prize description..."
                className="w-full border-4 border-on-surface p-4 font-body-lg text-body-lg bg-surface-container-lowest font-bold"
              />
            </div>

            {/* Tier 2: 5-in-a-Row Winner */}
            <div className="bg-surface border-4 border-on-surface p-6 pop-shadow flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-3xl text-secondary font-bold">military_tech</span>
                <div>
                  <h3 className="font-headline-md text-headline-md uppercase text-on-surface">
                    Tier 2: Bingo Line Winner (5-in-a-Row)
                  </h3>
                  <p className="font-body-md text-xs text-on-surface-variant">
                    Awarded to players who complete any single horizontal, vertical, or diagonal line.
                  </p>
                </div>
              </div>
              <input
                type="text"
                value={tier2Prize}
                onChange={(e) => setTier2Prize(e.target.value)}
                placeholder="Enter Tier 2 prize description..."
                className="w-full border-4 border-on-surface p-4 font-body-lg text-body-lg bg-surface-container-lowest font-bold"
              />
            </div>

            {/* Tier 3: Participation Badge */}
            <div className="bg-surface border-4 border-on-surface p-6 pop-shadow flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-3xl text-on-surface-variant font-bold">verified</span>
                <div>
                  <h3 className="font-headline-md text-headline-md uppercase text-on-surface">
                    Tier 3: Rally Finisher Badge
                  </h3>
                  <p className="font-body-md text-xs text-on-surface-variant">
                    Awarded to all participants who log into the event lobby.
                  </p>
                </div>
              </div>
              <input
                type="text"
                value={tier3Prize}
                onChange={(e) => setTier3Prize(e.target.value)}
                placeholder="Enter Tier 3 prize description..."
                className="w-full border-4 border-on-surface p-4 font-body-lg text-body-lg bg-surface-container-lowest font-bold"
              />
            </div>
          </div>

          {/* Side Info & Action Panel */}
          <div className="lg:col-span-4 flex flex-col justify-between">
            <div className="bg-secondary-fixed border-4 border-on-surface p-6 pop-shadow flex flex-col gap-4">
              <h3 className="font-headline-md text-headline-md uppercase border-b-4 border-on-surface pb-2 text-on-surface">
                Setup Ready
              </h3>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between font-label-bold text-xs uppercase">
                  <span>Wizard Progress</span>
                  <span>Step 3 of 3</span>
                </div>
                <div className="w-full bg-surface border-2 border-on-surface h-4 overflow-hidden">
                  <div className="bg-primary h-full w-full"></div>
                </div>
              </div>
              <p className="font-body-md text-body-md text-on-surface">
                You have completed all 3 setup steps! Click below to proceed to the Launch Lobby.
              </p>
            </div>

            {/* Action Bar */}
            <div className="flex justify-between items-center pt-6 pb-8">
              <Link
                href="/admin/grid-config"
                className="bg-surface border-4 border-on-surface px-6 py-4 font-label-bold text-label-bold uppercase pop-shadow hover:bg-surface-variant"
              >
                ← Back
              </Link>
              <button
                onClick={handleNext}
                className="bg-primary text-on-primary font-headline-md text-headline-md uppercase px-8 py-4 border-4 border-on-surface pop-shadow hover:bg-primary-container transition-all flex items-center gap-2 cursor-pointer"
              >
                Launch Lobby
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                  rocket_launch
                </span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
