import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { autosaveSchema, startAttemptSchema } from "@/schemas/attempt.schema";
import bcrypt from "bcryptjs";

// POST: Start a new attempt or return existing incomplete attempt
export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = startAttemptSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { token, name, email } = parsed.data;

  const quizLink = await prisma.quizLink.findUnique({
    where: { token },
    include: { quiz: true },
  });

  if (!quizLink) {
    return NextResponse.json({ error: "Invalid token" }, { status: 404 });
  }

  if (quizLink.expiresAt && quizLink.expiresAt < new Date()) {
    return NextResponse.json({ error: "Link has expired" }, { status: 410 });
  }

  let userId = quizLink.userId;

  // For public quizzes — find or create user
  if (!userId) {
    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email required for public quiz" },
        { status: 400 }
      );
    }

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const tempPassword = await bcrypt.hash(Math.random().toString(36), 10);
      user = await prisma.user.create({
        data: { name, email, password: tempPassword, role: "USER" },
      });
    }
    userId = user.id;
  }
  // Private quiz: the token itself proves identity — no login required

  // Check for existing attempt
  const existingAttempt = await prisma.quizAttempt.findUnique({
    where: { userId_quizId: { userId: userId!, quizId: quizLink.quizId } },
    include: {
      quiz: {
        include: {
          questions: {
            orderBy: { order: "asc" },
            select: { id: true, text: true, optionA: true, optionB: true, optionC: true, optionD: true, difficulty: true, order: true },
          },
        },
      },
    },
  });

  if (existingAttempt?.isComplete) {
    return NextResponse.json(
      { error: "Quiz already completed", alreadySubmitted: true },
      { status: 409 }
    );
  }

  if (existingAttempt) {
    return NextResponse.json({
      attempt: { ...existingAttempt, answers: JSON.parse(existingAttempt.answers) },
      quiz: existingAttempt.quiz,
      questions: existingAttempt.quiz.questions,
    });
  }

  // Mark private link as used
  if (quizLink.userId) {
    await prisma.quizLink.update({
      where: { id: quizLink.id },
      data: { used: true, usedAt: new Date() },
    });
  }

  const attempt = await prisma.quizAttempt.create({
    data: { userId: userId!, quizId: quizLink.quizId, answers: "{}" },
    include: {
      quiz: {
        include: {
          questions: {
            orderBy: { order: "asc" },
            select: { id: true, text: true, optionA: true, optionB: true, optionC: true, optionD: true, difficulty: true, order: true },
          },
        },
      },
    },
  });

  return NextResponse.json({
    attempt: { ...attempt, answers: {} },
    quiz: attempt.quiz,
    questions: attempt.quiz.questions,
  });
}

// PATCH: Autosave answers
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const parsed = autosaveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { attemptId, answers } = parsed.data;

  const attempt = await prisma.quizAttempt.findUnique({ where: { id: attemptId } });
  if (!attempt) return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
  if (attempt.isComplete) return NextResponse.json({ error: "Already completed" }, { status: 409 });

  await prisma.quizAttempt.update({
    where: { id: attemptId },
    data: { answers: JSON.stringify(answers) },
  });

  return NextResponse.json({ success: true });
}
