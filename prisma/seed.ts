import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL ?? "file:./dev.db", authToken: process.env.DATABASE_AUTH_TOKEN });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@htquiz.com" },
    update: {},
    create: { name: "Admin", email: "admin@htquiz.com", password: adminPassword, role: "ADMIN" },
  });
  console.log("Created admin:", admin.email);

  // const userPassword = await bcrypt.hash("user123", 12);

  // const alice = await prisma.user.upsert({
  //   where: { email: "alice@example.com" },
  //   update: {},
  //   create: { name: "Alice Johnson", email: "alice@example.com", password: userPassword, role: "USER", isGroupLeader: true },
  // });

  // const bob = await prisma.user.upsert({
  //   where: { email: "bob@example.com" },
  //   update: {},
  //   create: { name: "Bob Smith", email: "bob@example.com", password: userPassword, role: "USER" },
  // });

  // const carol = await prisma.user.upsert({
  //   where: { email: "carol@example.com" },
  //   update: {},
  //   create: { name: "Carol Davis", email: "carol@example.com", password: userPassword, role: "USER" },
  // });

  // console.log("Created users:", alice.email, bob.email, carol.email);

  // const quiz = await prisma.quiz.upsert({
  //   where: { id: "sample-quiz-1" },
  //   update: {},
  //   create: {
  //     id: "sample-quiz-1",
  //     title: "JavaScript Fundamentals",
  //     description: "Test your knowledge of core JavaScript concepts",
  //     difficulty: "MEDIUM",
  //     durationMin: 20,
  //     type: "PRIVATE",
  //     isActive: true,
  //   },
  // });

  // console.log("Created quiz:", quiz.title);

  // const questions = [
  //   { text: "What is the output of `typeof null` in JavaScript?", optionA: "null", optionB: "undefined", optionC: "object", optionD: "string", correctAnswer: "C", difficulty: "EASY" as const, order: 1 },
  //   { text: "Which method adds an element to the end of an array?", optionA: "push()", optionB: "pop()", optionC: "shift()", optionD: "unshift()", correctAnswer: "A", difficulty: "EASY" as const, order: 2 },
  //   { text: "What does `===` compare in JavaScript?", optionA: "Only values", optionB: "Only types", optionC: "Values and types", optionD: "References", correctAnswer: "C", difficulty: "EASY" as const, order: 3 },
  //   { text: "What is a closure in JavaScript?", optionA: "A connection closer", optionB: "A function with access to its outer scope after the outer function returns", optionC: "A way to close windows", optionD: "A loop terminator", correctAnswer: "B", difficulty: "MEDIUM" as const, order: 4 },
  //   { text: "How do you declare a constant in modern JavaScript?", optionA: "var x = 5", optionB: "let x = 5", optionC: "const x = 5", optionD: "constant x = 5", correctAnswer: "C", difficulty: "EASY" as const, order: 5 },
  // ];

  // for (const q of questions) {
  //   await prisma.question.upsert({
  //     where: { id: `sample-q-${q.order}` },
  //     update: {},
  //     create: { id: `sample-q-${q.order}`, ...q, quizId: quiz.id },
  //   });
  // }

  // console.log(`Created ${questions.length} questions`);
  console.log("\n✅ Seed complete!");
  console.log("Admin: admin@htquiz.com / admin123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
