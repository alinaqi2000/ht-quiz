import { useState, useEffect, useRef, useCallback } from "react";

export function useCountdown(initialSeconds: number, onExpire?: () => void) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const onExpireRef = useRef(onExpire);
  const expiredRef = useRef(false);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (seconds <= 0) {
      if (!expiredRef.current) {
        expiredRef.current = true;
        onExpireRef.current?.();
      }
      return;
    }

    const timer = setInterval(() => {
      setSeconds((s) => {
        const next = s - 1;
        if (next <= 0 && !expiredRef.current) {
          expiredRef.current = true;
          onExpireRef.current?.();
        }
        return Math.max(0, next);
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [seconds]);

  const reset = useCallback((newSeconds: number) => {
    expiredRef.current = false;
    setSeconds(newSeconds);
  }, []);

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const formatted = `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  const isWarning = seconds <= 300 && seconds > 60;
  const isDanger = seconds <= 60;

  return { seconds, minutes, secs, formatted, isWarning, isDanger, reset };
}
