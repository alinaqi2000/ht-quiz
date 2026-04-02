"use client";

import { cn } from "@/lib/utils";

interface Question {
  id: string;
  text: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  difficulty: string;
}

interface QuestionCardProps {
  question: Question;
  index: number;
  selectedAnswer?: string;
  onAnswer: (questionId: string, answer: string) => void;
}

const options = [
  { key: "A", field: "optionA" as const },
  { key: "B", field: "optionB" as const },
  { key: "C", field: "optionC" as const },
  { key: "D", field: "optionD" as const },
];

const difficultyColors = {
  EASY: "border-green-600/50 text-green-400 bg-green-900/20",
  MEDIUM: "border-yellow-600/50 text-yellow-400 bg-yellow-900/20",
  HARD: "border-red-600/50 text-red-400 bg-red-900/20",
};

export function QuestionCard({
  question,
  index,
  selectedAnswer,
  onAnswer,
}: QuestionCardProps) {
  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 sm:p-6">
      <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-5">
        <div className="w-8 h-8 bg-sky-600/20 border border-sky-600/40 rounded-lg flex items-center justify-center shrink-0">
          <span className="text-sky-400 text-sm font-bold">{index + 1}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded border font-medium",
                difficultyColors[
                  question.difficulty as keyof typeof difficultyColors
                ]
              )}
            >
              {question.difficulty}
            </span>
          </div>
          <p className="text-white text-sm sm:text-base font-medium leading-relaxed">
            {question.text}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 ml-0 sm:ml-11">
        {options.map(({ key, field }) => {
          const isSelected = selectedAnswer === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onAnswer(question.id, key)}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border text-left transition-all active:scale-[0.98]",
                isSelected
                  ? "bg-sky-600/20 border-sky-500 shadow-sky-500/10 shadow-sm"
                  : "bg-slate-700/50 border-slate-600 hover:bg-slate-700 hover:border-slate-500"
              )}
            >
              <div
                className={cn(
                  "w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold shrink-0",
                  isSelected
                    ? "bg-sky-600 text-white"
                    : "bg-slate-600 text-slate-400"
                )}
              >
                {key}
              </div>
              <span
                className={cn(
                  "text-sm",
                  isSelected ? "text-white font-medium" : "text-slate-300"
                )}
              >
                {question[field]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
