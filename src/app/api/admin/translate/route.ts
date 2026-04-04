import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { translate } from "@vitalets/google-translate-api";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Translates multiple texts in one API call by joining with a separator
async function translateBatch(texts: string[], to: string): Promise<string[]> {
  const SEP = "\n||||\n";
  const joined = texts.join(SEP);
  const res = await translate(joined, { to });
  const parts = res.text.split(SEP);
  // Fallback: if split count doesn't match, return raw parts
  return texts.map((_, i) => parts[i]?.trim() ?? texts[i]);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const to: string = body.targetLang ?? "ur";

  // If quizId provided: translate all questions in the quiz
  if (body.quizId) {
    const questions = await prisma.question.findMany({
      where: { quizId: body.quizId },
    });

    if (questions.length === 0) {
      return NextResponse.json({ error: "No questions found" }, { status: 404 });
    }

    try {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const [text, optionA, optionB, optionC, optionD] = await translateBatch(
          [q.text, q.optionA, q.optionB, q.optionC, q.optionD],
          to
        );
        await prisma.question.update({
          where: { id: q.id },
          data: { text, optionA, optionB, optionC, optionD },
        });
        // Delay between questions to avoid rate limiting
        if (i < questions.length - 1) await delay(600);
      }
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
    const translations = await translateBatch(texts, to);
    return NextResponse.json({ translations });
  } catch (err) {
    console.error("Translation error:", err);
    return NextResponse.json(
      { error: "Translation failed. Please try again later." },
      { status: 503 }
    );
  }
}
