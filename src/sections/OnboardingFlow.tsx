import { useState, useEffect } from "react";
import { useStore } from "@/store";
import { useAppStore } from "@/state/app.store";
import { useOnboarding } from "@/hooks/useOnboarding";
import { QuizInterface } from "@/sections/QuizInterface";
import { diagnosticQuizService } from "@/services/diagnosticQuiz.service";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { JAMB_SUBJECTS, PERSONALITIES } from "@/types";
import type { LearningFormat, VoicePreference, PersonalityType } from "@/types";
import type { QuizResultItem } from "@/types/api.types";
import {
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Rocket,
  BookOpen,
  Mic,
  Play,
  User,
  Calendar,
  Clock,
  Trophy,
  Target,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

const STEPS = ["profile", "preferences", "diagnostic", "results"] as const;
type Step = (typeof STEPS)[number];

export function OnboardingFlow() {
  const {
    setUser: setStoreUser,
    setSelectedSubjects: setStoreSelectedSubjects,
    completeOnboarding: completeStoreOnboarding,
    completeDiagnosticQuiz: completeStoreDiagnosticQuiz,
    currentQuiz,
  } = useStore();

  const { diagnosticQuiz } = useAppStore();

  const {
    loading: apiLoading,
    saveExamProfile,  // Save exam profile to backend
    saveSubjects,     // Save subjects to backend
  } = useOnboarding();

  const [currentStep, setCurrentStep] = useState<Step>("profile");
  const [stepIndex, setStepIndex] = useState(0);
  const [showDiagnosticResults, setShowDiagnosticResults] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingMessage, setProcessingMessage] = useState("Preparing your quiz...");
  const [diagnosticScore, setDiagnosticScore] = useState(0);
  const [diagnosticResults, setDiagnosticResultsState] = useState<{
    subjectScores: Record<string, number>;
    topicScores: Record<string, number>;
    weakTopics: string[];
    strongTopics: string[];
    completed: boolean;
  } | null>(null);

  // Form data
  const [nickname, setNickname] = useState("");
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [examDate, setExamDate] = useState("");
  const [dailyHours, setDailyHours] = useState(2);
  const [learningFormat, setLearningFormat] = useState<LearningFormat>("mixed");
  const [personality, setPersonality] = useState<PersonalityType>("mentor");
  const [voice, setVoice] = useState<VoicePreference>("female");

  // Watch for quiz completion
  useEffect(() => {
    if (currentStep === "diagnostic" && !currentQuiz && diagnosticQuiz) {
      // Quiz was completed, analyze results
      handleDiagnosticComplete();
    }
  }, [currentQuiz, currentStep, diagnosticQuiz]);

  const handleDiagnosticComplete = async () => {
    const store = useStore.getState();
    const quiz = store.quizHistory[store.quizHistory.length - 1];

    if (quiz && quiz.type === "diagnostic") {
      let correct = 0;
      const quizResults: QuizResultItem[] = [];

      quiz.questions.forEach((q, i) => {
        const isCorrect = quiz.answers[i] === q.correctAnswer;
        if (isCorrect) correct++;

        // Build result item for API
        quizResults.push({
          subject: q.subjectId,
          question: q.question,
          timeUsed: q.options.length * 10, // Estimated time
          userAnswer: q.options[quiz.answers[i]] || "",
          correctAnswer: q.options[q.correctAnswer],
        });
      });

      const score = Math.round((correct / quiz.totalQuestions) * 100);
      setDiagnosticScore(score);

      // Analyze results by subject
      const subjectScoreData: Record<
        string,
        { correct: number; total: number }
      > = {};
      const topicScoreData: Record<string, { correct: number; total: number }> =
        {};
      const weakTopics: string[] = [];
      const strongTopics: string[] = [];

      quiz.questions.forEach((q, i) => {
        const isCorrect = quiz.answers[i] === q.correctAnswer;

        // Track subject scores
        if (!subjectScoreData[q.subjectId]) {
          subjectScoreData[q.subjectId] = { correct: 0, total: 0 };
        }
        subjectScoreData[q.subjectId].total++;
        if (isCorrect) subjectScoreData[q.subjectId].correct++;

        // Track topic scores
        if (!topicScoreData[q.topicId]) {
          topicScoreData[q.topicId] = { correct: 0, total: 0 };
        }
        topicScoreData[q.topicId].total++;
        if (isCorrect) topicScoreData[q.topicId].correct++;
      });

      // Calculate percentages and identify weak/strong topics
      Object.entries(topicScoreData).forEach(([topicId, data]) => {
        const topicScore = Math.round((data.correct / data.total) * 100);
        if (topicScore < 50) {
          weakTopics.push(topicId);
        } else if (topicScore >= 70) {
          strongTopics.push(topicId);
        }
      });

      // Convert subject scores to percentages
      const subjectScores: Record<string, number> = {};
      Object.entries(subjectScoreData).forEach(([subjectId, data]) => {
        subjectScores[subjectId] = Math.round(
          (data.correct / data.total) * 100,
        );
      });

      // Convert topic scores to percentages
      const topicScores: Record<string, number> = {};
      Object.entries(topicScoreData).forEach(([topicId, data]) => {
        topicScores[topicId] = Math.round((data.correct / data.total) * 100);
      });

      const results = {
        subjectScores,
        topicScores,
        weakTopics,
        strongTopics,
        completed: true,
      };

      setDiagnosticResultsState(results);
      completeStoreDiagnosticQuiz(results);

      // Submit results to API (commented out - endpoint not ready yet)
      // await submitDiagnosticResults(quizResults);

      setShowDiagnosticResults(true);
      setCurrentStep("results");
      setStepIndex(3);
    }
  };

  const handleFinishOnboarding = async () => {
    // Start processing animation
    setIsProcessing(true);
    setProcessingMessage("Saving your profile...");

    try {
      // Save exam profile to backend (NOW at the end of onboarding)
      const examProfileSaved = await saveExamProfile({
        nickname,
        exam_date: examDate,
        study_hours_per_day: dailyHours,
        ai_tutor_selected: personality,
        ai_voice_enabled: voice === "female", // simple mapping
      });

      if (!examProfileSaved) {
        toast.error("Failed to save profile. Please try again.");
        setIsProcessing(false);
        return;
      }

      setProcessingMessage("Saving your subjects...");

      // Save subjects to backend
      const subjectsSaved = await saveSubjects({
        subjects: selectedSubjectIds,
      });

      if (!subjectsSaved) {
        toast.error("Failed to save subjects. Please try again.");
        setIsProcessing(false);
        return;
      }

      setProcessingMessage("Generating your roadmap...");

      // Complete local onboarding
      completeStoreOnboarding();
      
      toast.success("Welcome to PROPELLA! Your journey begins now!");
    } catch (error) {
      console.error("[Onboarding] Failed to finish:", error);
      toast.error("Something went wrong. Please try again.");
      setIsProcessing(false);
    }
  };

  const handleNext = async () => {
    if (currentStep === "profile") {
      if (!nickname.trim()) {
        toast.error("Please enter your nickname");
        return;
      }
      if (selectedSubjectIds.length === 0) {
        toast.error("Please select at least one subject");
        return;
      }
      if (selectedSubjectIds.length !== 4) {
        toast.error("Please select exactly 4 subjects");
        return;
      }
      if (!examDate) {
        toast.error("Please select your exam date");
        return;
      }

      // Save to local store only (backend API call happens at the end)
      setStoreUser({
        nickname,
        examDate: new Date(examDate),
        dailyStudyHours: dailyHours,
      });

      const selectedSubs = JAMB_SUBJECTS.filter((s) =>
        selectedSubjectIds.includes(s.id),
      );
      setStoreSelectedSubjects(selectedSubs);

      // Move to next step
      setCurrentStep("preferences");
      setStepIndex(1);
    }
  };

  const handleStartDiagnosticQuiz = async () => {
    setIsProcessing(true);
    setProcessingProgress(0);
    setProcessingMessage("Preparing your personalized diagnostic quiz...");
    
    // Save preferences to local store
    setStoreUser({
      learningFormat,
      personality,
      voicePreference: voice,
    });

    try {
      // Get selected subjects
      const selectedSubjects = JAMB_SUBJECTS.filter(s => 
        selectedSubjectIds.includes(s.id)
      ).slice(0, 4);

      if (selectedSubjects.length === 0) {
        toast.error("Please select at least one subject");
        setIsProcessing(false);
        return;
      }

      // Generate quiz questions with AI fallback
      setProcessingMessage("Generating AI-powered questions...");
      const result = await diagnosticQuizService.generateDiagnosticQuizWithProcessing(
        selectedSubjects,
        3, // 3 questions per subject
        (progress) => setProcessingProgress(progress)
      );

      console.log(`[Onboarding] Quiz generated from source: ${result.source}`);
      
      if (result.questions.length === 0) {
        toast.error("Failed to generate quiz questions. Please try again.");
        setIsProcessing(false);
        return;
      }

      // Store generated questions in localStorage for backup
      localStorage.setItem('diagnostic_questions', JSON.stringify(result.questions));

      // Show source notification
      if (result.source === "template") {
        toast.info("Using practice questions while AI service is warming up");
      }

      // Start the quiz with generated questions
      setProcessingMessage("Loading quiz interface...");
      
      // Pass questions to the quiz interface via the store
      // We'll set up the quiz in the next effect
      const subjectsToQuiz = selectedSubjectIds.slice(0, 4);
      
      // Create a custom quiz setup
      const store = useStore.getState();
      
      // Set up quiz with generated questions
      // Note: We use type assertion since we're creating a partial quiz object
      // The store will handle the full initialization
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (store as any).currentQuiz = {
        id: `diagnostic_${Date.now()}`,
        subjectId: subjectsToQuiz[0],
        topicId: null,
        type: "diagnostic",
        questions: result.questions,
        answers: [],
        score: 0,
        totalQuestions: result.questions.length,
        completed: false,
      };

      setIsProcessing(false);
      setCurrentStep("diagnostic");
      setStepIndex(2);
      
    } catch (error) {
      console.error("[Onboarding] Failed to start diagnostic quiz:", error);
      toast.error("Failed to start quiz. Please try again.");
      setIsProcessing(false);
    }
  };

  const handleBack = () => {
    if (currentStep === "preferences") {
      setCurrentStep("profile");
      setStepIndex(0);
    }
  };

  const toggleSubject = (subjectId: string) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : prev.length < 4
          ? [...prev, subjectId]
          : prev,
    );
  };

  // Show processing animation with progress
  if (isProcessing) {
    return (
      <div className="min-h-screen bg-[#0F0F11] relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#6D28D9] rounded-full blur-[120px] opacity-20 animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#CCFF00] rounded-full blur-[150px] opacity-10 animate-pulse" />
        </div>

        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">
          {/* Animated Loader */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-20 h-20 border-4 border-[#2A2A2E] border-t-[#CCFF00] border-r-[#6D28D9] rounded-full mx-auto mb-6"
            />

            <h2 className="text-2xl font-bold mb-2">Generating Your Quiz...</h2>
            <p className="text-[#9CA3AF] mb-4">{processingMessage}</p>

            {/* Progress Bar */}
            <div className="mt-6 w-72 mx-auto">
              <div className="h-2 bg-[#2A2A2E] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#6D28D9] to-[#CCFF00]"
                  initial={{ width: 0 }}
                  animate={{ width: `${processingProgress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <p className="text-sm text-[#9CA3AF] mt-2">
                {processingProgress}% complete
              </p>
            </div>

            {/* Feature indicators */}
            <div className="mt-8 flex justify-center gap-4">
              {["AI Analysis", "Smart Questions", "Personalized"].map((feature, i) => (
                <motion.div
                  key={feature}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.2 }}
                  className="flex items-center gap-2 text-xs text-[#9CA3AF]"
                >
                  <div className="w-2 h-2 rounded-full bg-[#CCFF00]" />
                  {feature}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Show quiz during diagnostic step
  if (currentStep === "diagnostic") {
    return (
      <div className="min-h-screen bg-[#0F0F11]">
        <QuizInterface />
      </div>
    );
  }

  // Show results after diagnostic
  if (currentStep === "results" && showDiagnosticResults && diagnosticResults) {
    return (
      <div className="min-h-screen bg-[#0F0F11] relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#6D28D9] rounded-full blur-[120px] opacity-20" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#CCFF00] rounded-full blur-[150px] opacity-10" />
        </div>

        <div className="relative z-10 min-h-screen flex flex-col p-6">
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#2A2A2E]">
            <motion.div
              className="h-full bg-gradient-to-r from-[#6D28D9] to-[#CCFF00]"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 0.5 }}
            />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between mb-8 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-[#6D28D9] to-[#CCFF00] rounded-xl flex items-center justify-center">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">PROPELLA</span>
            </div>
            <span className="text-sm text-[#9CA3AF]">Diagnostic Complete!</span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col items-center justify-center"
          >
            {/* Score Circle */}
            <div className="relative mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.8 }}
                className="w-40 h-40 rounded-full border-8 flex items-center justify-center"
                style={{
                  borderColor: diagnosticScore >= 50 ? "#10B981" : "#F59E0B",
                  backgroundColor: "#1A1A1E",
                }}
              >
                <div className="text-center">
                  <Trophy
                    className={`w-12 h-12 mx-auto mb-2 ${
                      diagnosticScore >= 50
                        ? "text-[#10B981]"
                        : "text-[#F59E0B]"
                    }`}
                  />
                  <span className="text-4xl font-bold">{diagnosticScore}%</span>
                </div>
              </motion.div>
            </div>

            <h1 className="text-3xl font-bold mb-2">
              {diagnosticScore >= 70
                ? "Excellent Work! 🌟"
                : diagnosticScore >= 50
                  ? "Good Progress! 💪"
                  : "Let's Improve Together! 📚"}
            </h1>
            <p className="text-[#9CA3AF] text-center mb-8 max-w-md">
              {diagnosticScore >= 70
                ? "You've shown strong knowledge across your subjects. Let's build on this foundation!"
                : diagnosticScore >= 50
                  ? "You've identified some areas to work on. Your personalized roadmap will help you improve."
                  : "Don't worry! This helps us understand your weak points so we can create a tailored study plan."}
            </p>

            {/* Subject Breakdown */}
            <Card className="bg-[#1A1A1E] border-[#2A2A2E] p-4 mb-8 w-full max-w-md">
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <Target className="w-5 h-5 text-[#CCFF00]" />
                Subject Performance
              </h3>
              <div className="space-y-2">
                {selectedSubjectIds.slice(0, 4).map((subjectId) => {
                  const subject = JAMB_SUBJECTS.find((s) => s.id === subjectId);
                  const score = diagnosticResults.subjectScores[subjectId] || 0;
                  return (
                    <div key={subjectId} className="flex items-center gap-3">
                      <span className="text-xl">{subject?.icon}</span>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span>{subject?.name}</span>
                          <span
                            className={
                              score >= 50 ? "text-[#10B981]" : "text-[#F59E0B]"
                            }
                          >
                            {score}%
                          </span>
                        </div>
                        <div className="h-2 bg-[#2A2A2E] rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${score}%` }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className={`h-full ${
                              score >= 50 ? "bg-[#10B981]" : "bg-[#F59E0B]"
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Next Steps Info */}
            <Card className="bg-[#6D28D9]/20 border-[#6D28D9] p-4 mb-8 w-full max-w-md">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-[#CCFF00] mt-0.5" />
                <div>
                  <h4 className="font-bold mb-1">Your Personalized Roadmap</h4>
                  <p className="text-sm text-[#9CA3AF]">
                    Based on your diagnostic results, we've created a study plan
                    focusing on your weak areas. You'll see daily tasks,
                    quizzes, and revision sessions tailored to your needs.
                  </p>
                </div>
              </div>
            </Card>

            <Button
              onClick={handleFinishOnboarding}
              disabled={apiLoading}
              className="w-full max-w-md h-14 bg-gradient-to-r from-[#6D28D9] to-[#CCFF00] hover:from-[#5B21B6] hover:to-[#B3E600] text-[#0F0F11] font-semibold text-lg"
            >
              {apiLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2" />
                  Start My Journey
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F11] relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#6D28D9] rounded-full blur-[120px] opacity-20 animate-pulse" />
        <div
          className="absolute bottom-20 right-10 w-96 h-96 bg-[#CCFF00] rounded-full blur-[150px] opacity-10 animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-[#2A2A2E]">
        <motion.div
          className="h-full bg-gradient-to-r from-[#6D28D9] to-[#CCFF00]"
          initial={{ width: "0%" }}
          animate={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-[#6D28D9] to-[#CCFF00] rounded-xl flex items-center justify-center">
              <Rocket className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold">PROPELLA</span>
          </div>
          <span className="text-sm text-[#9CA3AF]">
            Step {stepIndex + 1} of {STEPS.length}
          </span>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {currentStep === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="flex-1 flex flex-col"
            >
              <h1 className="text-3xl font-bold mb-2">
                Let's Build Your Rocket! 🚀
              </h1>
              <p className="text-[#9CA3AF] mb-8">
                First, let's get to know you
              </p>

              {/* Nickname */}
              <div className="mb-6">
                <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                  <User size={16} />
                  Your Nickname
                </Label>
                <Input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="What should we call you?"
                  className="bg-[#1A1A1E] border-[#2A2A2E] text-white placeholder:text-[#6B7280] h-12"
                />
              </div>

              {/* Subjects */}
              <div className="mb-6">
                <Label className="text-sm font-medium mb-3 flex items-center gap-2">
                  <BookOpen size={16} />
                  Select Your JAMB Subjects (exactly 4)
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[280px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[#6D28D9] scrollbar-track-[#2A2A2E]">
                  {JAMB_SUBJECTS.map((subject) => (
                    <Card
                      key={subject.id}
                      onClick={() => toggleSubject(subject.id)}
                      className={`p-4 cursor-pointer transition-all duration-200 ${
                        selectedSubjectIds.includes(subject.id)
                          ? "bg-[#6D28D9] border-[#CCFF00]"
                          : "bg-[#1A1A1E] border-[#2A2A2E] hover:border-[#6D28D9]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{subject.icon}</span>
                        <div>
                          <p className="font-medium text-sm">{subject.name}</p>
                          <p className="text-xs text-[#9CA3AF]">
                            {subject.code}
                          </p>
                        </div>
                        {selectedSubjectIds.includes(subject.id) && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="ml-auto"
                          >
                            <Sparkles className="w-5 h-5 text-[#CCFF00]" />
                          </motion.div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
                {selectedSubjectIds.length >= 4 && (
                  <p className="text-xs text-[#F59E0B] mt-2">
                    Maximum 4 subjects selected
                  </p>
                )}
                {selectedSubjectIds.length > 0 &&
                  selectedSubjectIds.length < 4 && (
                    <p className="text-xs text-[#CCFF00] mt-2">
                      Select {4 - selectedSubjectIds.length} more subject
                      {selectedSubjectIds.length === 3 ? "" : "s"}
                    </p>
                  )}
              </div>

              {/* Exam Date */}
              <div className="mb-6">
                <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Calendar size={16} />
                  Exam Date
                </Label>
                <Input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="bg-[#1A1A1E] border-[#2A2A2E] text-white h-12"
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              {/* Daily Hours */}
              <div className="mb-8">
                <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Clock size={16} />
                  Daily Study Hours:{" "}
                  <span className="text-[#CCFF00]">{dailyHours}h</span>
                </Label>
                <input
                  type="range"
                  min={1}
                  max={8}
                  value={dailyHours}
                  onChange={(e) => setDailyHours(Number(e.target.value))}
                  className="w-full h-2 bg-[#2A2A2E] rounded-lg appearance-none cursor-pointer accent-[#CCFF00]"
                />
                <div className="flex justify-between text-xs text-[#9CA3AF] mt-1">
                  <span>1h</span>
                  <span>8h</span>
                </div>
              </div>

              <Button
                onClick={handleNext}
                disabled={selectedSubjectIds.length !== 4}
                className="w-full h-14 bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] hover:from-[#5B21B6] hover:to-[#7C3AED] text-white font-semibold text-lg"
              >
                Continue
                <ChevronRight className="ml-2" />
              </Button>
            </motion.div>
          )}

          {currentStep === "preferences" && (
            <motion.div
              key="preferences"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="flex-1 flex flex-col"
            >
              <button
                onClick={handleBack}
                className="flex items-center text-[#9CA3AF] mb-4 hover:text-white transition-colors"
              >
                <ChevronLeft size={20} />
                Back
              </button>

              <h1 className="text-3xl font-bold mb-2">
                Customize Your Experience
              </h1>
              <p className="text-[#9CA3AF] mb-6">
                Choose how you want to learn
              </p>

              {/* Learning Format */}
              <div className="mb-6">
                <Label className="text-sm font-medium mb-3">
                  Learning Format
                </Label>
                <RadioGroup
                  value={learningFormat}
                  onValueChange={(v) => setLearningFormat(v as LearningFormat)}
                  className="grid grid-cols-2 gap-3"
                >
                  {[
                    { value: "text", icon: BookOpen, label: "Text" },
                    { value: "audio", icon: Mic, label: "Audio" },
                    { value: "video", icon: Play, label: "Video" },
                    { value: "mixed", icon: Sparkles, label: "Mixed" },
                  ].map((format) => (
                    <Label
                      key={format.value}
                      className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                        learningFormat === format.value
                          ? "bg-[#6D28D9] border-[#CCFF00]"
                          : "bg-[#1A1A1E] border-[#2A2A2E] hover:border-[#6D28D9]"
                      }`}
                    >
                      <RadioGroupItem
                        value={format.value}
                        className="sr-only"
                      />
                      <format.icon size={20} />
                      <span className="font-medium">{format.label}</span>
                    </Label>
                  ))}
                </RadioGroup>
              </div>

              {/* AI Personality */}
              <div className="mb-6">
                <Label className="text-sm font-medium mb-3">
                  Choose Your AI Tutor
                </Label>
                <div className="space-y-3">
                  {Object.entries(PERSONALITIES).map(([key, config]) => (
                    <Card
                      key={key}
                      onClick={() => setPersonality(key as PersonalityType)}
                      className={`p-4 cursor-pointer transition-all duration-200 ${
                        personality === key
                          ? "bg-[#6D28D9] border-[#CCFF00]"
                          : "bg-[#1A1A1E] border-[#2A2A2E] hover:border-[#6D28D9]"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <span className="text-4xl">{config.avatar}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold">{config.name}</h3>
                            {personality === key && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                              >
                                <Sparkles className="w-5 h-5 text-[#CCFF00]" />
                              </motion.div>
                            )}
                          </div>
                          <p className="text-sm text-[#9CA3AF] mt-1">
                            {config.greeting}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <span className="text-xs bg-[#0F0F11] px-2 py-1 rounded-full text-[#9CA3AF]">
                              {config.tone}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Voice Preference */}
              <div className="mb-8">
                <Label className="text-sm font-medium mb-3">
                  Voice Preference
                </Label>
                <RadioGroup
                  value={voice}
                  onValueChange={(v) => setVoice(v as VoicePreference)}
                  className="flex gap-4"
                >
                  <Label
                    className={`flex items-center gap-3 px-6 py-3 rounded-xl border cursor-pointer transition-all ${
                      voice === "male"
                        ? "bg-[#6D28D9] border-[#CCFF00]"
                        : "bg-[#1A1A1E] border-[#2A2A2E]"
                    }`}
                  >
                    <RadioGroupItem value="male" className="sr-only" />
                    <span className="text-xl">👨</span>
                    <span className="font-medium">Male</span>
                  </Label>
                  <Label
                    className={`flex items-center gap-3 px-6 py-3 rounded-xl border cursor-pointer transition-all ${
                      voice === "female"
                        ? "bg-[#6D28D9] border-[#CCFF00]"
                        : "bg-[#1A1A1E] border-[#2A2A2E]"
                    }`}
                  >
                    <RadioGroupItem value="female" className="sr-only" />
                    <span className="text-xl">👩</span>
                    <span className="font-medium">Female</span>
                  </Label>
                </RadioGroup>
              </div>

              <Button
                onClick={handleStartDiagnosticQuiz}
                className="w-full h-14 bg-gradient-to-r from-[#6D28D9] to-[#CCFF00] hover:from-[#5B21B6] hover:to-[#B3E600] text-[#0F0F11] font-semibold text-lg"
              >
                <Sparkles className="mr-2" />
                Take Diagnostic Quiz
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ChevronLeft icon - now imported from lucide-react
