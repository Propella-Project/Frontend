import { useStore } from '@/store';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Flame,
  Target,
  Award,
  Zap,
  Calendar,
  ChevronRight,
  MessageCircle,
  Map,
  BookOpen,
  Star,
  Trophy,
  Settings,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { PERSONALITIES, RANKS } from '@/types';

export function Dashboard() {
  const { user, gamification, roadmap, assignments, quizHistory, setCurrentPage, resumeOnboarding } = useStore();

  if (!user) return null;

  const personality = PERSONALITIES[user.personality];
  const currentDay = roadmap.find((d) => d.isUnlocked && !d.isCompleted);
  const completedDays = roadmap.filter((d) => d.isCompleted).length;
  const totalDays = roadmap.length;


  // Get today's tasks
  const todayTasks = currentDay?.tasks || [];
  const pendingTasks = todayTasks.filter((t) => t.status === 'pending');
  const completedTasks = todayTasks.filter((t) => t.status === 'completed');

  // Get pending assignments
  const pendingAssignments = assignments.filter((a) => a.status === 'pending');

  // Chart data (mock for recent quiz scores)
  const chartData = quizHistory.slice(-7).map((q, i) => ({
    day: `Day ${i + 1}`,
    score: q.score,
  }));

  // If no quiz history, show sample data
  const displayChartData = chartData.length > 0 ? chartData : [
    { day: 'Mon', score: 65 },
    { day: 'Tue', score: 72 },
    { day: 'Wed', score: 58 },
    { day: 'Thu', score: 80 },
    { day: 'Fri', score: 85 },
    { day: 'Sat', score: 78 },
    { day: 'Sun', score: 90 },
  ];

  const rankInfo = RANKS.find((r) => r.name === gamification.rank) || RANKS[0];
  const levelProgress = (gamification.points / gamification.nextLevelPoints) * 100;

  return (
    <div className="min-h-screen bg-[#0F0F11] p-4 pb-24">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <p className="text-[#9CA3AF] text-sm">Good day,</p>
          <h1 className="text-2xl font-bold">{user.nickname}!</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-[#1A1A1E] px-3 py-2 rounded-full">
            <Flame className="w-5 h-5 text-orange-500" />
            <span className="font-bold">{gamification.streak}</span>
          </div>
          <div className="w-10 h-10 bg-gradient-to-br from-[#6D28D9] to-[#CCFF00] rounded-full flex items-center justify-center text-xl">
            {personality.avatar}
          </div>
          {/* Settings button to resume onboarding */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => resumeOnboarding()}
            className="w-10 h-10 rounded-full bg-[#1A1A1E] hover:bg-[#2A2A2E] text-[#9CA3AF] hover:text-white"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </motion.header>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 gap-3 mb-6"
      >
        <Card className="bg-[#1A1A1E] border-[#2A2A2E] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-[#CCFF00]" />
            <span className="text-sm text-[#9CA3AF]">Rank</span>
          </div>
          <p className="text-xl font-bold" style={{ color: rankInfo.color }}>
            {gamification.rank}
          </p>
          <p className="text-xs text-[#9CA3AF]">Level {gamification.level}</p>
        </Card>

        <Card className="bg-[#1A1A1E] border-[#2A2A2E] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-5 h-5 text-[#F59E0B]" />
            <span className="text-sm text-[#9CA3AF]">Points</span>
          </div>
          <p className="text-xl font-bold">{gamification.points.toLocaleString()}</p>
          <div className="mt-2">
            <Progress value={levelProgress} className="h-1" />
          </div>
        </Card>

        <Card className="bg-[#1A1A1E] border-[#2A2A2E] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-[#10B981]" />
            <span className="text-sm text-[#9CA3AF]">Avg Score</span>
          </div>
          <p className="text-xl font-bold">{gamification.averageScore}%</p>
          <p className="text-xs text-[#9CA3AF]">{gamification.quizzesCompleted} quizzes</p>
        </Card>

        <Card className="bg-[#1A1A1E] border-[#2A2A2E] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-[#3B82F6]" />
            <span className="text-sm text-[#9CA3AF]">Progress</span>
          </div>
          <p className="text-xl font-bold">{completedDays}/{totalDays}</p>
          <p className="text-xs text-[#9CA3AF]">Days completed</p>
        </Card>
      </motion.div>

      {/* Today's Mission */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Today's Mission</h2>
          <Badge variant="outline" className="border-[#CCFF00] text-[#CCFF00]">
            Day {currentDay?.dayNumber || 1}
          </Badge>
        </div>

        <Card className="bg-gradient-to-br from-[#6D28D9] to-[#4C1D95] border-none p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-white/80 text-sm mb-1">Ready to launch?</p>
              <h3 className="text-xl font-bold">
                {pendingTasks.length > 0
                  ? `You have ${pendingTasks.length} tasks pending`
                  : 'All tasks completed! 🎉'}
              </h3>
            </div>
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
              <Rocket className="w-6 h-6 text-[#CCFF00]" />
            </div>
          </div>

          <div className="space-y-2 mb-4">
            {todayTasks.slice(0, 3).map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 text-sm"
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    task.status === 'completed'
                      ? 'bg-[#10B981]'
                      : 'bg-white/20'
                  }`}
                >
                  {task.status === 'completed' && <Zap className="w-3 h-3" />}
                </div>
                <span className={task.status === 'completed' ? 'line-through opacity-60' : ''}>
                  {task.title}
                </span>
              </div>
            ))}
          </div>

          <Button
            onClick={() => setCurrentPage('roadmap')}
            className="w-full bg-[#CCFF00] text-[#0F0F11] hover:bg-[#B3E600] font-semibold"
          >
            {completedTasks.length === todayTasks.length && todayTasks.length > 0
              ? 'Review Today'
              : 'Start Learning'}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </Card>
      </motion.div>

      {/* Pending Assignments */}
      {pendingAssignments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">Pending Assignments</h2>
            <span className="text-sm text-[#EF4444]">{pendingAssignments.length}</span>
          </div>

          <div className="space-y-3">
            {pendingAssignments.slice(0, 2).map((assignment) => (
              <Card
                key={assignment.id}
                className="bg-[#1A1A1E] border-[#2A2A2E] p-4 cursor-pointer hover:border-[#EF4444] transition-colors"
                onClick={() => setCurrentPage('tasks')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{assignment.title}</p>
                    <p className="text-sm text-[#9CA3AF]">{assignment.description}</p>
                  </div>
                  <Badge variant="outline" className="border-[#EF4444] text-[#EF4444]">
                    {assignment.points} pts
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </motion.div>
      )}

      {/* Progress Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-6"
      >
        <h2 className="text-lg font-bold mb-3">Mastery Growth</h2>
        <Card className="bg-[#1A1A1E] border-[#2A2A2E] p-4">
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={displayChartData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#CCFF00" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#CCFF00" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <YAxis hide domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1A1A1E',
                    border: '1px solid #2A2A2E',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#9CA3AF' }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#CCFF00"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorScore)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </motion.div>

      {/* AI Tutor Widget */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card
          className="bg-[#1A1A1E] border-[#2A2A2E] p-4 cursor-pointer hover:border-[#6D28D9] transition-colors"
          onClick={() => setCurrentPage('tutor')}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-[#6D28D9] to-[#8B5CF6] rounded-full flex items-center justify-center text-3xl">
              {personality.avatar}
            </div>
            <div className="flex-1">
              <p className="font-bold">{personality.name}</p>
              <p className="text-sm text-[#9CA3AF]">
                "{personality.encouragement[0]}"
              </p>
            </div>
            <MessageCircle className="w-6 h-6 text-[#CCFF00]" />
          </div>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-6"
      >
        <h2 className="text-lg font-bold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-3">
          <Button
            variant="outline"
            className="flex flex-col items-center gap-2 h-auto py-4 border-[#2A2A2E] hover:border-[#6D28D9]"
            onClick={() => setCurrentPage('roadmap')}
          >
            <Map className="w-6 h-6 text-[#CCFF00]" />
            <span className="text-xs">Roadmap</span>
          </Button>
          <Button
            variant="outline"
            className="flex flex-col items-center gap-2 h-auto py-4 border-[#2A2A2E] hover:border-[#6D28D9]"
            onClick={() => setCurrentPage('catalog')}
          >
            <BookOpen className="w-6 h-6 text-[#3B82F6]" />
            <span className="text-xs">Practice</span>
          </Button>
          <Button
            variant="outline"
            className="flex flex-col items-center gap-2 h-auto py-4 border-[#2A2A2E] hover:border-[#6D28D9]"
            onClick={() => setCurrentPage('tasks')}
          >
            <Award className="w-6 h-6 text-[#F59E0B]" />
            <span className="text-xs">Tasks</span>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// Rocket icon component
function Rocket({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  );
}
