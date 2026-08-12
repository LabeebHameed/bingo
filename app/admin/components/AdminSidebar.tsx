"use client";

import Link from "next/link";

export type AdminSidebarActiveKey =
  | "setup"
  | "grid"
  | "branding"
  | "rewards"
  | "launch"
  | "feed"
  | "qr";

interface AdminSidebarProps {
  mode: "wizard" | "operator";
  activeKey: AdminSidebarActiveKey;
  onTabSelect?: (tab: "feed" | "qr") => void;
}

export default function AdminSidebar({
  mode,
  activeKey,
  onTabSelect,
}: AdminSidebarProps) {
  if (mode === "wizard") {
    const wizardSteps = [
      { key: "setup", label: "1. Game Setup", path: "/admin/setup", icon: "settings_input_component" },
      { key: "grid", label: "2. Grid Config", path: "/admin/grid-config", icon: "grid_on" },
      { key: "rewards", label: "3. Reward Tiers", path: "/admin/rewards-config", icon: "military_tech" },
      { key: "launch", label: "Launch Lobby", path: "/admin/launch", icon: "rocket_launch" },
    ];

    return (
      <nav className="hidden md:flex flex-col h-screen sticky top-0 p-gutter bg-surface-container w-80 border-r-4 border-on-surface shadow-[4px_0px_0px_0px_rgba(0,0,0,1)] z-40">
        <div className="mb-stack-lg border-b-4 border-on-surface pb-4">
          <h1 className="font-headline-lg text-headline-lg text-primary uppercase tracking-tighter">
            GAME SETUP WIZARD
          </h1>
          <span className="font-label-bold text-xs uppercase text-secondary">
            SETUP MODE
          </span>
        </div>

        <ul className="flex flex-col gap-stack-sm flex-grow">
          {wizardSteps.map((st) => {
            const isActive = activeKey === st.key;
            return (
              <li key={st.key}>
                <Link
                  href={st.path}
                  className={`flex items-center gap-4 px-4 py-3 font-label-bold text-label-bold uppercase border-2 transition-all ${
                    isActive
                      ? "bg-tertiary-fixed text-on-tertiary-fixed font-bold border-on-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      : "text-on-surface border-transparent hover:bg-surface-variant hover:border-on-surface hover:translate-x-1"
                  }`}
                >
                  <span className="material-symbols-outlined">{st.icon}</span>
                  <span>{st.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    );
  }

  // Operator Dashboard Mode Sidebar (Post-Setup / Projector Mode)
  return (
    <nav className="hidden md:flex flex-col h-screen sticky top-0 p-gutter bg-surface-container w-80 border-r-4 border-on-surface shadow-[4px_0px_0px_0px_rgba(0,0,0,1)] z-40">
      <div className="mb-stack-lg border-b-4 border-on-surface pb-4">
        <h1 className="font-headline-lg text-headline-lg text-primary uppercase tracking-tighter leading-tight">
          OPERATOR DASHBOARD
        </h1>
        <p className="font-label-bold text-label-bold text-secondary uppercase tracking-widest mt-1">
          PROJECTOR MODE
        </p>
      </div>

      <ul className="flex flex-col gap-stack-sm flex-grow">
        {/* 1. Active Live Feed */}
        <li>
          {onTabSelect ? (
            <button
              type="button"
              onClick={() => onTabSelect("feed")}
              className={`w-full flex items-center gap-4 px-4 py-3 font-label-bold text-label-bold uppercase border-2 transition-all cursor-pointer ${
                activeKey === "feed"
                  ? "bg-tertiary-fixed text-on-tertiary-fixed font-bold border-on-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  : "text-on-surface border-transparent hover:bg-surface-variant hover:border-on-surface hover:translate-x-1"
              }`}
            >
              <span className="material-symbols-outlined">play_circle</span>
              <span>Active Live Feed</span>
            </button>
          ) : (
            <Link
              href="/admin/dashboard"
              className={`flex items-center gap-4 px-4 py-3 font-label-bold text-label-bold uppercase border-2 transition-all ${
                activeKey === "feed"
                  ? "bg-tertiary-fixed text-on-tertiary-fixed font-bold border-on-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  : "text-on-surface border-transparent hover:bg-surface-variant hover:border-on-surface hover:translate-x-1"
              }`}
            >
              <span className="material-symbols-outlined">play_circle</span>
              <span>Active Live Feed</span>
            </Link>
          )}
        </li>

        {/* 2. QR Code Display */}
        <li>
          {onTabSelect ? (
            <button
              type="button"
              onClick={() => onTabSelect("qr")}
              className={`w-full flex items-center gap-4 px-4 py-3 font-label-bold text-label-bold uppercase border-2 transition-all cursor-pointer ${
                activeKey === "qr"
                  ? "bg-tertiary-fixed text-on-tertiary-fixed font-bold border-on-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  : "text-on-surface border-transparent hover:bg-surface-variant hover:border-on-surface hover:translate-x-1"
              }`}
            >
              <span className="material-symbols-outlined">qr_code_2</span>
              <span>QR Code Display</span>
            </button>
          ) : (
            <Link
              href="/admin/dashboard"
              className={`flex items-center gap-4 px-4 py-3 font-label-bold text-label-bold uppercase border-2 transition-all ${
                activeKey === "qr"
                  ? "bg-tertiary-fixed text-on-tertiary-fixed font-bold border-on-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  : "text-on-surface border-transparent hover:bg-surface-variant hover:border-on-surface hover:translate-x-1"
              }`}
            >
              <span className="material-symbols-outlined">qr_code_2</span>
              <span>QR Code Display</span>
            </Link>
          )}
        </li>

        {/* 3. Game Setup (Opens Read-Only Preview First) */}
        <li>
          <Link
            href="/admin/setup?mode=readonly"
            className={`flex items-center gap-4 px-4 py-3 font-label-bold text-label-bold uppercase border-2 transition-all ${
              activeKey === "setup"
                ? "bg-tertiary-fixed text-on-tertiary-fixed font-bold border-on-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                : "text-on-surface border-transparent hover:bg-surface-variant hover:border-on-surface hover:translate-x-1"
            }`}
          >
            <span className="material-symbols-outlined">settings_input_component</span>
            <span>Game Setup</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}
