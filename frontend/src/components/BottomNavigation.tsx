"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  Brain,
  Activity,
  Settings,
} from "lucide-react";

const NAV_ITEMS = [
  { name: "Home",     href: "/dashboard", icon: LayoutDashboard },
  { name: "Chat",     href: "/chat",      icon: MessageSquare },
  { name: "Study",    href: "/study",     icon: Brain },
  { name: "Fitness",  href: "/fitness",   icon: Activity },
  { name: "Settings", href: "/settings",  icon: Settings },
];

export default function BottomNavigation() {
  const pathname = usePathname();

  const triggerHaptic = () => {
    if (typeof window !== "undefined" && window.navigator?.vibrate) {
      window.navigator.vibrate(12);
    }
  };

  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 z-40"
      style={{
        background: "rgba(4,5,7,0.92)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        boxShadow: "0 -8px 40px rgba(0,0,0,0.5)",
      }}
    >
      <div className="max-w-[430px] mx-auto flex items-stretch justify-around h-[60px] px-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={triggerHaptic}
              className="flex flex-col items-center justify-center flex-1 py-1 relative transition-all duration-200 select-none group"
            >
              {/* Active pill background */}
              {isActive && (
                <div
                  className="absolute inset-x-2 top-1 bottom-1 rounded-2xl"
                  style={{
                    background: "rgba(var(--dynamic-primary-rgb), 0.12)",
                    border: "1px solid rgba(var(--dynamic-primary-rgb), 0.15)",
                  }}
                />
              )}

              {/* Icon */}
              <div className="relative z-10 flex flex-col items-center gap-1">
                <Icon
                  className={`w-[19px] h-[19px] transition-all duration-300 ${
                    isActive ? "stroke-[2.5px]" : "stroke-[1.8px] group-active:scale-90"
                  }`}
                  style={{
                    color: isActive ? "var(--dynamic-primary)" : "#4b5563",
                    filter: isActive
                      ? "drop-shadow(0 0 6px rgba(var(--dynamic-primary-rgb),0.5))"
                      : "none",
                  }}
                />

                {/* Label */}
                <span
                  className="text-[9px] font-bold tracking-wider leading-none transition-all duration-300"
                  style={{
                    color: isActive ? "var(--dynamic-primary)" : "#374151",
                    letterSpacing: "0.07em",
                  }}
                >
                  {item.name.toUpperCase()}
                </span>
              </div>

              {/* Active dot indicator */}
              {isActive && (
                <span
                  className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{
                    background: "var(--dynamic-primary)",
                    boxShadow: "0 0 6px rgba(var(--dynamic-primary-rgb),0.8)",
                  }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
