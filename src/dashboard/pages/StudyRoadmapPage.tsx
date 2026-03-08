/**
 * Study Roadmap Page
 * 
 * Displays the user's study roadmap and daily tasks.
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Map, Calendar, CheckCircle2, Circle, Clock, BookOpen, Trophy, Loader2 } from "lucide-react";
import { DashboardLayout } from "../components/DashboardLayout";
import { roadmapApi } from "@/api/roadmap.api";
import type { RoadmapDay, RoadmapTask, TodayRoadmapResponse } from "@/types/api.types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function StudyRoadmapPage() {
  const [roadmap, setRoadmap] = useState<RoadmapDay[]>([]);
  const [today, setToday] = useState<RoadmapDay | TodayRoadmapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [completingTask, setCompletingTask] = useState<string | null>(null);

  // Fetch roadmap data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [todayData, fullRoadmap] = await Promise.all([
          roadmapApi.getToday().catch(() => null),
          roadmapApi.getFullRoadmap().catch(() => ({ days: [] })),
        ]);
        setToday(todayData);
        setRoadmap(fullRoadmap.days || []);
      } catch (error) {
        console.error("[Roadmap] Failed to fetch:", error);
        toast.error("Failed to load roadmap");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Complete a task
  const completeTask = async (taskId: string) => {
    setCompletingTask(taskId);
    try {
      await roadmapApi.completeTask(taskId);
      
      // Update local state
      setToday((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          tasks: prev.tasks.map((t: RoadmapTask) =>
            t.id === taskId ? { ...t, is_completed: true } : t
          ),
        };
      });

      toast.success("Task completed!");
    } catch (error) {
      console.error("[Roadmap] Failed to complete task:", error);
      toast.error("Failed to complete task");
    } finally {
      setCompletingTask(null);
    }
  };

  // Calculate progress
  const getProgress = (day: RoadmapDay) => {
    if (!day.tasks.length) return 0;
    const completed = day.tasks.filter((t: RoadmapTask) => t.is_completed).length;
    return Math.round((completed / day.tasks.length) * 100);
  };

  // Get task icon
  const getTaskIcon = (type: RoadmapTask["type"]) => {
    switch (type) {
      case "study":
        return <BookOpen className="h-4 w-4" />;
      case "quiz":
        return <Trophy className="h-4 w-4" />;
      case "revision":
        return <Clock className="h-4 w-4" />;
      case "practice":
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return <Circle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Study Roadmap">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-[#18A0FB]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Study Roadmap">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Page Title */}
        <div>
          <h1 className="text-2xl font-bold text-white">Study Roadmap</h1>
          <p className="text-gray-400">Your personalized learning journey</p>
        </div>

        {/* Today's Tasks */}
        {today && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-gradient-to-r from-[#18A0FB]/10 to-[#0B54A0]/10 border-[#18A0FB]/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-[#18A0FB] flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-white">Today's Tasks</CardTitle>
                      <CardDescription className="text-gray-400">
                        Day {(today as RoadmapDay).day_number} • {(today as RoadmapDay).estimated_hours || 0} hours estimated
                      </CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">{getProgress(today as RoadmapDay)}%</p>
                    <p className="text-xs text-gray-500">Complete</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Progress value={getProgress(today as RoadmapDay)} className="mb-6 h-2" />
                
                <div className="space-y-3">
                  {today.tasks.map((task: RoadmapTask, index: number) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-lg border",
                        task.is_completed
                          ? "bg-green-500/10 border-green-500/30"
                          : "bg-[#0F0F11] border-white/10"
                      )}
                    >
                      <button
                        onClick={() => !task.is_completed && completeTask(task.id)}
                        disabled={task.is_completed || completingTask === task.id}
                        className={cn(
                          "flex-shrink-0 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors",
                          task.is_completed
                            ? "bg-green-500 border-green-500"
                            : "border-gray-500 hover:border-[#18A0FB]"
                        )}
                      >
                        {task.is_completed && (
                          <CheckCircle2 className="h-4 w-4 text-white" />
                        )}
                      </button>

                      <div className={cn(
                        "h-10 w-10 rounded-lg flex items-center justify-center",
                        task.is_completed
                          ? "bg-green-500/20 text-green-400"
                          : "bg-[#18A0FB]/20 text-[#18A0FB]"
                      )}>
                        {getTaskIcon(task.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "font-medium truncate",
                          task.is_completed ? "text-gray-400 line-through" : "text-white"
                        )}>
                          {task.title}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {task.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500 whitespace-nowrap">
                          {task.duration_minutes} min
                        </span>
                        {!task.is_completed && (
                          <Button
                            size="sm"
                            onClick={() => completeTask(task.id)}
                            disabled={completingTask === task.id}
                            className="bg-[#18A0FB] hover:bg-[#0B54A0]"
                          >
                            {completingTask === task.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Complete"
                            )}
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Full Roadmap */}
        {roadmap.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-[#1A1A1D] border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Map className="h-5 w-5 text-[#18A0FB]" />
                  Your Learning Path
                </CardTitle>
                <CardDescription className="text-gray-400">
                  {roadmap.length} days to exam readiness
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {roadmap.map((day) => {
                    const progress = getProgress(day);
                    const isCurrentDay = day.day_number === today?.day_number;
                    
                    return (
                      <div
                        key={day.id}
                        className={cn(
                          "p-4 rounded-lg border transition-colors cursor-pointer hover:border-[#18A0FB]/50",
                          isCurrentDay
                            ? "bg-[#18A0FB]/10 border-[#18A0FB]/30"
                            : day.is_completed
                            ? "bg-green-500/10 border-green-500/30"
                            : "bg-[#0F0F11] border-white/10"
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-400">
                            Day {day.day_number}
                          </span>
                          {isCurrentDay && (
                            <Badge className="bg-[#18A0FB] text-white">Today</Badge>
                          )}
                          {day.is_completed && (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                              Done
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-medium text-white mb-1 truncate">
                          {day.title}
                        </h4>
                        <p className="text-xs text-gray-500 mb-3">
                          {day.tasks.length} tasks • {day.estimated_hours} hrs
                        </p>
                        <div className="flex items-center gap-2">
                          <Progress value={progress} className="h-1.5 flex-1" />
                          <span className="text-xs text-gray-400">{progress}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Progress Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-[#1A1A1D] border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Overall Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-4">
                <div className="text-center p-4 rounded-lg bg-[#0F0F11]">
                  <p className="text-2xl font-bold text-[#18A0FB]">
                    {roadmap.filter((d) => d.is_completed).length}
                  </p>
                  <p className="text-sm text-gray-500">Days Completed</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-[#0F0F11]">
                  <p className="text-2xl font-bold text-white">
                    {roadmap.filter((d) => d.is_unlocked && !d.is_completed).length}
                  </p>
                  <p className="text-sm text-gray-500">Days Active</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-[#0F0F11]">
                  <p className="text-2xl font-bold text-yellow-500">
                    {roadmap.reduce((acc: number, day: RoadmapDay) => acc + day.tasks.filter((t: RoadmapTask) => t.is_completed).length, 0)}
                  </p>
                  <p className="text-sm text-gray-500">Tasks Done</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-[#0F0F11]">
                  <p className="text-2xl font-bold text-green-500">
                    {Math.round(
                      (roadmap.reduce((acc, day) => acc + getProgress(day), 0) / (roadmap.length || 1))
                    )}%
                  </p>
                  <p className="text-sm text-gray-500">Avg Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

export default StudyRoadmapPage;
