"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  BarChart3,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { signOut } from "next-auth/react";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/quizzes", label: "Quizzes", icon: BookOpen },
  { href: "/admin/results", label: "Results", icon: BarChart3 },
];

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
        <span className="text-black font-bold text-sm">T</span>
      </div>
      <div>
        <p className="text-white font-semibold text-sm leading-tight">Techsoft Quiz</p>
        <p className="text-zinc-500 text-xs">Admin Panel</p>
      </div>
    </div>
  );
}

function SidebarContent({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="p-5 border-b border-zinc-800">
        <Brand />
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800 border border-transparent"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-zinc-800">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all border border-transparent"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sign Out
        </button>
      </div>
    </>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <div className="flex min-h-screen bg-black">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 min-h-screen bg-zinc-950 border-r border-zinc-800 flex-col shrink-0">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-zinc-950 border-r border-zinc-800 flex flex-col transition-transform duration-300 lg:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <Brand />
          <button
            onClick={() => setOpen(false)}
            className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <SidebarContent pathname={pathname} onNavigate={() => setOpen(false)} />
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-zinc-950 border-b border-zinc-800 sticky top-0 z-30">
          <button
            onClick={() => setOpen(true)}
            className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <span className="text-black font-bold text-xs">T</span>
            </div>
            <span className="text-white text-sm font-semibold">Techsoft Quiz</span>
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}
