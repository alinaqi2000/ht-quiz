"use client";

import { useState, useCallback, useEffect } from "react";
import { QuestionCard } from "./question-card";
import { CountdownTimer } from "./countdown-timer";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useAutosave } from "@/hooks/use-autosave";

interface Question {
  id: string;
  text: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  difficulty: string;
}

interface Quiz {
  id: string;
  title: string;
  durationMin: number;
}

interface QuizShellProps {
  attempt: {
    id: string;
    startedAt: string;
    answers: Record<string, string>;
    isComplete: boolean;
  };
  quiz: Quiz;
  questions: Question[];
}

export function QuizShell({ attempt, quiz, questions }: QuizShellProps) {
  const [answers, setAnswers] = useState<Record<string, string>>(attempt.answers || {});

  // Restore from localStorage after mount (avoids hydration mismatch)
  useEffect(() => {
    const saved = localStorage.getItem(`quiz_draft_${attempt.id}`);
    if (saved) {
      try {
        setAnswers(JSON.parse(saved));
      } catch {}
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt.id]);

  const [submitted, setSubmitted] = useState(attempt.isComplete);
  const [submitting, setSubmitting] = useState(false);

  useAutosave(attempt.id, answers);

  const handleAnswer = useCallback((questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (submitted || submitting) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId: attempt.id, answers }),
      });

      if (!res.ok) {
        toast.error("Failed to submit. Please try again.");
        setSubmitting(false);
        return;
      }

      setSubmitted(true);
      localStorage.removeItem(`quiz_draft_${attempt.id}`);
      toast.success("Quiz submitted successfully!");
    } catch {
      toast.error("Network error. Please try again.");
      setSubmitting(false);
    }
  }, [attempt.id, answers, submitted, submitting]);

  const handleTimerExpire = useCallback(() => {
    if (!submitted && !submitting) {
      toast.info("Time's up! Submitting your answers...");
      handleSubmit();
    }
  }, [submitted, submitting, handleSubmit]);

  const answered = Object.keys(answers).length;
  const progress = questions.length > 0 ? (answered / questions.length) * 100 : 0;

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-lg w-full text-center space-y-6 px-4">
          <div className="w-20 h-20 bg-green-900/30 border-2 border-green-500 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Quiz Submitted!</h2>
            <p className="text-slate-400 text-lg">
              Your responses for <span className="text-white font-medium">{quiz.title}</span> have been recorded.
            </p>
          </div>
          <p className="text-slate-500 text-sm">
            Thank you for completing {quiz.title}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-800">
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-white font-semibold text-sm sm:text-base truncate">
                {quiz.title}
              </h1>
              <p className="text-slate-400 text-xs">
                {answered}/{questions.length} answered
              </p>
            </div>
            <CountdownTimer
              initialSeconds={quiz.durationMin * 60}
              onExpire={handleTimerExpire}
              startedAt={attempt.startedAt}
            />
          </div>
          <Progress
            value={progress}
            className="mt-2 h-1 bg-slate-800"
          />
        </div>
      </div>

      {/* Questions */}
      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-3 sm:space-y-4">
        {questions.map((question, index) => (
          <QuestionCard
            key={question.id}
            question={question}
            index={index}
            selectedAnswer={answers[question.id]}
            onAnswer={handleAnswer}
          />
        ))}

        {/* Submit */}
        <div className="pt-4 pb-8">
          {answered < questions.length && (
            <p className="text-yellow-400 text-sm mb-3 text-center">
              You have {questions.length - answered} unanswered question(s)
            </p>
          )}
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 text-base"
            size="lg"
          >
            {submitting ? "Submitting..." : "Submit Quiz"}
          </Button>
        </div>
      </div>
    </div>
  );
}
