import { useStore } from "@/store";
import { OnboardingFlow } from "@/sections/OnboardingFlow";
import { Dashboard } from "@/sections/Dashboard";
import { RoadmapPage } from "@/sections/RoadmapPage";
import { TutorPage } from "@/sections/TutorPage";
import { TasksPage } from "@/sections/TasksPage";
import { QuizInterface } from "@/sections/QuizInterface";
import { QuestionCatalog } from "@/sections/QuestionCatalog";
import { BottomNav } from "@/components/BottomNav";
import { Toaster } from "@/components/ui/sonner";
import { AnimatePresence, motion } from "framer-motion";

function App() {
  const { currentPage, isOnboardingComplete } = useStore();

  // Show onboarding if not complete
  if (!isOnboardingComplete) {
    return (
      <div className="min-h-screen bg-[#0F0F11] text-[#F3F4F6]">
        <OnboardingFlow />
        <Toaster />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F11] text-[#F3F4F6] pb-20">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {currentPage === "dashboard" && <Dashboard />}
          {currentPage === "roadmap" && <RoadmapPage />}
          {currentPage === "tutor" && <TutorPage />}
          {currentPage === "tasks" && <TasksPage />}
          {currentPage === "quiz" && <QuizInterface />}
          {currentPage === "catalog" && <QuestionCatalog />}
        </motion.div>
      </AnimatePresence>

      {currentPage !== "quiz" && <BottomNav />}
      <Toaster />
    </div>
  );
}

export default App;
