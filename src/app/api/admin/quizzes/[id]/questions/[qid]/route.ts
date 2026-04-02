import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateQuestionSchema } from "@/schemas/question.schema";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; qid: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { qid } = await params;
  const question = await prisma.question.findUnique({ where: { id: qid } });
  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  return NextResponse.json(question);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; qid: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { qid } = await params;
  const body = await req.json();
  const parsed = updateQuestionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const question = await prisma.question.update({
    where: { id: qid },
    data: parsed.data,
  });

  return NextResponse.json(question);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; qid: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { qid } = await params;
  await prisma.question.delete({ where: { id: qid } });

  return NextResponse.json({ success: true });
}
