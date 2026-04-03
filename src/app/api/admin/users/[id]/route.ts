import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateUserSchema } from "@/schemas/user.schema";
import bcrypt from "bcryptjs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isGroupLeader: true,
      createdAt: true,
      attempts: {
        include: { quiz: { select: { title: true } } },
        orderBy: { startedAt: "desc" },
      },
      quizLinks: {
        include: { quiz: { select: { title: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;
  if (data.password) {
    data.password = await bcrypt.hash(data.password, 12);
  } else {
    delete data.password;
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, name: true, email: true, role: true, isGroupLeader: true },
  });

  return NextResponse.json(user);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Delete dependents first (SQLite doesn't cascade unless schema enforces it)
  await prisma.quizAttempt.deleteMany({ where: { userId: id } });
  await prisma.quizLink.deleteMany({ where: { userId: id } });
  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
