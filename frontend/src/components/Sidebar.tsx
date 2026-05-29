"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  Brain,
  Activity,
  CalendarDays,
  Settings,
  Cpu,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/dashboard",  icon: LayoutDashboard },
  { name: "AI Chat",   href: "/chat",        icon: MessageSquare },
  { name: "Study",     href: "/study",       icon: Brain },
  { name: "Fitness",   href: "/fitness",     icon: Activity },
  { name: "Planner",   href: "/planner",     icon: CalendarDays },
  { name: "Settings",  href: "/settings",    icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="hidden md:flex flex-col w-64 min-h-screen flex-shrink-0 sticky top-0 h-screen"
      style={{
        background: "rgba(4,5,7,0.98)",
        borderRight: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b"
           style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <div
          className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{
            background: "linear-gradient(135deg, var(--dynamic-primary), var(--dynamic-accent))",
            boxShadow: "0 0 20px rgba(var(--dynamic-primary-rgb),0.35)",
          }}
        >
          <Cpu className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-black text-white leading-none">AI LifeOS</h1>
          <p className="text-[10px] font-bold mt-0.5" style={{ color: "var(--dynamic-primary)" }}>
            Personal AI OS
          </p>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex flex-col gap-1 p-3 flex-grow">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className="sidebar-link"
              style={isActive ? {
                color: "white",
                background: `rgba(var(--dynamic-primary-rgb), 0.12)`,
                border: `1px solid rgba(var(--dynamic-primary-rgb), 0.2)`,
              } : {}}
            >
              <Icon
                className="w-4.5 h-4.5 flex-shrink-0"
                style={{ color: isActive ? "var(--dynamic-primary)" : "#4b5563" }}
              />
              <span className="font-semibold">{item.name}</span>
              {isActive && (
                <span
                  className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{
                    background: "var(--dynamic-primary)",
                    boxShadow: "0 0 6px rgba(var(--dynamic-primary-rgb),0.7)",
                  }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <div
          className="rounded-2xl p-3 text-xs"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
            <span className="font-bold text-white text-[11px]">AI System Online</span>
          </div>
          <p className="text-slate-500 text-[10px] leading-relaxed">
            FastAPI backend connected. All modules active.
          </p>
        </div>
      </div>
    </aside>
  );
}
