export interface ScoreResult {
  score: number;
  totalPoints: number;
  percentage: number;
}

export function calculateScore(
  answers: Record<string, string>,
  questions: { id: string; correctAnswer: string }[]
): ScoreResult {
  const totalPoints = questions.length;
  const score = questions.reduce((acc, q) => {
    return answers[q.id] === q.correctAnswer ? acc + 1 : acc;
  }, 0);
  const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
  return { score, totalPoints, percentage };
}
