"use client";

import { useEffect, useState } from "react";
import { useCountdown } from "@/hooks/use-countdown";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

interface CountdownTimerProps {
  // effective end time as ISO string (already min of attempt deadline & link expiry)
  endAt: string;
  onExpire: () => void;
}

export function CountdownTimer({ endAt, onExpire }: CountdownTimerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-lg font-mono font-bold text-lg bg-zinc-900 text-zinc-300 border border-zinc-800">
        <Clock className="w-4 h-4" />
        --:--
      </div>
    );
  }

  return <TimerDisplay endAt={new Date(endAt).getTime()} onExpire={onExpire} />;
}

function TimerDisplay({ endAt, onExpire }: { endAt: number; onExpire: () => void }) {
  const { formatted, seconds, isWarning, isDanger } = useCountdown(endAt, onExpire);

  // Show label based on how much time is left
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const showLabel = days > 0 || hours > 0;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg font-mono font-bold transition-colors",
        isDanger
          ? "bg-red-600/20 text-red-400 border border-red-600/40 animate-pulse text-lg"
          : isWarning
          ? "bg-yellow-600/20 text-yellow-400 border border-yellow-600/40 text-lg"
          : showLabel
          ? "bg-zinc-900 text-zinc-300 border border-zinc-800 text-base"
          : "bg-zinc-900 text-zinc-300 border border-zinc-800 text-lg"
      )}
    >
      <Clock className="w-4 h-4 shrink-0" />
      <span>{formatted}</span>
    </div>
  );
}
