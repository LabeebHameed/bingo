"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminSidebar from "../components/AdminSidebar";

export default function AdminBrandingPage() {
  const router = useRouter();
  const [accentColor, setAccentColor] = useState("#d90429");
  const [marqueeText, setMarqueeText] = useState("CAMPUS RALLY 2026 • WIN EXCLUSIVE PRIZES & SWAG");

  return (
    <div className="bg-surface text-on-surface font-body-md min-h-screen flex flex-col md:flex-row">
      <AdminSidebar mode="wizard" activeKey="branding" />

      <main className="flex-grow flex flex-col p-margin-mobile md:p-margin-desktop bg-background overflow-y-auto min-h-screen">
        {/* Consistent Header Section */}
        <div className="flex items-end justify-between border-b-4 border-on-surface pb-stack-sm mb-stack-lg">
          <div>
            <span className="inline-block px-3 py-1 bg-tertiary-fixed text-on-tertiary-fixed border-2 border-on-surface font-label-bold text-label-bold uppercase mb-2 pop-shadow transform -rotate-2">
              Step 3 of 4
            </span>
            <h2 className="font-display-lg text-display-lg text-on-surface uppercase leading-none md:text-[80px]">
              Event Branding
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
          {/* Controls */}
          <div className="lg:col-span-8 flex flex-col justify-between">
            <div className="flex flex-col gap-stack-md">
              {/* Color Customization */}
              <section className="bg-surface-container-lowest border-4 border-on-surface p-6 pop-shadow flex flex-col gap-4">
                <h3 className="font-headline-md text-headline-md uppercase border-b-4 border-on-surface pb-2">
                  Theme Color Palette
                </h3>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-16 h-16 border-4 border-on-surface cursor-pointer rounded-DEFAULT"
                  />
                  <div>
                    <span className="font-label-bold text-xs uppercase text-secondary">Primary Crimson Accent</span>
                    <p className="font-headline-md text-lg text-on-surface">{accentColor}</p>
                  </div>
                </div>
              </section>

              {/* Marquee Banner Input */}
              <section className="bg-surface-container-lowest border-4 border-on-surface p-6 pop-shadow flex flex-col gap-4">
                <h3 className="font-headline-md text-headline-md uppercase border-b-4 border-on-surface pb-2">
                  Marquee Ticker Text
                </h3>
                <input
                  type="text"
                  value={marqueeText}
                  onChange={(e) => setMarqueeText(e.target.value)}
                  className="w-full border-4 border-on-surface p-4 font-body-lg text-body-lg text-on-surface"
                />
              </section>
            </div>

            {/* Consistent Action Bar at Bottom */}
            <div className="flex justify-between items-center pt-4 pb-8">
              <Link
                href="/admin/grid-config"
                className="bg-surface border-4 border-on-surface px-6 py-4 font-label-bold text-label-bold uppercase pop-shadow"
              >
                ← Back
              </Link>
              <button
                onClick={() => router.push("/admin/rewards-config")}
                className="bg-primary text-on-primary font-headline-md text-headline-md uppercase px-8 py-4 border-4 border-on-surface pop-shadow hover:bg-primary-container transition-all flex items-center gap-2 cursor-pointer"
              >
                Next Step
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                  arrow_forward
                </span>
              </button>
            </div>
          </div>

          {/* Marquee Live Preview Sidebar */}
          <div className="lg:col-span-4 flex flex-col gap-stack-md">
            <div className="bg-tertiary-fixed border-4 border-on-surface p-6 pop-shadow flex flex-col gap-4">
              <h4 className="font-headline-md text-headline-md uppercase text-on-tertiary-fixed">Live Banner Preview</h4>
              <div className="bg-on-surface text-tertiary-fixed p-4 border-2 border-on-surface overflow-hidden font-headline-md text-sm uppercase tracking-wider">
                {marqueeText}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
