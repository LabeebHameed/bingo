"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="bg-background text-on-background font-body-md overflow-x-hidden selection:bg-primary selection:text-on-primary min-h-screen flex flex-col justify-between relative">
      {/* TopNavBar Header */}
      <header className="w-full top-0 sticky z-50 bg-surface border-b-4 border-on-background shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop py-4 flex justify-between items-center">
          <Link href="/" className="font-headline-lg text-headline-lg tracking-tighter text-primary uppercase">
            CAMPUS RALLY
          </Link>
          <div className="flex gap-3 items-center z-50">
            {/* Log In Button */}
            <Link
              href="/admin/login"
              className="bg-primary text-on-primary border-4 border-on-background px-6 py-2 font-label-bold text-label-bold uppercase pop-shadow hover:bg-primary-container transition-all cursor-pointer flex items-center gap-2 relative z-50 pointer-events-auto"
            >
              <span className="material-symbols-outlined text-sm">lock</span>
              <span>Log In</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 relative z-10">
        {/* Hero Section */}
        <section className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg md:py-24 grid grid-cols-1 md:grid-cols-2 gap-gutter items-center">
          <div className="flex flex-col gap-stack-md relative z-20">
            <div className="inline-block bg-tertiary-fixed-dim border-2 border-on-background px-4 py-1 self-start font-label-bold text-label-bold uppercase text-on-background pop-shadow transform -rotate-2">
              Live Now
            </div>
            <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg uppercase leading-none tracking-tight">
              THE ULTIMATE CAMPUS BINGO EVENT
            </h1>
            <p className="font-body-lg text-body-lg max-w-xl text-secondary font-bold">
              Join the massive campus-wide icebreaker scavenger hunt. Complete tasks, take selfies, fill your bingo card, and win real rewards.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-4 relative z-30">
              {/* Direct Touch-Responsive Link for Mobile */}
              <Link
                href="/join"
                className="relative z-30 inline-block bg-primary text-on-primary border-4 border-on-background px-8 py-4 font-headline-md text-headline-md uppercase pop-shadow hover:bg-primary-container active:scale-95 transition-all cursor-pointer text-center pointer-events-auto"
              >
                JOIN A GAME NOW
              </Link>
            </div>
          </div>

          {/* Hero Visual Box matching Stitch */}
          <div className="relative flex justify-center items-center h-[340px] md:h-[480px] mt-6 md:mt-0 pointer-events-none">
            <div className="absolute inset-0 bg-primary-container border-4 border-on-background pop-shadow transform rotate-3"></div>
            <div className="absolute inset-4 bg-tertiary-fixed-dim border-4 border-on-background pop-shadow transform -rotate-1"></div>
            <img
              src="/images/mascot-bulldog.png"
              alt="Campus Mascot Sticker"
              className="relative z-10 w-[280px] h-[280px] md:w-[400px] md:h-[400px] object-contain transform hover:scale-105 transition-transform duration-300 drop-shadow-[4px_4px_0_rgba(0,0,0,1)]"
            />
          </div>
        </section>

        {/* How It Works Section */}
        <section className="bg-secondary-container py-stack-lg md:py-24 border-y-4 border-on-background">
          <div className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop">
            <h2 className="font-headline-lg text-headline-lg text-center uppercase mb-stack-lg text-on-surface">
              How to Play
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter">
              {/* Step 1 */}
              <div className="bg-surface border-4 border-on-background p-6 pop-shadow flex flex-col gap-4 relative">
                <div className="absolute -top-4 -left-4 bg-primary text-on-primary border-4 border-on-background w-12 h-12 flex items-center justify-center font-headline-md text-headline-md pop-shadow transform -rotate-6">
                  1
                </div>
                <span className="material-symbols-outlined text-6xl text-primary text-center">
                  qr_code_scanner
                </span>
                <h3 className="font-headline-md text-headline-md text-center uppercase border-b-4 border-on-background pb-2">
                  Scan QR
                </h3>
                <p className="text-center font-body-md text-secondary">
                  Scan QR codes displayed on campus screens or poster boards.
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-surface border-4 border-on-background p-6 pop-shadow flex flex-col gap-4 relative md:translate-y-4">
                <div className="absolute -top-4 -left-4 bg-primary text-on-primary border-4 border-on-background w-12 h-12 flex items-center justify-center font-headline-md text-headline-md pop-shadow transform rotate-3">
                  2
                </div>
                <span className="material-symbols-outlined text-6xl text-primary text-center">
                  photo_camera
                </span>
                <h3 className="font-headline-md text-headline-md text-center uppercase border-b-4 border-on-background pb-2">
                  Take Selfies
                </h3>
                <p className="text-center font-body-md text-secondary">
                  Find classmates on your bingo grid, snap a selfie & ask icebreaker questions.
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-surface border-4 border-on-background p-6 pop-shadow flex flex-col gap-4 relative">
                <div className="absolute -top-4 -left-4 bg-primary text-on-primary border-4 border-on-background w-12 h-12 flex items-center justify-center font-headline-md text-headline-md pop-shadow transform -rotate-3">
                  3
                </div>
                <span className="material-symbols-outlined text-6xl text-primary text-center">
                  grid_on
                </span>
                <h3 className="font-headline-md text-headline-md text-center uppercase border-b-4 border-on-background pb-2">
                  Get 5 in a Row
                </h3>
                <p className="text-center font-body-md text-secondary">
                  Line 'em up horizontally, vertically, or diagonally for BINGO!
                </p>
              </div>

              {/* Step 4 */}
              <div className="bg-surface border-4 border-on-background p-6 pop-shadow flex flex-col gap-4 relative md:translate-y-4">
                <div className="absolute -top-4 -left-4 bg-primary text-on-primary border-4 border-on-background w-12 h-12 flex items-center justify-center font-headline-md text-headline-md pop-shadow transform rotate-6">
                  4
                </div>
                <span className="material-symbols-outlined text-6xl text-primary text-center">
                  emoji_events
                </span>
                <h3 className="font-headline-md text-headline-md text-center uppercase border-b-4 border-on-background pb-2">
                  Win Rewards
                </h3>
                <p className="text-center font-body-md text-secondary">
                  Claim prizes, gift cards, digital badges, and campus glory.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t-4 border-on-background bg-on-background py-stack-md px-margin-desktop flex flex-col md:flex-row justify-between items-center gap-gutter relative z-20">
        <div className="font-headline-md text-headline-md text-surface">CAMPUS RALLY</div>
        <div className="text-surface font-body-md text-body-md text-center">
          © 2026 CAMPUS RALLY. ALL RIGHTS RESERVED.
        </div>
      </footer>
    </div>
  );
}
