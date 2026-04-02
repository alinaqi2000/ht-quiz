import { useEffect, useRef, useCallback } from "react";

export function useAutosave(
  attemptId: string,
  answers: Record<string, string>,
  interval = 30000
) {
  const saveRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>("");

  const save = useCallback(async () => {
    const current = JSON.stringify(answers);
    if (current === lastSavedRef.current) return;

    try {
      await fetch("/api/quiz/attempt", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId, answers }),
      });
      lastSavedRef.current = current;
    } catch {
      // silently fail — answers are also in localStorage
    }
  }, [attemptId, answers]);

  // Save to localStorage on every change
  useEffect(() => {
    localStorage.setItem(`quiz_draft_${attemptId}`, JSON.stringify(answers));
  }, [attemptId, answers]);

  // Periodic autosave
  useEffect(() => {
    saveRef.current = setInterval(save, interval);
    return () => {
      if (saveRef.current) clearInterval(saveRef.current);
    };
  }, [save, interval]);

  // Save on unmount
  useEffect(() => {
    return () => {
      save();
    };
  }, [save]);

  return { save };
}
