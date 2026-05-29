import type { Metadata, Viewport } from "next";
import "./globals.css";
import React from "react";
import Sidebar from "@/components/Sidebar";
import BottomNavigation from "@/components/BottomNavigation";
import { AlarmProvider } from "@/components/AlarmProvider";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import { ToastProvider } from "@/components/ToastProvider";

export const metadata: Metadata = {
  title: "AI LifeOS — Personal AI Operating System",
  description:
    "An intelligent personal productivity companion — Study analytics, Fitness logs, Planners, habit Memory, and AI chat.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AI LifeOS",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#040507",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Anti-flicker dynamic theme CSS injector script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const saved = localStorage.getItem('lifeos_theme_colors');
                  if (saved) {
                    const colors = JSON.parse(saved);
                    if (colors.primary) {
                      document.documentElement.style.setProperty('--dynamic-primary', colors.primary);
                      document.documentElement.style.setProperty('--dynamic-accent', colors.accent || colors.primary);
                      const hexToRgb = (hex) => {
                        const r = parseInt(hex.slice(1, 3), 16);
                        const g = parseInt(hex.slice(3, 5), 16);
                        const b = parseInt(hex.slice(5, 7), 16);
                        return r + ', ' + g + ', ' + b;
                      };
                      document.documentElement.style.setProperty('--dynamic-primary-rgb', hexToRgb(colors.primary));
                      document.documentElement.style.setProperty('--dynamic-accent-rgb', hexToRgb(colors.accent || colors.primary));
                    }
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        style={{ background: "#040507", minHeight: "100svh" }}
        className="antialiased text-slate-200 pb-16 md:pb-0"
      >
        <AlarmProvider>
          <ToastProvider>
            <ServiceWorkerRegister />
            <div className="flex min-h-screen relative">
              {/* Desktop Navigation Sidebar */}
              <Sidebar />

              {/* Main Application Workspace */}
              <div className="flex-1 min-w-0 relative">{children}</div>

              {/* Mobile Bottom Navigation */}
              <BottomNavigation />
            </div>
          </ToastProvider>
        </AlarmProvider>
      </body>
    </html>
  );
}
