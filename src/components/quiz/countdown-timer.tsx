"use client";

import { useEffect, useState } from "react";
import { useCountdown } from "@/hooks/use-countdown";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

interface CountdownTimerProps {
  initialSeconds: number;
  onExpire: () => void;
  startedAt: string;
}

export function CountdownTimer({
  initialSeconds,
  onExpire,
  startedAt,
}: CountdownTimerProps) {
  const [remaining, setRemaining] = useState<number | null>(null);

  // Calculate remaining only on client after mount to avoid hydration mismatch
  useEffect(() => {
    const elapsed = Math.floor(
      (Date.now() - new Date(startedAt).getTime()) / 1000
    );
    setRemaining(Math.max(0, initialSeconds - elapsed));
  }, [initialSeconds, startedAt]);

  if (remaining === null) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-lg font-mono font-bold text-lg bg-zinc-900 text-zinc-300 border border-zinc-800">
        <Clock className="w-4 h-4" />
        --:--
      </div>
    );
  }

  return <TimerDisplay remaining={remaining} onExpire={onExpire} />;
}

function TimerDisplay({
  remaining,
  onExpire,
}: {
  remaining: number;
  onExpire: () => void;
}) {
  const { formatted, isWarning, isDanger } = useCountdown(remaining, onExpire);

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg font-mono font-bold text-lg transition-colors",
        isDanger
          ? "bg-red-600/20 text-red-400 border border-red-600/40 animate-pulse"
          : isWarning
          ? "bg-yellow-600/20 text-yellow-400 border border-yellow-600/40"
          : "bg-zinc-900 text-zinc-300 border border-zinc-800"
      )}
    >
      <Clock className="w-4 h-4" />
      {formatted}
    </div>
  );
}
