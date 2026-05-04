import { useNavigate } from "react-router-dom";
import { useStore } from "@/store";
import { usePaymentStatus } from "@/hooks/usePayment";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { NotePage } from "@/components/NotePage";
import {
  Lock,
  CheckCircle,
  BookOpen,
  FileQuestion,
  RotateCcw,
  Flame,
  Target,
  AlertCircle,
  Crown,
  Loader2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";

export function RoadmapPage() {
  const navigate = useNavigate();
  const {
    roadmap,
    user,
    subjects,
    startQuiz,
    completeTask,
    generateRoadmap,
    isGeneratingRoadmap,
    fetchStudyRoadmapCurrent,
    syncStudyRoadmapCurrentPhase,
  } = useStore();
  const { isPaid, isLoading: isCheckingPayment } = usePaymentStatus();

  useEffect(() => {
    if (!user?.examDate || !isPaid || isCheckingPayment) return;
    void fetchStudyRoadmapCurrent();
  }, [
    user?.id,
    user?.examDate,
    isPaid,
    isCheckingPayment,
    fetchStudyRoadmapCurrent,
  ]);

  // Note Page state
  const [isNotePageOpen, setIsNotePageOpen] = useState(false);
  const [currentTaskIndex, setCurrentTaskIndex] = useState<number | null>(null);
  const [currentDayIndex, setCurrentDayIndex] = useState<number | null>(null);
  const [noteHtml, setNoteHtml] = useState<string | null>(null);
  const [noteLoading, setNoteLoading] = useState(false);

  if (!user) return null;

  // Safety check for roadmap
  if (!roadmap || roadmap.length === 0) {
    // Return early or show empty state - handled by JSX below
  }

  // Get the current task being viewed
  const getCurrentTask = () => {
    if (currentDayIndex !== null && currentTaskIndex !== null) {
      return roadmap[currentDayIndex]?.tasks[currentTaskIndex];
    }
    return null;
  };

  // Get the next task in the roadmap
  const getNextTask = () => {
    if (currentDayIndex === null || currentTaskIndex === null) return null;

    const currentDay = roadmap[currentDayIndex];
    const nextTaskInDay = currentDay.tasks[currentTaskIndex + 1];

    if (nextTaskInDay) {
      return {
        task: nextTaskInDay,
        dayIndex: currentDayIndex,
        taskIndex: currentTaskIndex + 1,
      };
    }

    // Move to next day - only if unlocked
    const nextDay = roadmap[currentDayIndex + 1];
    if (nextDay && nextDay.isUnlocked && nextDay.tasks.length > 0) {
      return {
        task: nextDay.tasks[0],
        dayIndex: currentDayIndex + 1,
        taskIndex: 0,
      };
    }

    return null;
  };

  // Fetch note HTML from backend
  const fetchNoteHtml = async (topicId: string) => {
    setNoteLoading(true);
    try {
      const response = await fetch(`/api/notes/${topicId}`);
      if (!response.ok) throw new Error("Failed to fetch note");
      const data = await response.json();
      setNoteHtml(data.note_html || "");
    } catch (err) {
      console.error("[Note] Fetch failed:", err);
      toast.error("Could not load note. Please try again.");
      setIsNotePageOpen(false);
    } finally {
      setNoteLoading(false);
    }
  };

  // Open note page for a task
  const handleOpenNoteTask = (
    task: (typeof roadmap)[0]["tasks"][0],
    dayIndex: number,
    taskIndex: number,
  ) => {
    if (task.type !== "study" && task.type !== "revision") return;

    setCurrentDayIndex(dayIndex);
    setCurrentTaskIndex(taskIndex);
    setIsNotePageOpen(true);
    fetchNoteHtml(task.topicId);
  };

  // Handle Next button in note page
  const handleNoteNext = async () => {
    const currentTask = getCurrentTask();
    if (!currentTask) return;

    // Mark current task as completed
    completeTask(currentTask.id);

    const nextItem = getNextTask();

    if (!nextItem) {
      // No next task - return to roadmap
      setIsNotePageOpen(false);
      toast.success("All tasks completed!");
      return;
    }

    const {
      task: nextTask,
      dayIndex: nextDayIndex,
      taskIndex: nextTaskIndex,
    } = nextItem;

    if (nextTask.type === "quiz") {
      // Close note page and start quiz
      setIsNotePageOpen(false);
      startQuiz(nextTask.subjectId, nextTask.topicId, "daily");
    } else if (nextTask.type === "study" || nextTask.type === "revision") {
      // Open next note
      setCurrentDayIndex(nextDayIndex);
      setCurrentTaskIndex(nextTaskIndex);
      fetchNoteHtml(nextTask.topicId);
    } else {
      // Handle other task types (assignment, reinforcement, etc.)
      completeTask(nextTask.id);
      toast.success(`Completed: ${nextTask.title}`);
      setCurrentDayIndex(nextDayIndex);
      setCurrentTaskIndex(nextTaskIndex);
      // Optionally close note and return to roadmap
      // setIsNotePageOpen(false);
    }
  };

  // Handle close note page
  const handleCloseNotePage = () => {
    setIsNotePageOpen(false);
    setCurrentTaskIndex(null);
    setCurrentDayIndex(null);
    setNoteHtml(null);
  };

  // Handle mark complete button
  const handleMarkComplete = () => {
    const currentTask = getCurrentTask();
    if (!currentTask) return;

    // Block quiz completion - must take the quiz
    if (currentTask.type === "quiz") {
      toast.error("You cannot mark a quiz as complete. Take the quiz.");
      return;
    }

    completeTask(currentTask.id);
    toast.success(`Marked "${currentTask.title}" as complete!`);
  };

  const handleStartTask = (
    task: (typeof roadmap)[0]["tasks"][0],
    dayIndex: number,
    taskIndex: number,
  ) => {
    if (task.type === "study" || task.type === "revision") {
      handleOpenNoteTask(task, dayIndex, taskIndex);
    } else if (task.type === "quiz") {
      startQuiz(task.subjectId, task.topicId, "daily");
    } else {
      completeTask(task.id);
      toast.success(`Completed: ${task.title}`);
    }
  };

  const handleDayClick = (day: (typeof roadmap)[0]) => {
    if (!day.isUnlocked) {
      toast.error("Complete previous days to unlock!", {
        description: "Score at least 50% on the quiz to proceed.",
      });
      return;
    }
    void syncStudyRoadmapCurrentPhase(day.dayNumber);
  };

  const getSubjectColor = (subjectId: string) => {
    const subject = subjects.find((s) => s.id === subjectId);
    return subject?.color || "#6D28D9";
  };

  const getSubjectName = (subjectId: string) => {
    const subject = subjects.find((s) => s.id === subjectId);
    return subject?.name || "Unknown";
  };

  const handleGenerateRoadmap = async () => {
    try {
      await generateRoadmap();
      if (useStore.getState().roadmap.length > 0) {
        toast.success("Your personalized roadmap is ready!");
      }
    } catch {
      toast.error("Could not generate roadmap. Please try again.");
    }
  };

  const progressPct =
    roadmap.length > 0
      ? Math.round(
          (roadmap.filter((d) => d.isCompleted).length / roadmap.length) * 100,
        )
      : 0;

  return (
    <div className="min-h-screen bg-[#0F0F11] p-4 pb-24">
      {/* Note Page Overlay */}
      {isNotePageOpen && (
        <NotePage
          task={getCurrentTask()}
          noteHtml={noteHtml}
          isLoading={noteLoading}
          hasNextTask={getNextTask() !== null}
          dayNumber={
            currentDayIndex !== null
              ? roadmap[currentDayIndex]?.dayNumber || currentDayIndex + 1
              : 1
          }
          taskType={getCurrentTask()?.type}
          onClose={handleCloseNotePage}
          onNext={handleNoteNext}
          onMarkComplete={handleMarkComplete}
        />
      )}

      {/* Payment Required Banner - Show if not paid */}
      {!isPaid && !isCheckingPayment && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <Card className="bg-gradient-to-r from-[#6D28D9] to-[#4C1D95] border-none p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                <Crown className="w-5 h-5 text-[#CCFF00]" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-white">Unlock Full Access</p>
                <p className="text-xs text-white/70">
                  Complete payment to access your personalized roadmap
                </p>
              </div>
              <Button
                onClick={() => navigate("/dashboard/pay")}
                className="bg-[#CCFF00] text-[#0F0F11] hover:bg-[#B3E600] font-semibold text-sm"
              >
                Pay Now
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Paid user: roadmap must be generated explicitly */}
      {isPaid && !isCheckingPayment && roadmap.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="bg-[#1A1A1E] border-[#6D28D9]/40 p-6 text-center">
            <Sparkles className="w-10 h-10 text-[#CCFF00] mx-auto mb-3" />
            <h2 className="text-lg font-bold text-white mb-2">
              Generate your study roadmap
            </h2>
            <p className="text-sm text-[#9CA3AF] mb-4 max-w-md mx-auto">
              We’ll build your personalized day-by-day plan from your profile
              and subjects. You can regenerate anytime from here.
            </p>
            <Button
              onClick={() => void handleGenerateRoadmap()}
              disabled={isGeneratingRoadmap}
              className="bg-[#6D28D9] hover:bg-[#5B21B6] text-white min-w-[200px]"
            >
              {isGeneratingRoadmap ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate my roadmap
                </>
              )}
            </Button>
          </Card>
        </motion.div>
      )}

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold mb-1">Your Flight Path 🚀</h1>
        <p className="text-[#9CA3AF]">
          {roadmap.length === 0
            ? "No roadmap yet — generate one to get started."
            : `${roadmap.filter((d) => d.isCompleted).length} of ${roadmap.length} days completed`}
        </p>
      </motion.header>

      {/* Overall Progress */}
      {roadmap.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card className="bg-[#1A1A1E] border-[#2A2A2E] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#9CA3AF]">Overall Progress</span>
              <span className="text-sm font-bold text-[#CCFF00]">
                {progressPct}%
              </span>
            </div>
            <Progress value={progressPct} className="h-2" />
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#10B981]" />
                <span className="text-xs text-[#9CA3AF]">Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#CCFF00]" />
                <span className="text-xs text-[#9CA3AF]">Current</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#4B5563]" />
                <span className="text-xs text-[#9CA3AF]">Locked</span>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Timeline */}
      {roadmap.length > 0 && (
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-[#2A2A2E]" />

          {/* Days */}
          <div className="space-y-4">
            {roadmap.map((day, index) => (
              <motion.div
                key={day.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Card
                  onClick={() => handleDayClick(day)}
                  className={`relative ml-12 border transition-all cursor-pointer ${
                    day.isCompleted
                      ? "bg-[#1A1A1E] border-[#10B981]/30"
                      : day.isUnlocked
                        ? "bg-[#1A1A1E] border-[#CCFF00]/50"
                        : "bg-[#1A1A1E]/50 border-[#2A2A2E]"
                  }`}
                >
                  {/* Node */}
                  <div
                    className={`absolute -left-[42px] top-4 w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                      day.isCompleted
                        ? "bg-[#10B981] border-[#10B981]"
                        : day.isUnlocked
                          ? "bg-[#CCFF00] border-[#CCFF00] animate-pulse"
                          : "bg-[#1A1A1E] border-[#4B5563]"
                    }`}
                  >
                    {day.isCompleted ? (
                      <CheckCircle className="w-5 h-5 text-white" />
                    ) : day.isUnlocked ? (
                      <Flame className="w-5 h-5 text-[#0F0F11]" />
                    ) : (
                      <Lock className="w-4 h-4 text-[#4B5563]" />
                    )}
                  </div>

                  <div className="p-4">
                    {/* Day Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">Day {day.dayNumber}</span>
                        {day.isCompleted && (
                          <Badge className="bg-[#10B981] text-white">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Done
                          </Badge>
                        )}
                        {day.isUnlocked && !day.isCompleted && (
                          <Badge className="bg-[#CCFF00] text-[#0F0F11]">
                            <Target className="w-3 h-3 mr-1" />
                            Current
                          </Badge>
                        )}
                        {!day.isUnlocked && (
                          <Badge
                            variant="outline"
                            className="border-[#4B5563] text-[#9CA3AF]"
                          >
                            <Lock className="w-3 h-3 mr-1" />
                            Locked
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-[#9CA3AF]">
                        {day.estimatedHours}h
                      </span>
                    </div>

                    {/* Day Progress Bar */}
                    {day.isUnlocked && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-[#9CA3AF]">
                            Progress
                          </span>
                          <span className="text-xs font-medium text-[#CCFF00]">
                            {
                              day.tasks.filter((t) => t.status === "completed")
                                .length
                            }
                            /{day.tasks.length} tasks
                          </span>
                        </div>
                        <Progress
                          value={
                            (day.tasks.filter((t) => t.status === "completed")
                              .length /
                              day.tasks.length) *
                            100
                          }
                          className="h-1.5"
                        />
                      </div>
                    )}

                    {/* Tasks */}
                    {day.isUnlocked && (
                      <div className="space-y-2">
                        {day.tasks.map((task, taskIndex) => (
                          <div
                            key={task.id}
                            className={`flex items-center justify-between p-2 rounded-lg ${
                              task.status === "completed"
                                ? "bg-[#10B981]/10"
                                : "bg-[#0F0F11]"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center"
                                style={{
                                  backgroundColor:
                                    task.status === "completed"
                                      ? "#10B981"
                                      : `${getSubjectColor(task.subjectId)}20`,
                                }}
                              >
                                {task.type === "study" && (
                                  <BookOpen
                                    className="w-4 h-4"
                                    style={{
                                      color:
                                        task.status === "completed"
                                          ? "white"
                                          : getSubjectColor(task.subjectId),
                                    }}
                                  />
                                )}
                                {task.type === "quiz" && (
                                  <FileQuestion
                                    className="w-4 h-4"
                                    style={{
                                      color:
                                        task.status === "completed"
                                          ? "white"
                                          : getSubjectColor(task.subjectId),
                                    }}
                                  />
                                )}
                                {task.type === "revision" && (
                                  <RotateCcw
                                    className="w-4 h-4"
                                    style={{
                                      color:
                                        task.status === "completed"
                                          ? "white"
                                          : getSubjectColor(task.subjectId),
                                    }}
                                  />
                                )}
                              </div>
                              <div>
                                <p
                                  className={`text-sm font-medium ${
                                    task.status === "completed"
                                      ? "line-through opacity-60"
                                      : ""
                                  }`}
                                >
                                  {task.title}
                                </p>
                                <p className="text-xs text-[#9CA3AF]">
                                  {getSubjectName(task.subjectId)} •{" "}
                                  {task.duration}min
                                </p>
                              </div>
                            </div>

                            {task.status !== "completed" && day.isUnlocked && (
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartTask(
                                    task,
                                    roadmap.indexOf(day),
                                    taskIndex,
                                  );
                                }}
                                className="bg-[#6D28D9] hover:bg-[#5B21B6]"
                              >
                                Start
                              </Button>
                            )}

                            {task.status === "completed" && (
                              <CheckCircle className="w-5 h-5 text-[#10B981]" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Quiz Score */}
                    {day.quizCompleted && day.quizScore !== null && (
                      <div className="mt-3 pt-3 border-t border-[#2A2A2E]">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-[#9CA3AF]">
                            Quiz Score
                          </span>
                          <span
                            className={`font-bold ${
                              day.quizScore >= 70
                                ? "text-[#10B981]"
                                : day.quizScore >= 50
                                  ? "text-[#F59E0B]"
                                  : "text-[#EF4444]"
                            }`}
                          >
                            {day.quizScore}%
                          </span>
                        </div>
                        {day.quizScore < 50 && (
                          <div className="flex items-center gap-2 mt-2 text-xs text-[#EF4444]">
                            <AlertCircle className="w-4 h-4" />
                            <span>
                              Score below 50%. Reinforcement assigned.
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Revision Period Notice */}
      {roadmap.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <Card className="bg-gradient-to-r from-[#6D28D9]/20 to-[#CCFF00]/20 border-[#6D28D9]/50 p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[#6D28D9] rounded-full flex items-center justify-center">
                <RotateCcw className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold">Revision Period</h3>
                <p className="text-sm text-[#9CA3AF] mt-1">
                  The last 2 weeks before your exam are reserved for intensive
                  revision and past question practice. Complete your roadmap
                  early!
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Locked Content Overlay - Show if not paid */}
      {!isPaid && !isCheckingPayment && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-[#0F0F11]/95 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          style={{ top: "60px" }}
        >
          <Card className="bg-[#1A1A1E] border-[#2A2A2E] p-8 max-w-md w-full text-center">
            <div className="w-20 h-20 bg-[#6D28D9]/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-[#6D28D9]" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Roadmap Locked</h2>
            <p className="text-[#9CA3AF] mb-6">
              Complete payment to unlock your personalized study roadmap and
              start your JAMB preparation journey.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-[#9CA3AF] justify-center">
                <CheckCircle className="w-4 h-4 text-[#CCFF00]" />
                <span>Personalized AI-generated roadmap</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-[#9CA3AF] justify-center">
                <CheckCircle className="w-4 h-4 text-[#CCFF00]" />
                <span>Daily study tasks and quizzes</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-[#9CA3AF] justify-center">
                <CheckCircle className="w-4 h-4 text-[#CCFF00]" />
                <span>Progress tracking & analytics</span>
              </div>
            </div>
            <Button
              onClick={() => navigate("/dashboard/pay")}
              className="w-full mt-6 bg-[#CCFF00] text-[#0F0F11] hover:bg-[#B3E600] font-semibold"
            >
              <Crown className="w-4 h-4 mr-2" />
              Unlock Full Access
            </Button>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
