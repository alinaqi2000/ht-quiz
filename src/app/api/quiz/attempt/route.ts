import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { autosaveSchema, startAttemptSchema } from "@/schemas/attempt.schema";
import bcrypt from "bcryptjs";

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function reorderByStoredOrder<T extends { id: string }>(questions: T[], orderJson: string): T[] {
  try {
    const order: string[] = JSON.parse(orderJson);
    const qMap = new Map(questions.map((q) => [q.id, q]));
    const reordered = order.map((id) => qMap.get(id)).filter(Boolean) as T[];
    const inOrder = new Set(order);
    const extras = questions.filter((q) => !inOrder.has(q.id));
    return [...reordered, ...extras];
  } catch {
    return questions;
  }
}

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

  if (quizLink.linkType === "INTERNAL") {
    // Internal link: verify by email — user must be registered
    if (!email) {
      return NextResponse.json({ error: "Email required for this quiz" }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { error: "This email is not registered in the system. Please contact your administrator." },
        { status: 403 }
      );
    }
    userId = user.id;
  } else if (!userId) {
    // Public link: find or create user from name/email
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

  const allQuestions = await prisma.question.findMany({
    where: { quizId: quizLink.quizId },
    orderBy: { order: "asc" },
    select: { id: true, text: true, optionA: true, optionB: true, optionC: true, optionD: true, difficulty: true, order: true },
  });

  // Check for existing attempt
  const existingAttempt = await prisma.quizAttempt.findUnique({
    where: { userId_quizId: { userId: userId!, quizId: quizLink.quizId } },
    include: { quiz: { select: { id: true, title: true, durationMin: true, type: true } } },
  });

  if (existingAttempt?.isComplete) {
    return NextResponse.json(
      { error: "Quiz already completed", alreadySubmitted: true, attemptId: existingAttempt.id, userId: existingAttempt.userId },
      { status: 409 }
    );
  }

  if (existingAttempt) {
    const questions = existingAttempt.questionOrder
      ? reorderByStoredOrder(allQuestions, existingAttempt.questionOrder)
      : allQuestions;

    return NextResponse.json({
      attempt: { ...existingAttempt, answers: JSON.parse(existingAttempt.answers) },
      quiz: existingAttempt.quiz,
      questions,
    });
  }

  // Mark private link as used
  if (quizLink.linkType === "PRIVATE" && quizLink.userId) {
    await prisma.quizLink.update({
      where: { id: quizLink.id },
      data: { used: true, usedAt: new Date() },
    });
  }

  // Shuffle questions for this attempt
  const shuffledQuestions = shuffleArray(allQuestions);
  const questionOrder = JSON.stringify(shuffledQuestions.map((q) => q.id));

  const attempt = await prisma.quizAttempt.create({
    data: {
      userId: userId!,
      quizId: quizLink.quizId,
      answers: "{}",
      questionOrder,
    },
    include: { quiz: { select: { id: true, title: true, durationMin: true, type: true } } },
  });

  return NextResponse.json({
    attempt: { ...attempt, answers: {} },
    quiz: attempt.quiz,
    questions: shuffledQuestions,
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
