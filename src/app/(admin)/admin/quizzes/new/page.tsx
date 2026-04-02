import { AdminHeader } from "@/components/admin/header";
import { QuizForm } from "@/components/admin/quiz-form";

export default function NewQuizPage() {
  return (
    <div className="flex flex-col flex-1">
      <AdminHeader
        title="Create Quiz"
        description="Set up a new quiz for your participants"
      />
      <div className="p-6">
        <QuizForm />
      </div>
    </div>
  );
}
