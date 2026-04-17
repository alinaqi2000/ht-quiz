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
import { Clock, HelpCircle, BookOpen, AlertTriangle, Shield, CalendarClock } from "lucide-react";
import { format } from "date-fns";

interface Quiz {
  id: string;
  title: string;
  description: string | null;
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
  isInternal: boolean;
  alreadyUsed: boolean;
  groupLeaders: User[];
  sessionUserId?: string;
  sessionUserName?: string | null;
  sessionUserEmail?: string | null;
  expiresAt?: string | null;
}

export function QuizEntryClient({
  token,
  quiz,
  linkedUser,
  isPrivate,
  isInternal,
  alreadyUsed,
  groupLeaders,
  expiresAt,
}: QuizEntryClientProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [groupLeaderId, setGroupLeaderId] = useState("");
  const [starting, setStarting] = useState(false);

  if (alreadyUsed && isPrivate) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md px-4">
          <div className="w-16 h-16 bg-red-900/30 border border-red-600/40 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Link Already Used</h1>
          <p className="text-zinc-400">
            This quiz link has already been used and cannot be used again.
          </p>
        </div>
      </div>
    );
  }

  // For public: need name + email. For internal: email only. For private: linked user shown.
  const isPublicEntry = !isPrivate && !isInternal && !linkedUser;

  async function handleStart() {
    setStarting(true);

    const body: Record<string, string> = { token };

    if (isInternal) {
      if (!email.trim()) {
        toast.error("Please enter your email");
        setStarting(false);
        return;
      }
      body.email = email;
    } else if (isPublicEntry) {
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

    const data = await res.json();

    if (!res.ok) {
      if (data.alreadySubmitted && data.attemptId) {
        // Redirect straight to their results
        const uid = data.userId;
        router.push(`/quiz/${token}/results/${data.attemptId}?uid=${uid}`);
        return;
      }
      toast.error(data.error || "Failed to start quiz");
      setStarting(false);
      return;
    }

    // For internal links, pass userId in URL so the server-rendered attempt page can find the attempt
    if (isInternal && data.attempt?.userId) {
      router.push(`/quiz/${token}/attempt?uid=${data.attempt.userId}`);
    } else {
      router.push(`/quiz/${token}/attempt`);
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-4">
        {/* Quiz Info Card */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 text-xs font-medium uppercase tracking-wide">
                Quiz
              </span>
              {isInternal && (
                <span className="flex items-center gap-1 text-blue-400 text-xs font-medium bg-blue-900/20 border border-blue-600/30 px-2 py-0.5 rounded-full">
                  <Shield className="w-3 h-3" />
                  Internal
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">{quiz.title}</h1>
            {quiz.description && (
              <p className="text-zinc-400 text-sm mt-1">{quiz.description}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 bg-zinc-800/50 rounded-lg px-3 py-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-zinc-300 text-sm">
                {quiz._count.questions} questions
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-zinc-800/50 rounded-lg px-3 py-1.5">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-zinc-300 text-sm">
                {quiz.durationMin} minutes
              </span>
            </div>
          </div>
        </div>

        {/* Entry Form */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-5">
          <h2 className="text-white font-semibold">
            {linkedUser ? "Ready to Start" : isInternal ? "Verify Your Identity" : "Enter Your Details"}
          </h2>

          {linkedUser ? (
            <div className="bg-zinc-800/50 rounded-lg p-4">
              <p className="text-zinc-400 text-sm">Taking as</p>
              <p className="text-white font-medium">{linkedUser.name}</p>
              <p className="text-zinc-400 text-sm">{linkedUser.email}</p>
            </div>
          ) : isInternal ? (
            <div className="space-y-4">
              <p className="text-zinc-400 text-sm">
                This quiz is for registered users. Enter your registered email to continue.
              </p>
              <div className="space-y-2">
                <Label className="text-zinc-300">Your Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 h-11"
                  onKeyDown={(e) => e.key === "Enter" && handleStart()}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-zinc-300">Your Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 h-11"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Your Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 h-11"
                />
              </div>
              {groupLeaders.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-zinc-300">
                    Group Leader (optional)
                  </Label>
                  <Select
                    value={groupLeaderId}
                    onValueChange={setGroupLeaderId}
                  >
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white h-11">
                      <SelectValue placeholder="Select a group leader" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800">
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
            {(() => {
              const durationMs = quiz.durationMin * 60 * 1000;
              const linkExpiresMs = expiresAt ? new Date(expiresAt).getTime() : null;
              // Time remaining on the link right now
              const linkRemainingMs = linkExpiresMs ? linkExpiresMs - Date.now() : null;
              // Will the link expire before the full duration?
              const linkExpiresSooner = linkRemainingMs !== null && linkRemainingMs < durationMs;

              return linkExpiresSooner ? (
                <div className="flex items-start gap-2 bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-3 mb-4">
                  <CalendarClock className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                  <p className="text-yellow-300 text-xs">
                    This quiz link expires on{" "}
                    <span className="font-semibold">{format(new Date(expiresAt!), "MMM d, yyyy 'at' HH:mm")}</span>.
                    Your quiz will end at that time regardless of how much time remains on the timer.
                  </p>
                </div>
              ) : (
                <p className="text-zinc-500 text-xs mb-4">
                  Once started, the timer begins and you cannot pause. Make sure
                  you have {quiz.durationMin} minutes available.
                </p>
              );
            })()}

            <Button
              onClick={handleStart}
              disabled={starting}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-black font-semibold h-12 text-base"
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
