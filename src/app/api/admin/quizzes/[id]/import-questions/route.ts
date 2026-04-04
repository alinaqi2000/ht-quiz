import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Simple CSV parser that handles quoted fields
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");

  for (const line of lines) {
    if (!line.trim()) continue;
    const fields: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        fields.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    fields.push(current.trim());
    rows.push(fields);
  }

  return rows;
}

const VALID_ANSWERS = ["A", "B", "C", "D"];
const VALID_DIFFICULTIES = ["EASY", "MEDIUM", "HARD"];

// GET: Download sample CSV
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sample = [
    "question,optionA,optionB,optionC,optionD,correctAnswer,difficulty",
    '"What is the capital of France?",London,Paris,Berlin,Madrid,B,EASY',
    '"Which planet is closest to the Sun?",Venus,Earth,Mercury,Mars,C,MEDIUM',
    '"What is 2 + 2?",3,4,5,6,B,EASY',
  ].join("\n");

  return new NextResponse(sample, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="sample-questions.csv"',
    },
  });
}

// POST: Import questions from CSV
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

  let csvText: string;
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    csvText = await file.text();
  } catch {
    return NextResponse.json({ error: "Failed to read file" }, { status: 400 });
  }

  const rows = parseCSV(csvText);

  if (rows.length < 2) {
    return NextResponse.json({ error: "CSV must have a header and at least one row" }, { status: 400 });
  }

  // Validate header
  const header = rows[0].map((h) => h.toLowerCase().replace(/\s/g, ""));
  const expectedHeader = ["question", "optiona", "optionb", "optionc", "optiond", "correctanswer", "difficulty"];
  const isValidHeader = expectedHeader.every((col, i) => header[i] === col);
  if (!isValidHeader) {
    return NextResponse.json({
      error: "Invalid CSV format. Expected columns: question,optionA,optionB,optionC,optionD,correctAnswer,difficulty",
    }, { status: 400 });
  }

  const dataRows = rows.slice(1);
  const errors: string[] = [];

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    if (row.length < 7) {
      errors.push(`Row ${i + 2}: missing columns (expected 7, got ${row.length})`);
      continue;
    }
    const [question, , , , , correctAnswer, difficulty] = row;
    if (!question) errors.push(`Row ${i + 2}: question text is empty`);
    if (!VALID_ANSWERS.includes(correctAnswer.toUpperCase())) {
      errors.push(`Row ${i + 2}: correctAnswer must be A, B, C, or D`);
    }
    if (!VALID_DIFFICULTIES.includes(difficulty.toUpperCase())) {
      errors.push(`Row ${i + 2}: difficulty must be EASY, MEDIUM, or HARD`);
    }
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: "Validation errors", details: errors }, { status: 400 });
  }

  // Delete existing questions and create new ones in a transaction
  await prisma.$transaction(async (tx) => {
    await tx.question.deleteMany({ where: { quizId } });

    await tx.question.createMany({
      data: dataRows.map((row, i) => ({
        quizId,
        text: row[0],
        optionA: row[1],
        optionB: row[2],
        optionC: row[3],
        optionD: row[4],
        correctAnswer: row[5].toUpperCase(),
        difficulty: row[6].toUpperCase() as "EASY" | "MEDIUM" | "HARD",
        order: i,
      })),
    });
  });

  return NextResponse.json({ imported: dataRows.length }, { status: 200 });
}
