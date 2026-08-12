"use client";

import Link from "next/link";

interface AdminWizardSidebarProps {
  currentStep: number | "launch";
}

export default function AdminWizardSidebar({ currentStep }: AdminWizardSidebarProps) {
  const steps = [
    { num: 1, label: "1. Game Setup", path: "/admin/setup", icon: "settings_input_component" },
    { num: 2, label: "2. Grid Config", path: "/admin/grid-config", icon: "grid_on" },
    { num: 3, label: "3. Event Branding", path: "/admin/branding", icon: "palette" },
    { num: 4, label: "4. Reward Tiers", path: "/admin/rewards-config", icon: "military_tech" },
    { num: "launch", label: "Launch Lobby", path: "/admin/launch", icon: "rocket_launch" },
  ];

  return (
    <nav className="hidden md:flex flex-col h-screen sticky top-0 p-gutter bg-surface-container w-80 border-r-4 border-on-surface shadow-[4px_0px_0px_0px_rgba(0,0,0,1)] z-40">
      <div className="mb-stack-lg border-b-4 border-on-surface pb-4">
        <h1 className="font-headline-lg text-headline-lg text-primary uppercase tracking-tighter">
          GAME SETUP WIZARD
        </h1>
        <span className="font-label-bold text-xs uppercase text-secondary">
          Step {typeof currentStep === "number" ? `${currentStep} of 4` : "Final Launch"}
        </span>
      </div>

      <ul className="flex flex-col gap-stack-sm flex-grow">
        {steps.map((st) => {
          const isActive = currentStep === st.num;
          return (
            <li key={st.label}>
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
