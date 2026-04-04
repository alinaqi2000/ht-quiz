import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { token } = await req.json();

  if (!token) {
    return NextResponse.json({ error: "Token required" }, { status: 400 });
  }

  const quizLink = await prisma.quizLink.findUnique({
    where: { token },
    include: {
      quiz: {
        include: { _count: { select: { questions: true } } },
      },
      user: { select: { id: true, name: true, email: true } },
    },
  });

  if (!quizLink) {
    return NextResponse.json({ error: "Invalid link" }, { status: 404 });
  }

  if (quizLink.expiresAt && quizLink.expiresAt < new Date()) {
    return NextResponse.json({ error: "Link has expired" }, { status: 410 });
  }

  // For private quizzes, check if already used
  if (quizLink.linkType === "PRIVATE" && quizLink.userId && quizLink.used) {
    return NextResponse.json(
      { error: "This link has already been used", alreadyUsed: true },
      { status: 409 }
    );
  }

  const session = await auth();

  // Check if user has already completed this quiz
  if (session?.user?.id) {
    const existingAttempt = await prisma.quizAttempt.findUnique({
      where: {
        userId_quizId: {
          userId: session.user.id,
          quizId: quizLink.quizId,
        },
      },
    });

    if (existingAttempt?.isComplete) {
      return NextResponse.json(
        { error: "You have already completed this quiz", alreadySubmitted: true },
        { status: 409 }
      );
    }
  }

  return NextResponse.json({
    valid: true,
    quiz: quizLink.quiz,
    linkedUser: quizLink.user,
    isPublic: quizLink.linkType === "PUBLIC",
    isInternal: quizLink.linkType === "INTERNAL",
    isPrivate: quizLink.linkType === "PRIVATE",
  });
}
