export const dynamic = "force-dynamic";
import { AdminHeader } from "@/components/admin/header";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { CheckCircle, Clock, Link as LinkIcon } from "lucide-react";

export default async function UserLinksPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      quizLinks: {
        include: { quiz: { select: { title: true, type: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) notFound();

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  return (
    <div className="flex flex-col flex-1">
      <AdminHeader
        title={`Quiz Links — ${user.name}`}
        description={`All quiz links assigned to ${user.email}`}
      />

      <div className="p-6 space-y-4">
        {user.quizLinks.length === 0 ? (
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="py-12 text-center text-zinc-500">
              No quiz links assigned to this user yet.
            </CardContent>
          </Card>
        ) : (
          user.quizLinks.map((link) => (
            <Card
              key={link.id}
              className="bg-zinc-900/50 border-zinc-800"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-base">
                    {link.quiz.title}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={
                        link.used
                          ? "border-green-600/50 text-green-400"
                          : "border-zinc-700 text-zinc-400"
                      }
                    >
                      {link.used ? (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" /> Used
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3 mr-1" /> Unused
                        </>
                      )}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 bg-zinc-950 rounded-md p-2">
                  <LinkIcon className="w-3 h-3 text-zinc-500 shrink-0" />
                  <code className="text-xs text-amber-400 break-all">
                    {baseUrl}/quiz/{link.token}
                  </code>
                </div>
                <div className="flex gap-4 text-xs text-zinc-500">
                  <span>Created: {format(new Date(link.createdAt), "MMM d, yyyy HH:mm")}</span>
                  {link.usedAt && (
                    <span>Used: {format(new Date(link.usedAt), "MMM d, yyyy HH:mm")}</span>
                  )}
                  {link.expiresAt && (
                    <span>Expires: {format(new Date(link.expiresAt), "MMM d, yyyy")}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
