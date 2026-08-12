import type { Metadata, Viewport } from "next";
import "./globals.css";
import { GameProvider } from "./context/GameContext";

export const metadata: Metadata = {
  title: "Human Bingo - Campus Rally",
  description: "Campus-wide real-time human bingo icebreaker",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=Archivo+Narrow:ital,wght@0,400..700;1,400..700&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body className="bg-background text-on-background min-h-screen flex flex-col font-body-md selection:bg-primary-container selection:text-on-primary-container">
        <GameProvider>
          {children}
        </GameProvider>
      </body>
    </html>
  );
}
