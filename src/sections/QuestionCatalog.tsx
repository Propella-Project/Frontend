import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Search,
  Target,
  TrendingUp,
  Zap,
  ChevronRight,
  History,
  Award,
  Loader2,
  Lock,
  Crown,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { aiQuizService } from '@/services/aiQuiz.service';
import { toast } from 'sonner';
import { usePaymentStatus } from '@/hooks/usePayment';

export function QuestionCatalog() {
  const navigate = useNavigate();
  const { subjects, quizHistory, startQuiz, user, gamification } = useStore();
  const { isPaid, isLoading: isCheckingPayment } = usePaymentStatus();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMarathonLoading, setIsMarathonLoading] = useState(false);

  if (!isPaid && !isCheckingPayment) {
    return (
      <div className="min-h-screen bg-[#0F0F11] p-4 pb-24 flex flex-col items-center justify-center">
        <Card className="bg-[#1A1A1E] border-[#2A2A2E] p-8 max-w-md text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#6D28D9]/20 border border-[#6D28D9]/40 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-[#CCFF00]" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Practice Locked</h2>
          <p className="text-[#9CA3AF] text-sm mb-6">
            Complete payment to unlock practice quizzes and past questions.
          </p>
          <Button
            onClick={() => navigate('/dashboard/pay')}
            className="bg-[#CCFF00] text-[#0F0F11] hover:bg-[#B3E600] font-semibold"
          >
            <Crown className="w-4 h-4 mr-2" />
            Unlock Full Access
          </Button>
        </Card>
      </div>
    );
  }

  const handleStartPractice = (subjectId: string) => {
    startQuiz(subjectId, null, 'daily');
  };

  const handleStartChallenge = () => {
    const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];
    startQuiz(randomSubject.id, null, 'challenge');
  };

  const handleStartMarathon = async () => {
    if (!user?.subjects || user.subjects.length === 0) {
      toast.error("Please select subjects in your profile first");
      return;
    }

    setIsMarathonLoading(true);
    toast.info("Generating 50 AI-powered questions... This may take a moment.");

    try {
      // Get user's selected subjects
      const userSubjects = subjects.filter(s => 
        user.subjects.some(us => us.id === s.id)
      );

      if (userSubjects.length === 0) {
        toast.error("No subjects found. Please complete onboarding.");
        return;
      }

      // Generate 50 AI-powered questions
      const questions = await aiQuizService.generateMarathonAIQuestions(
        userSubjects,
        50,
        "medium"
      );


      if (questions.length === 0) {
        toast.error("Failed to generate questions. Please try again.");
        return;
      }

      // Create marathon quiz
      const store = useStore.getState();
      const marathonQuiz = {
        id: `marathon_${Date.now()}`,
        userId: user.id || 'user_1',
        subjectId: userSubjects[0].id,
        topicId: null,
        type: 'marathon' as const,
        questions,
        answers: [],
        score: 0,
        totalQuestions: questions.length,
        timeTaken: 0,
        completed: false,
        createdAt: new Date(),
      };

      // Set the quiz in store
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (store as any).currentQuiz = marathonQuiz;
      store.setCurrentPage('quiz');

      toast.success(`Marathon mode started! ${questions.length} questions ready.`);
    } catch (error) {
      console.error("[Marathon] Failed to start:", error);
      toast.error("Failed to start marathon mode. Please try again.");
    } finally {
      setIsMarathonLoading(false);
    }
  };

  const filteredSubjects = subjects.filter(
    (s) =>
      user?.subjects.some((us) => us.id === s.id) &&
      (searchQuery === '' || s.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getSubjectStats = (subjectId: string) => {
    const subjectQuizzes = quizHistory.filter((q) => q.subjectId === subjectId);
    if (subjectQuizzes.length === 0) return null;
    
    const avgScore = Math.round(
      subjectQuizzes.reduce((acc, q) => acc + q.score, 0) / subjectQuizzes.length
    );
    return {
      quizzes: subjectQuizzes.length,
      avgScore,
      lastAttempt: subjectQuizzes[subjectQuizzes.length - 1]?.createdAt,
    };
  };

  return (
    <div className="min-h-screen bg-[#0F0F11] p-4 pb-24">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold mb-1">Practice Questions</h1>
        <p className="text-[#9CA3AF]">Master JAMB past questions</p>
      </motion.header>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-3 mb-6"
      >
        <Card className="bg-[#1A1A1E] border-[#2A2A2E] p-3 text-center">
          <p className="text-2xl font-bold text-[#CCFF00]">{gamification.quizzesCompleted}</p>
          <p className="text-xs text-[#9CA3AF]">Quizzes</p>
        </Card>
        <Card className="bg-[#1A1A1E] border-[#2A2A2E] p-3 text-center">
          <p className="text-2xl font-bold text-[#3B82F6]">{gamification.averageScore}%</p>
          <p className="text-xs text-[#9CA3AF]">Avg Score</p>
        </Card>
        <Card className="bg-[#1A1A1E] border-[#2A2A2E] p-3 text-center">
          <p className="text-2xl font-bold text-[#F59E0B]">{quizHistory.filter((q) => q.score === 100).length}</p>
          <p className="text-xs text-[#9CA3AF]">Perfect</p>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-6"
      >
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={handleStartChallenge}
            className="h-auto py-4 bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] hover:from-[#5B21B6] hover:to-[#7C3AED]"
          >
            <Zap className="w-5 h-5 mr-2" />
            <div className="text-left">
              <p className="font-bold">Quick Challenge</p>
              <p className="text-xs opacity-80">Random questions</p>
            </div>
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              // Find weak areas from quiz history
              const weakTopics = new Map<string, { subjectId: string; topicId: string | null; count: number }>();
              
              quizHistory.forEach((quiz) => {
                quiz.questions.forEach((q, idx) => {
                  // If answer is incorrect
                  if (quiz.answers[idx] !== q.correctAnswer) {
                    const key = `${quiz.subjectId}_${q.topicId || 'general'}`;
                    const existing = weakTopics.get(key);
                    if (existing) {
                      existing.count++;
                    } else {
                      weakTopics.set(key, {
                        subjectId: quiz.subjectId,
                        topicId: q.topicId,
                        count: 1,
                      });
                    }
                  }
                });
              });
              
              // Sort by most mistakes and pick the weakest topic
              const sortedWeakAreas = Array.from(weakTopics.entries())
                .sort((a, b) => b[1].count - a[1].count);
              
              if (sortedWeakAreas.length > 0) {
                const weakestTopic = sortedWeakAreas[0][1];
                toast.info(`Starting weak area practice...`);
                startQuiz(weakestTopic.subjectId, weakestTopic.topicId, 'reinforcement');
              } else {
                // Fallback to most recent subject if no weak areas found
                const recentSubject = quizHistory[quizHistory.length - 1]?.subjectId;
                if (recentSubject) {
                  toast.info(`No weak areas found! Practicing your most recent subject.`);
                  startQuiz(recentSubject, null, 'reinforcement');
                }
              }
            }}
            disabled={quizHistory.length === 0}
            className="h-auto py-4 border-[#2A2A2E] hover:border-[#EF4444] hover:bg-[#EF4444]/10"
          >
            <History className="w-5 h-5 mr-2 text-[#EF4444]" />
            <div className="text-left">
              <p className="font-bold">Weak Areas</p>
              <p className="text-xs opacity-80">Focus on mistakes</p>
            </div>
          </Button>
        </div>
      </motion.div>

      {/* Search and Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-4"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search subjects..."
            className="pl-10 bg-[#1A1A1E] border-[#2A2A2E] text-white"
          />
        </div>
      </motion.div>

      {/* Subject Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-3"
      >
        <h2 className="font-bold text-lg mb-3">Your Subjects</h2>
        
        {filteredSubjects.length === 0 ? (
          <Card className="bg-[#1A1A1E] border-[#2A2A2E] p-8 text-center">
            <BookOpen className="w-12 h-12 text-[#9CA3AF] mx-auto mb-4" />
            <p className="text-[#9CA3AF]">No subjects found</p>
          </Card>
        ) : (
          filteredSubjects.map((subject, index) => {
            const stats = getSubjectStats(subject.id);
            
            return (
              <motion.div
                key={subject.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * index }}
              >
                <Card
                  className="bg-[#1A1A1E] border-[#2A2A2E] p-4 cursor-pointer hover:border-[#6D28D9] transition-colors"
                  onClick={() => handleStartPractice(subject.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl"
                        style={{ backgroundColor: `${subject.color}20` }}
                      >
                        {subject.icon}
                      </div>
                      <div>
                        <h3 className="font-bold">{subject.name}</h3>
                        <p className="text-sm text-[#9CA3AF]">{subject.code}</p>
                        
                        {stats ? (
                          <div className="flex items-center gap-3 mt-2">
                            <Badge variant="outline" className="text-xs">
                              <Target className="w-3 h-3 mr-1" />
                              {stats.quizzes} quizzes
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                stats.avgScore >= 70
                                  ? 'border-[#10B981] text-[#10B981]'
                                  : stats.avgScore >= 50
                                  ? 'border-[#F59E0B] text-[#F59E0B]'
                                  : 'border-[#EF4444] text-[#EF4444]'
                              }`}
                            >
                              <TrendingUp className="w-3 h-3 mr-1" />
                              {stats.avgScore}%
                            </Badge>
                          </div>
                        ) : (
                          <p className="text-xs text-[#9CA3AF] mt-1">No attempts yet</p>
                        )}
                      </div>
                    </div>
                    
                    <Button size="sm" className="bg-[#6D28D9] hover:bg-[#5B21B6]">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Topics Preview */}
                  <div className="mt-3 pt-3 border-t border-[#2A2A2E]">
                    <div className="flex flex-wrap gap-2">
                      {subject.topics.slice(0, 4).map((topic) => (
                        <span
                          key={topic.id}
                          className="text-xs bg-[#0F0F11] px-2 py-1 rounded-full text-[#9CA3AF]"
                        >
                          {topic.name}
                        </span>
                      ))}
                      {subject.topics.length > 4 && (
                        <span className="text-xs bg-[#0F0F11] px-2 py-1 rounded-full text-[#9CA3AF]">
                          +{subject.topics.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })
        )}
      </motion.div>

      {/* Recent Activity */}
      {quizHistory.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6"
        >
          <h2 className="font-bold text-lg mb-3">Recent Activity</h2>
          <div className="space-y-2">
            {quizHistory.slice(-5).reverse().map((quiz) => {
              const subject = subjects.find((s) => s.id === quiz.subjectId);
              return (
                <Card
                  key={quiz.id}
                  className="bg-[#1A1A1E] border-[#2A2A2E] p-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${subject?.color}20` || '#6D28D920' }}
                      >
                        <span className="text-lg">{subject?.icon || '📚'}</span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{subject?.name || 'Unknown'}</p>
                        <p className="text-xs text-[#9CA3AF]">
                          {new Date(quiz.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-bold ${
                          quiz.score >= 70
                            ? 'text-[#10B981]'
                            : quiz.score >= 50
                            ? 'text-[#F59E0B]'
                            : 'text-[#EF4444]'
                        }`}
                      >
                        {quiz.score}%
                      </p>
                      <p className="text-xs text-[#9CA3AF]">
                        {Math.round((quiz.score / 100) * quiz.totalQuestions)}/{quiz.totalQuestions}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Marathon Mode - AI Powered */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-6"
      >
        <Card className="bg-gradient-to-r from-[#CCFF00]/20 to-[#6D28D9]/20 border-[#CCFF00]/50 p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#CCFF00] rounded-full flex items-center justify-center">
              <Award className="w-6 h-6 text-[#0F0F11]" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold">Marathon Mode</h3>
              <p className="text-sm text-[#9CA3AF]">
                50 AI-generated questions • Mixed subjects • Test your endurance
              </p>
            </div>
            <Button 
              onClick={handleStartMarathon}
              disabled={isMarathonLoading}
              className="bg-[#CCFF00] text-[#0F0F11] hover:bg-[#B3E600] disabled:opacity-50"
            >
              {isMarathonLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                "Start"
              )}
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
