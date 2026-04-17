import { useState, useEffect, useRef, useCallback } from "react";

function getRemainingSeconds(endAt: number): number {
  return Math.max(0, Math.floor((endAt - Date.now()) / 1000));
}

export function formatCountdown(seconds: number): string {
  if (seconds <= 0) return "00:00";

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (days > 0) {
    return `${days}d ${String(hours).padStart(2, "0")}h`;
  }
  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

// endAt: absolute timestamp in milliseconds
export function useCountdown(endAt: number, onExpire?: () => void) {
  const [seconds, setSeconds] = useState(() => getRemainingSeconds(endAt));
  const onExpireRef = useRef(onExpire);
  const expiredRef = useRef(false);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    expiredRef.current = false;

    const tick = () => {
      const remaining = getRemainingSeconds(endAt);
      setSeconds(remaining);
      if (remaining <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpireRef.current?.();
      }
    };

    tick(); // immediate sync
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [endAt]);

  const reset = useCallback((newEndAt: number) => {
    expiredRef.current = false;
    setSeconds(getRemainingSeconds(newEndAt));
  }, []);

  const formatted = formatCountdown(seconds);
  const isWarning = seconds <= 300 && seconds > 60;
  const isDanger = seconds <= 60;

  return { seconds, formatted, isWarning, isDanger, reset };
}
