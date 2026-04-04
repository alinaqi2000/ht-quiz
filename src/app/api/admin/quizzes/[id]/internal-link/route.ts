import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateToken } from "@/lib/token";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: quizId } = await params;

  const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
  if (!quiz) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;

  const link = await prisma.quizLink.create({
    data: {
      quizId,
      userId: null,
      linkType: "INTERNAL",
      token: generateToken(),
      expiresAt,
    },
  });

  return NextResponse.json(link, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: quizId } = await params;
  const body = await req.json();
  const { linkId } = body;

  if (!linkId) {
    return NextResponse.json({ error: "linkId required" }, { status: 400 });
  }

  await prisma.quizLink.deleteMany({
    where: { id: linkId, quizId, linkType: "INTERNAL" },
  });

  return NextResponse.json({ success: true });
}
