export const dynamic = "force-dynamic";
import { AdminHeader } from "@/components/admin/header";
import { StatsCard } from "@/components/admin/stats-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { Users, BookOpen, CheckCircle, TrendingUp } from "lucide-react";
import { format } from "date-fns";

async function getDashboardData() {
  const [totalUsers, totalQuizzes, totalAttempts, recentAttempts, quizStats] =
    await Promise.all([
      prisma.user.count({ where: { role: "USER" } }),
      prisma.quiz.count(),
      prisma.quizAttempt.count({ where: { isComplete: true } }),
      prisma.quizAttempt.findMany({
        where: { isComplete: true },
        include: {
          user: { select: { name: true, email: true } },
          quiz: { select: { title: true } },
        },
        orderBy: { submittedAt: "desc" },
        take: 8,
      }),
      prisma.quiz.findMany({
        include: {
          _count: { select: { attempts: { where: { isComplete: true } } } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

  return { totalUsers, totalQuizzes, totalAttempts, recentAttempts, quizStats };
}

export default async function DashboardPage() {
  const { totalUsers, totalQuizzes, totalAttempts, recentAttempts, quizStats } =
    await getDashboardData();

  return (
    <div className="flex flex-col flex-1">
      <AdminHeader
        title="Dashboard"
        description="Overview of your quiz platform"
      />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Users"
            value={totalUsers}
            description="Registered participants"
            icon={Users}
          />
          <StatsCard
            title="Total Quizzes"
            value={totalQuizzes}
            description="Active quiz sets"
            icon={BookOpen}
          />
          <StatsCard
            title="Completions"
            value={totalAttempts}
            description="Quiz attempts submitted"
            icon={CheckCircle}
          />
          <StatsCard
            title="Avg Score"
            value={
              recentAttempts.length > 0
                ? `${Math.round(
                    recentAttempts.reduce(
                      (acc, a) =>
                        acc +
                        (a.totalPoints
                          ? ((a.score || 0) / a.totalPoints) * 100
                          : 0),
                      0
                    ) / recentAttempts.length
                  )}%`
                : "N/A"
            }
            description="Average completion score"
            icon={TrendingUp}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-base">
                Recent Submissions
              </CardTitle>
              <CardDescription className="text-slate-400">
                Latest quiz completions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentAttempts.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-6">
                  No submissions yet
                </p>
              ) : (
                <div className="space-y-3">
                  {recentAttempts.map((attempt) => (
                    <div
                      key={attempt.id}
                      className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">
                          {attempt.user.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {attempt.quiz.title}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-sky-400">
                          {attempt.totalPoints
                            ? `${attempt.score}/${attempt.totalPoints}`
                            : "—"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {attempt.submittedAt
                            ? format(new Date(attempt.submittedAt), "MMM d, HH:mm")
                            : "—"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-base">
                Quiz Performance
              </CardTitle>
              <CardDescription className="text-slate-400">
                Participation per quiz
              </CardDescription>
            </CardHeader>
            <CardContent>
              {quizStats.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-6">
                  No quizzes yet
                </p>
              ) : (
                <div className="space-y-3">
                  {quizStats.map((quiz) => (
                    <div
                      key={quiz.id}
                      className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white">
                          {quiz.title}
                        </p>
                        <Badge
                          variant="outline"
                          className={
                            quiz.type === "PUBLIC"
                              ? "border-green-600/50 text-green-400 text-xs"
                              : "border-orange-600/50 text-orange-400 text-xs"
                          }
                        >
                          {quiz.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="border-slate-600 text-slate-300 text-xs"
                        >
                          {quiz._count.attempts} attempts
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
