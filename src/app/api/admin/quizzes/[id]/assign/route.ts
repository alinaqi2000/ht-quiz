import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assignQuizSchema } from "@/schemas/assign.schema";
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
  const body = await req.json();
  const parsed = assignQuizSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { userIds, expiresAt } = parsed.data;

  const links = await Promise.all(
    userIds.map(async (userId) => {
      const token = generateToken();
      return prisma.quizLink.create({
        data: {
          quizId,
          userId,
          token,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        },
        include: {
          user: { select: { name: true, email: true } },
        },
      });
    })
  );

  return NextResponse.json(links, { status: 201 });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: quizId } = await params;
  const links = await prisma.quizLink.findMany({
    where: { quizId },
    include: {
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(links);
}
