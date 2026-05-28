import { QuizSidebar } from "@/components/quiz/QuizSidebar";

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <QuizSidebar />
      <div className="flex-1 p-6 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
