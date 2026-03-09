/**
 * Dashboard Home Page
 * 
 * Main dashboard overview for authenticated users.
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  BookOpen, 
  Trophy, 
  Clock, 
  Flame, 
  Target,
  ArrowRight,
  Loader2
} from "lucide-react";
import { DashboardLayout } from "../components/DashboardLayout";
import { roadmapApi } from "@/api/roadmap.api";
import type { RoadmapDay, RoadmapTask, TodayRoadmapResponse } from "@/types/api.types";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";

export function DashboardPage() {
  const { user } = useAuth();
  const [today, setToday] = useState<RoadmapDay | TodayRoadmapResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch today's roadmap
  useEffect(() => {
    const fetchData = async () => {
      try {
        const todayData = await roadmapApi.getToday().catch(() => null);
        setToday(todayData);
      } catch (error) {
        console.error("[Dashboard] Failed to fetch:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate progress
  const getProgress = (day: RoadmapDay) => {
    if (!day.tasks.length) return 0;
    const completed = day.tasks.filter((t: RoadmapTask) => t.is_completed).length;
    return Math.round((completed / day.tasks.length) * 100);
  };

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-[#C4F135]" />
        </div>
      </DashboardLayout>
    );
  }

  const progress = today ? getProgress(today as RoadmapDay) : 0;
  const completedTasks = today?.tasks.filter((t: RoadmapTask) => t.is_completed).length || 0;
  const totalTasks = today?.tasks.length || 0;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold text-white">
            {getGreeting()}, {user?.nickname || user?.username || "Learner"}!
          </h1>
          <p className="text-gray-400 mt-1">
            Ready to continue your JAMB preparation journey?
          </p>
        </motion.div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
          >
            <Card className="bg-[#141419] border-white/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Today&apos;s Progress
                </CardTitle>
                <Target className="h-4 w-4 text-[#C4F135]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{progress}%</div>
                <Progress value={progress} className="h-1.5 mt-2" />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-[#141419] border-white/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Tasks Completed
                </CardTitle>
                <BookOpen className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{completedTasks}/{totalTasks}</div>
                <p className="text-xs text-gray-500 mt-1">tasks done today</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-[#141419] border-white/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Study Streak
                </CardTitle>
                <Flame className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{user?.referral_points || 0}</div>
                <p className="text-xs text-gray-500 mt-1">referral points</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-[#141419] border-white/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Study Time
                </CardTitle>
                <Clock className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{(today as RoadmapDay)?.estimated_hours || 0}h</div>
                <p className="text-xs text-gray-500 mt-1">estimated today</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Today's Roadmap */}
        {today && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-gradient-to-r from-[#7C3AED]/10 to-[#4F2B8F]/10 border-[#7C3AED]/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Today&apos;s Study Plan</CardTitle>
                    <CardDescription className="text-gray-400">
                      Day {(today as RoadmapDay).day_number} • {(today as RoadmapDay).title || 'Study Session'}
                    </CardDescription>
                  </div>
                  <Link to="/study-roadmap">
                    <Button variant="outline" className="border-white/10 hover:bg-white/5">
                      View Roadmap
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {today.tasks.slice(0, 3).map((task: RoadmapTask) => (
                    <div
                      key={task.id}
                      className={`flex items-center gap-3 p-3 rounded-lg ${
                        task.is_completed
                          ? "bg-green-500/10 border border-green-500/30"
                          : "bg-[#0B0B0F] border border-white/10"
                      }`}
                    >
                      <div
                        className={`h-2 w-2 rounded-full ${
                          task.is_completed ? "bg-green-500" : "bg-[#7C3AED]"
                        }`}
                      />
                      <span
                        className={`flex-1 text-sm ${
                          task.is_completed
                            ? "text-gray-400 line-through"
                            : "text-white"
                        }`}
                      >
                        {task.title}
                      </span>
                      <span className="text-xs text-gray-500">
                        {task.duration_minutes} min
                      </span>
                    </div>
                  ))}
                  {today.tasks.length > 3 && (
                    <p className="text-sm text-gray-500 text-center py-2">
                      +{today.tasks.length - 3} more tasks
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-[#141419] border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-3">
                <Link to="/ai-tutor">
                  <Button
                    variant="outline"
                    className="w-full h-auto py-4 border-white/10 hover:bg-[#C4F135]/10 hover:border-[#18A0FB]/30 flex flex-col items-center gap-2"
                  >
                    <BookOpen className="h-6 w-6 text-[#C4F135]" />
                    <span className="text-white">Ask AI Tutor</span>
                  </Button>
                </Link>
                <Link to="/referrals">
                  <Button
                    variant="outline"
                    className="w-full h-auto py-4 border-white/10 hover:bg-[#C4F135]/10 hover:border-[#18A0FB]/30 flex flex-col items-center gap-2"
                  >
                    <Trophy className="h-6 w-6 text-yellow-500" />
                    <span className="text-white">View Referrals</span>
                  </Button>
                </Link>
                <Link to="/payments">
                  <Button
                    variant="outline"
                    className="w-full h-auto py-4 border-white/10 hover:bg-[#C4F135]/10 hover:border-[#18A0FB]/30 flex flex-col items-center gap-2"
                  >
                    <Target className="h-6 w-6 text-green-500" />
                    <span className="text-white">Upgrade Plan</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

export default DashboardPage;
