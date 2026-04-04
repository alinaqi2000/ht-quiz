export const dynamic = "force-dynamic";
import { AdminHeader } from "@/components/admin/header";
import { AssignForm } from "@/components/admin/assign-form";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function AssignQuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [quiz, users, existingLinks] = await Promise.all([
    prisma.quiz.findUnique({ where: { id } }),
    prisma.user.findMany({
      where: { role: "USER" },
      select: { id: true, name: true, email: true, isGroupLeader: true },
      orderBy: { name: "asc" },
    }),
    prisma.quizLink.findMany({
      where: { quizId: id },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!quiz) notFound();

  const privateLinks = existingLinks.filter((l) => l.linkType === "PRIVATE");
  const publicLinks = existingLinks.filter((l) => l.linkType === "PUBLIC");
  const internalLinks = existingLinks.filter((l) => l.linkType === "INTERNAL");

  return (
    <div className="flex flex-col flex-1">
      <AdminHeader
        title={`Assign — ${quiz.title}`}
        description="Generate quiz links for users or share a public/internal link"
      />
      <div className="p-4 sm:p-6">
        <AssignForm
          quizId={id}
          users={users}
          existingLinks={JSON.parse(JSON.stringify(privateLinks))}
          existingPublicLinks={JSON.parse(JSON.stringify(publicLinks))}
          existingInternalLinks={JSON.parse(JSON.stringify(internalLinks))}
        />
      </div>
    </div>
  );
}
