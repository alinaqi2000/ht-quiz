import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { translate } from "@vitalets/google-translate-api";

async function translateText(text: string): Promise<string> {
  if (!text?.trim()) return text;
  const res = await translate(text, { to: "ur" });
  return res.text;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  // If quizId provided: translate all questions in the quiz
  if (body.quizId) {
    const questions = await prisma.question.findMany({
      where: { quizId: body.quizId },
    });

    if (questions.length === 0) {
      return NextResponse.json({ error: "No questions found" }, { status: 404 });
    }

    try {
      await Promise.all(
        questions.map(async (q) => {
          const [text, optionA, optionB, optionC, optionD] = await Promise.all([
            translateText(q.text),
            translateText(q.optionA),
            translateText(q.optionB),
            translateText(q.optionC),
            translateText(q.optionD),
          ]);
          await prisma.question.update({
            where: { id: q.id },
            data: { text, optionA, optionB, optionC, optionD },
          });
        })
      );
      return NextResponse.json({ translated: questions.length });
    } catch (err) {
      console.error("Translation error:", err);
      return NextResponse.json(
        { error: "Translation failed. Please try again later." },
        { status: 503 }
      );
    }
  }

  // If texts array provided: just translate and return
  const { texts } = body as { texts?: string[] };
  if (!Array.isArray(texts) || texts.length === 0) {
    return NextResponse.json({ error: "quizId or texts array required" }, { status: 400 });
  }

  try {
    const translations = await Promise.all(texts.map(translateText));
    return NextResponse.json({ translations });
  } catch (err) {
    console.error("Translation error:", err);
    return NextResponse.json(
      { error: "Translation failed. Please try again later." },
      { status: 503 }
    );
  }
}
