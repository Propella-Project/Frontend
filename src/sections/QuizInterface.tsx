import { useState, useEffect, useRef, useCallback } from "react";
import { useStore } from "@/store";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  Trophy,
  Target,
  RotateCcw,
  Volume2,
  VolumeX,
  Loader2,
} from "lucide-react";

const QUESTION_TIME = 60; // seconds per question

// Text-to-Speech helper
function speakText(
  text: string,
  voicePreference: "male" | "female" = "female",
) {
  if ("speechSynthesis" in window) {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // Get available voices
    const voices = window.speechSynthesis.getVoices();

    // Try to find a matching voice based on preference
    const preferredVoice =
      voicePreference === "female"
        ? voices.find(
            (v) =>
              v.name.includes("Female") ||
              v.name.includes("female") ||
              v.name.includes("Samantha") ||
              v.name.includes("Google UK English Female"),
          )
        : voices.find(
            (v) =>
              v.name.includes("Male") ||
              v.name.includes("male") ||
              v.name.includes("Daniel") ||
              v.name.includes("Google UK English Male"),
          );

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.rate = 0.9;
    utterance.pitch = voicePreference === "female" ? 1.1 : 0.9;
    utterance.volume = 1;

    window.speechSynthesis.speak(utterance);
  }
}

export function QuizInterface() {
  const {
    currentQuiz,
    answerQuestion,
    completeQuiz,
    setCurrentPage,
    subjects,
    user,
  } = useStore();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [showResults, setShowResults] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const processingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  // Get user's voice preference
  const voicePreference = user?.voicePreference || "female";

  // Calculate current question safely (hooks must be called before any conditional returns)
  const currentQuestion = currentQuiz?.questions?.[currentQuestionIndex];
  const progress = currentQuiz
    ? ((currentQuestionIndex + 1) / currentQuiz.totalQuestions) * 100
    : 0;

  // Function to speak question and options
  const speakQuestion = useCallback(() => {
    if (!currentQuestion || isSpeaking) return;

    setIsSpeaking(true);

    const questionText =
      `${currentQuestion.question}. ` +
      currentQuestion.options
        .map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`)
        .join(". ");

    speakText(questionText, voicePreference);

    // Reset speaking state after approximately the length of the text
    setTimeout(() => setIsSpeaking(false), questionText.length * 50);
  }, [currentQuestion, isSpeaking, voicePreference]);

  // Stop speaking when moving to next question
  useEffect(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, [currentQuestionIndex]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (processingTimerRef.current) {
        clearTimeout(processingTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (timeLeft > 0 && !hasAnswered) {
      timerRef.current = setTimeout(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && !hasAnswered) {
      handleAnswer(-1); // Time's up
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, hasAnswered]);

  const handleAnswer = (answerIndex: number) => {
    if (hasAnswered) return;

    // Stop any ongoing speech
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);

    setSelectedAnswer(answerIndex);
    setHasAnswered(true);
    setAnswers((prev) => [...prev, answerIndex]);
    answerQuestion(currentQuestionIndex, answerIndex);

    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const handleNext = () => {
    if (!currentQuiz) return;
    if (currentQuestionIndex < currentQuiz.totalQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setTimeLeft(QUESTION_TIME);
      setSelectedAnswer(null);
      setHasAnswered(false);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    // Start processing - show 5 second delay before going to dashboard
    setIsProcessing(true);

    // Clear any existing processing timer
    if (processingTimerRef.current) {
      clearTimeout(processingTimerRef.current);
    }

    // Set timer to complete quiz after 5 seconds
    processingTimerRef.current = setTimeout(() => {
      // Complete the quiz first (this saves results but sets currentQuiz to null)
      completeQuiz();

      // For diagnostic quizzes, also complete onboarding to enable dashboard navigation
      if (currentQuiz?.type === "diagnostic") {
        const { completeOnboarding } = useStore.getState();
        completeOnboarding();
      }

      // Navigate to dashboard after completing the quiz
      setCurrentPage("dashboard");
      setIsProcessing(false);
      setCountdown(5);

      // Clear countdown interval
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    }, 5000);

    // Start countdown interval
    setCountdown(5);
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
  };

  // Handle navigation when processing completes
  useEffect(() => {
    if (!isProcessing && currentQuiz === null) {
      // Quiz was completed and we're not processing anymore - ensure we're on dashboard
      setCurrentPage("dashboard");
    }
  }, [isProcessing, currentQuiz, setCurrentPage]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-[#10B981]";
    if (score >= 60) return "text-[#F59E0B]";
    if (score >= 50) return "text-[#F59E0B]";
    return "text-[#EF4444]";
  };

  const getScoreMessage = (score: number) => {
    if (score >= 85) return "Outstanding! You're a master!";
    if (score >= 70) return "Great job! Keep it up!";
    if (score >= 50) return "Good effort! Room for improvement.";
    return "Keep practicing! You'll get better!";
  };

  const getSubjectName = (subjectId: string) => {
    const subject = subjects.find((s) => s.id === subjectId);
    return subject?.name || "Unknown";
  };

  // Results Screen
  if (showResults && currentQuiz) {
    const correctAnswers = currentQuiz.questions.filter(
      (q, i) => answers[i] === q.correctAnswer,
    ).length;
    const score = Math.round(
      (correctAnswers / currentQuiz.totalQuestions) * 100,
    );

    return (
      <div className="min-h-screen bg-[#0F0F11] p-4 pb-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md mx-auto"
        >
          {/* Score Circle */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="relative w-40 h-40 mx-auto mb-4"
            >
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="#2A2A2E"
                  strokeWidth="12"
                  fill="none"
                />
                <motion.circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke={score >= 50 ? "#10B981" : "#EF4444"}
                  strokeWidth="12"
                  fill="none"
                  strokeLinecap="round"
                  initial={{ strokeDasharray: "0 440" }}
                  animate={{ strokeDasharray: `${(score / 100) * 440} 440` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-4xl font-bold ${getScoreColor(score)}`}>
                  {score}%
                </span>
                <span className="text-sm text-[#9CA3AF]">
                  {correctAnswers}/{currentQuiz.totalQuestions}
                </span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h2 className="text-2xl font-bold mb-2">
                {getScoreMessage(score)}
              </h2>
              <p className="text-[#9CA3AF]">
                {score >= 50
                  ? "You've unlocked the next day!"
                  : "Review and try again to proceed."}
              </p>
            </motion.div>
          </div>

          {/* Stats */}
          <Card className="bg-[#1A1A1E] border-[#2A2A2E] p-4 mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-[#CCFF00]">
                  {currentQuiz.totalQuestions}
                </p>
                <p className="text-xs text-[#9CA3AF]">Questions</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-[#3B82F6]">
                  {Math.round(currentQuiz.timeTaken / 1000)}s
                </p>
                <p className="text-xs text-[#9CA3AF]">Time Taken</p>
              </div>
            </div>
          </Card>

          {/* Question Review */}
          <Card className="bg-[#1A1A1E] border-[#2A2A2E] p-4 mb-4">
            <h3 className="font-bold mb-3">Question Review</h3>
            <div className="space-y-2">
              {currentQuiz.questions.map((q, i) => {
                const isCorrect = answers[i] === q.correctAnswer;
                return (
                  <div
                    key={q.id}
                    className={`flex items-center gap-3 p-2 rounded-lg ${
                      isCorrect ? "bg-[#10B981]/10" : "bg-[#EF4444]/10"
                    }`}
                  >
                    {isCorrect ? (
                      <CheckCircle className="w-5 h-5 text-[#10B981]" />
                    ) : (
                      <XCircle className="w-5 h-5 text-[#EF4444]" />
                    )}
                    <span className="text-sm flex-1 truncate">
                      Question {i + 1}
                    </span>
                    <Badge
                      variant={isCorrect ? "default" : "destructive"}
                      className={isCorrect ? "bg-[#10B981]" : ""}
                    >
                      {isCorrect ? "Correct" : "Wrong"}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setCurrentPage("dashboard")}
              className="flex-1 border-[#2A2A2E]"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            {score < 50 && (
              <Button
                onClick={() => {
                  setShowResults(false);
                  setCurrentQuestionIndex(0);
                  setTimeLeft(QUESTION_TIME);
                  setSelectedAnswer(null);
                  setHasAnswered(false);
                  setAnswers([]);
                }}
                className="flex-1 bg-[#6D28D9] hover:bg-[#5B21B6]"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            )}
            {score >= 50 && (
              <Button
                onClick={() => setCurrentPage("roadmap")}
                className="flex-1 bg-[#10B981] hover:bg-[#059669]"
              >
                <Trophy className="w-4 h-4 mr-2" />
                Continue
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // Render error state if no quiz
  if (!currentQuiz) {
    return (
      <div className="min-h-screen bg-[#0F0F11] flex items-center justify-center">
        <Card className="bg-[#1A1A1E] border-[#2A2A2E] p-8 text-center">
          <AlertCircle className="w-12 h-12 text-[#9CA3AF] mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">No Active Quiz</h2>
          <p className="text-[#9CA3AF] mb-4">
            Start a quiz from your roadmap or practice section
          </p>
          <Button
            onClick={() => setCurrentPage("dashboard")}
            className="bg-[#6D28D9]"
          >
            Go to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  // Render error state if no questions
  if (!currentQuiz.questions || currentQuiz.questions.length === 0 || currentQuestionIndex >= currentQuiz.questions.length) {
    return (
      <div className="min-h-screen bg-[#0F0F11] flex items-center justify-center p-4">
        <Card className="bg-[#1A1A1E] border-[#2A2A2E] p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-[#EF4444] mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Quiz Error</h2>
          <p className="text-[#9CA3AF] mb-4">Unable to load quiz questions. Please try again.</p>
          <Button
            onClick={() => setCurrentPage('dashboard')}
            className="bg-[#CCFF00] text-[#0F0F11] hover:bg-[#B3E600]"
          >
            Go to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  // Quiz Interface
  return (
    <div className="min-h-screen bg-[#0F0F11] p-4 pb-24">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-4"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentPage("dashboard")}
          className="text-[#9CA3AF]"
        >
          <ChevronLeft size={24} />
        </Button>
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-[#CCFF00]" />
          <span className="font-bold">
            {getSubjectName(currentQuiz.subjectId)}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={speakQuestion}
          className={`${isSpeaking ? "text-[#CCFF00]" : "text-[#9CA3AF]"}`}
        >
          {isSpeaking ? <Volume2 size={24} /> : <VolumeX size={24} />}
        </Button>
      </motion.header>

      {/* Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-[#9CA3AF]">
            Question {currentQuestionIndex + 1} of {currentQuiz.totalQuestions}
          </span>
          <span className="text-sm font-bold text-[#CCFF00]">
            {Math.round(progress)}%
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </motion.div>

      {/* Timer */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="flex justify-center mb-6"
      >
        <div
          className={`relative w-20 h-20 rounded-full flex items-center justify-center border-4 ${
            timeLeft <= 10
              ? "border-[#EF4444] animate-pulse"
              : timeLeft <= 20
                ? "border-[#F59E0B]"
                : "border-[#CCFF00]"
          }`}
        >
          <svg className="absolute inset-0 w-full h-full transform -rotate-90">
            <circle
              cx="40"
              cy="40"
              r="36"
              stroke="#2A2A2E"
              strokeWidth="4"
              fill="none"
            />
            <motion.circle
              cx="40"
              cy="40"
              r="36"
              stroke={
                timeLeft <= 10
                  ? "#EF4444"
                  : timeLeft <= 20
                    ? "#F59E0B"
                    : "#CCFF00"
              }
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${(timeLeft / QUESTION_TIME) * 226} 226`}
            />
          </svg>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span
              className={`font-bold ${timeLeft <= 10 ? "text-[#EF4444]" : ""}`}
            >
              {timeLeft}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="bg-[#1A1A1E] border-[#2A2A2E] p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <Badge
                variant="outline"
                className="border-[#6D28D9] text-[#CCFF00]"
              >
                {currentQuestion?.topic || currentQuestion?.subjectId || "General"}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={speakQuestion}
                className={`${isSpeaking ? "text-[#CCFF00]" : "text-[#9CA3AF]"}`}
              >
                {isSpeaking ? <Volume2 size={20} /> : <VolumeX size={20} />}
                <span className="ml-2">
                  {isSpeaking ? "Speaking..." : "Listen"}
                </span>
              </Button>
            </div>
            <h2 className="text-lg font-medium leading-relaxed">
              {currentQuestion?.question || "Question loading..."}
            </h2>
          </Card>

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion?.options?.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = index === currentQuestion?.correctAnswer;
              const showCorrect = hasAnswered && isCorrect;
              const showWrong = hasAnswered && isSelected && !isCorrect;

              return (
                <motion.button
                  key={index}
                  onClick={() => handleAnswer(index)}
                  disabled={hasAnswered}
                  whileHover={!hasAnswered ? { scale: 1.02 } : {}}
                  whileTap={!hasAnswered ? { scale: 0.98 } : {}}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    showCorrect
                      ? "bg-[#10B981]/20 border-[#10B981]"
                      : showWrong
                        ? "bg-[#EF4444]/20 border-[#EF4444]"
                        : isSelected
                          ? "bg-[#6D28D9]/20 border-[#6D28D9]"
                          : "bg-[#1A1A1E] border-[#2A2A2E] hover:border-[#6D28D9]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        showCorrect
                          ? "bg-[#10B981] text-white"
                          : showWrong
                            ? "bg-[#EF4444] text-white"
                            : isSelected
                              ? "bg-[#6D28D9] text-white"
                              : "bg-[#2A2A2E] text-[#9CA3AF]"
                      }`}
                    >
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className="flex-1">{option}</span>
                    {showCorrect && (
                      <CheckCircle className="w-5 h-5 text-[#10B981]" />
                    )}
                    {showWrong && (
                      <XCircle className="w-5 h-5 text-[#EF4444]" />
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Explanation */}
          <AnimatePresence>
            {hasAnswered && currentQuestion && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mt-4"
              >
                <Card
                  className={`p-4 ${
                    selectedAnswer === currentQuestion.correctAnswer
                      ? "bg-[#10B981]/10 border-[#10B981]/30"
                      : "bg-[#F59E0B]/10 border-[#F59E0B]/30"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {selectedAnswer === currentQuestion.correctAnswer ? (
                      <CheckCircle className="w-5 h-5 text-[#10B981] mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-[#F59E0B] mt-0.5" />
                    )}
                    <div>
                      <p className="font-medium mb-1">
                        {selectedAnswer === currentQuestion.correctAnswer
                          ? "Correct!"
                          : "Not quite right"}
                      </p>
                      <p className="text-sm text-[#9CA3AF]">
                        {currentQuestion.explanation}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>

      {/* Next Button */}
      <AnimatePresence>
        {hasAnswered && !isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-24 left-4 right-4"
          >
            <Button
              onClick={handleNext}
              className="w-full h-14 bg-gradient-to-r from-[#6D28D9] to-[#CCFF00] text-[#0F0F11] font-bold text-lg"
            >
              {currentQuestionIndex < currentQuiz.totalQuestions - 1 ? (
                <>
                  Next Question
                  <ChevronRight className="w-5 h-5 ml-2" />
                </>
              ) : (
                <>
                  Finish Quiz
                  <Trophy className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Processing Overlay */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0F0F11]/90 flex items-center justify-center z-50"
          >
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="mb-6"
              >
                <Loader2 className="w-16 h-16 text-[#CCFF00]" />
              </motion.div>
              <h2 className="text-2xl font-bold mb-2">
                Processing Quiz Results...
              </h2>
              <p className="text-[#9CA3AF] mb-4">
                Please wait while we calculate your score
              </p>
              <div className="flex items-center justify-center gap-2 text-[#CCFF00]">
                <span className="text-sm">Redirecting to Dashboard in</span>
                <span className="font-bold">{countdown} seconds</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
