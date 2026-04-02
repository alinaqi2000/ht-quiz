"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Clock, HelpCircle, BookOpen, AlertTriangle } from "lucide-react";

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  difficulty: string;
  durationMin: number;
  type: string;
  _count: { questions: number };
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface QuizEntryClientProps {
  token: string;
  quiz: Quiz;
  linkedUser: User | null;
  isPrivate: boolean;
  alreadyUsed: boolean;
  groupLeaders: User[];
  sessionUserId?: string;
}

const difficultyColors = {
  EASY: "border-green-600/50 text-green-400",
  MEDIUM: "border-yellow-600/50 text-yellow-400",
  HARD: "border-red-600/50 text-red-400",
};

export function QuizEntryClient({
  token,
  quiz,
  linkedUser,
  isPrivate,
  alreadyUsed,
  groupLeaders,
}: QuizEntryClientProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [groupLeaderId, setGroupLeaderId] = useState("");
  const [starting, setStarting] = useState(false);

  if (alreadyUsed && isPrivate) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md px-4">
          <div className="w-16 h-16 bg-red-900/30 border border-red-600/40 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Link Already Used</h1>
          <p className="text-slate-400">
            This quiz link has already been used and cannot be used again.
          </p>
        </div>
      </div>
    );
  }

  async function handleStart() {
    setStarting(true);

    const body: Record<string, string> = { token };
    if (!isPrivate || !linkedUser) {
      if (!name.trim() || !email.trim()) {
        toast.error("Please enter your name and email");
        setStarting(false);
        return;
      }
      body.name = name;
      body.email = email;
      if (groupLeaderId) body.groupLeaderId = groupLeaderId;
    }

    const res = await fetch("/api/quiz/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error || "Failed to start quiz");
      setStarting(false);
      return;
    }

    router.push(`/quiz/${token}/attempt`);
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-4">
        {/* Quiz Info Card */}
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 sm:p-6 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-4 h-4 text-sky-400" />
              <span className="text-sky-400 text-xs font-medium uppercase tracking-wide">
                Quiz
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">{quiz.title}</h1>
            {quiz.description && (
              <p className="text-slate-400 text-sm mt-1">{quiz.description}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 bg-slate-700/50 rounded-lg px-3 py-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-300 text-sm">
                {quiz._count.questions} questions
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-700/50 rounded-lg px-3 py-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-300 text-sm">
                {quiz.durationMin} minutes
              </span>
            </div>
            <Badge
              variant="outline"
              className={
                difficultyColors[quiz.difficulty as keyof typeof difficultyColors]
              }
            >
              {quiz.difficulty}
            </Badge>
          </div>
        </div>

        {/* Entry Form */}
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 sm:p-6 space-y-5">
          <h2 className="text-white font-semibold">
            {linkedUser ? "Ready to Start" : "Enter Your Details"}
          </h2>

          {linkedUser ? (
            <div className="bg-slate-700/50 rounded-lg p-4">
              <p className="text-slate-400 text-sm">Taking as</p>
              <p className="text-white font-medium">{linkedUser.name}</p>
              <p className="text-slate-400 text-sm">{linkedUser.email}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Your Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 h-11"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Your Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 h-11"
                />
              </div>
              {groupLeaders.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-slate-300">
                    Group Leader (optional)
                  </Label>
                  <Select
                    value={groupLeaderId}
                    onValueChange={setGroupLeaderId}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-11">
                      <SelectValue placeholder="Select a group leader" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {groupLeaders.map((leader) => (
                        <SelectItem
                          key={leader.id}
                          value={leader.id}
                          className="text-white"
                        >
                          {leader.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          <div>
            <p className="text-slate-500 text-xs mb-4">
              Once started, the timer begins and you cannot pause. Make sure
              you have {quiz.durationMin} minutes available.
            </p>
            <Button
              onClick={handleStart}
              disabled={starting}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold h-12 text-base"
              size="lg"
            >
              {starting ? "Starting..." : "Start Quiz"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
