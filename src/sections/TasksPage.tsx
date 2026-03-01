import { useStore } from '@/store';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle,
  AlertCircle,
  RotateCcw,
  FileQuestion,
  BookOpen,
  Zap,
  Target,
  Calendar,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';

export function TasksPage() {
  const {
    assignments,
    tasks,
    roadmap,
    completeAssignment,
    completeTask,
    subjects,
    startQuiz,
  } = useStore();

  const handleCompleteAssignment = (id: string) => {
    completeAssignment(id);
    toast.success('Assignment completed! +50 points');
  };

  const handleCompleteTask = (task: typeof tasks[0]) => {
    if (task.type === 'quiz') {
      startQuiz(task.subjectId, task.topicId, 'daily');
    } else {
      completeTask(task.id);
      toast.success('Task completed! +25 points');
    }
  };

  const getSubjectColor = (subjectId: string) => {
    const subject = subjects.find((s) => s.id === subjectId);
    return subject?.color || '#6D28D9';
  };

  const getSubjectName = (subjectId: string) => {
    const subject = subjects.find((s) => s.id === subjectId);
    return subject?.name || 'Unknown';
  };

  const pendingAssignments = assignments.filter((a) => a.status === 'pending');
  const completedAssignments = assignments.filter((a) => a.status === 'completed');
  const completedTasks = tasks.filter((t) => t.status === 'completed');

  // Get today's tasks from roadmap
  const currentDay = roadmap.find((d) => d.isUnlocked && !d.isCompleted);
  const todayTasks = currentDay?.tasks || [];

  return (
    <div className="min-h-screen bg-[#0F0F11] p-4 pb-24">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold mb-1">Pending Tasks</h1>
        <p className="text-[#9CA3AF]">Your accountability hub</p>
      </motion.header>

      {/* Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-3 mb-6"
      >
        <Card className="bg-[#1A1A1E] border-[#2A2A2E] p-3 text-center">
          <p className="text-2xl font-bold text-[#EF4444]">{pendingAssignments.length}</p>
          <p className="text-xs text-[#9CA3AF]">Assignments</p>
        </Card>
        <Card className="bg-[#1A1A1E] border-[#2A2A2E] p-3 text-center">
          <p className="text-2xl font-bold text-[#F59E0B]">{todayTasks.filter((t) => t.status === 'pending').length}</p>
          <p className="text-xs text-[#9CA3AF]">Today's Tasks</p>
        </Card>
        <Card className="bg-[#1A1A1E] border-[#2A2A2E] p-3 text-center">
          <p className="text-2xl font-bold text-[#10B981]">{completedAssignments.length + completedTasks.length}</p>
          <p className="text-xs text-[#9CA3AF]">Completed</p>
        </Card>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="assignments" className="w-full">
        <TabsList className="w-full bg-[#1A1A1E] border border-[#2A2A2E] mb-4">
          <TabsTrigger value="assignments" className="flex-1 data-[state=active]:bg-[#6D28D9]">
            Assignments
          </TabsTrigger>
          <TabsTrigger value="today" className="flex-1 data-[state=active]:bg-[#6D28D9]">
            Today
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex-1 data-[state=active]:bg-[#6D28D9]">
            History
          </TabsTrigger>
        </TabsList>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="space-y-3">
          {pendingAssignments.length === 0 ? (
            <Card className="bg-[#1A1A1E] border-[#2A2A2E] p-8 text-center">
              <CheckCircle className="w-12 h-12 text-[#10B981] mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-2">All Caught Up!</h3>
              <p className="text-[#9CA3AF]">No pending assignments. Great job!</p>
            </Card>
          ) : (
            pendingAssignments.map((assignment, index) => (
              <motion.div
                key={assignment.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Card className="bg-[#1A1A1E] border-[#2A2A2E] p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{
                          backgroundColor: `${getSubjectColor(assignment.subjectId)}20`,
                        }}
                      >
                        {assignment.type === 'reinforcement' ? (
                          <RotateCcw
                            className="w-5 h-5"
                            style={{ color: getSubjectColor(assignment.subjectId) }}
                          />
                        ) : assignment.type === 'study' ? (
                          <BookOpen
                            className="w-5 h-5"
                            style={{ color: getSubjectColor(assignment.subjectId) }}
                          />
                        ) : (
                          <FileQuestion
                            className="w-5 h-5"
                            style={{ color: getSubjectColor(assignment.subjectId) }}
                          />
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium">{assignment.title}</h3>
                        <p className="text-sm text-[#9CA3AF]">{assignment.description}</p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        assignment.type === 'reinforcement'
                          ? 'border-[#EF4444] text-[#EF4444]'
                          : 'border-[#CCFF00] text-[#CCFF00]'
                      }
                    >
                      {assignment.points} pts
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-[#9CA3AF]">
                      <span className="flex items-center gap-1">
                        <Target size={14} />
                        {getSubjectName(assignment.subjectId)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        Due: {new Date(assignment.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleCompleteAssignment(assignment.id)}
                      className="bg-[#10B981] hover:bg-[#059669]"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Complete
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </TabsContent>

        {/* Today's Tasks Tab */}
        <TabsContent value="today" className="space-y-3">
          {todayTasks.length === 0 ? (
            <Card className="bg-[#1A1A1E] border-[#2A2A2E] p-8 text-center">
              <Zap className="w-12 h-12 text-[#CCFF00] mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-2">No Tasks Today</h3>
              <p className="text-[#9CA3AF]">Check your roadmap to start learning!</p>
            </Card>
          ) : (
            todayTasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Card
                  className={`border p-4 ${
                    task.status === 'completed'
                      ? 'bg-[#10B981]/10 border-[#10B981]/30'
                      : 'bg-[#1A1A1E] border-[#2A2A2E]'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{
                          backgroundColor:
                            task.status === 'completed'
                              ? '#10B981'
                              : `${getSubjectColor(task.subjectId)}20`,
                        }}
                      >
                        {task.type === 'study' && (
                          <BookOpen
                            className="w-5 h-5"
                            style={{
                              color: task.status === 'completed' ? 'white' : getSubjectColor(task.subjectId),
                            }}
                          />
                        )}
                        {task.type === 'quiz' && (
                          <FileQuestion
                            className="w-5 h-5"
                            style={{
                              color: task.status === 'completed' ? 'white' : getSubjectColor(task.subjectId),
                            }}
                          />
                        )}
                        {task.type === 'revision' && (
                          <RotateCcw
                            className="w-5 h-5"
                            style={{
                              color: task.status === 'completed' ? 'white' : getSubjectColor(task.subjectId),
                            }}
                          />
                        )}
                      </div>
                      <div>
                        <h3
                          className={`font-medium ${
                            task.status === 'completed' ? 'line-through opacity-60' : ''
                          }`}
                        >
                          {task.title}
                        </h3>
                        <p className="text-sm text-[#9CA3AF]">{task.description}</p>
                      </div>
                    </div>
                    {task.status === 'completed' && <CheckCircle className="w-6 h-6 text-[#10B981]" />}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-[#9CA3AF]">
                      <span className="flex items-center gap-1">
                        <Target size={14} />
                        {getSubjectName(task.subjectId)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {task.duration} min
                      </span>
                    </div>
                    {task.status !== 'completed' && (
                      <Button
                        size="sm"
                        onClick={() => handleCompleteTask(task)}
                        className="bg-[#6D28D9] hover:bg-[#5B21B6]"
                      >
                        {task.type === 'quiz' ? (
                          <>
                            <FileQuestion className="w-4 h-4 mr-1" />
                            Start Quiz
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Complete
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </TabsContent>

        {/* Completed Tab */}
        <TabsContent value="completed" className="space-y-3">
          {[...completedAssignments, ...completedTasks].length === 0 ? (
            <Card className="bg-[#1A1A1E] border-[#2A2A2E] p-8 text-center">
              <AlertCircle className="w-12 h-12 text-[#9CA3AF] mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-2">No History Yet</h3>
              <p className="text-[#9CA3AF]">Complete tasks to see them here!</p>
            </Card>
          ) : (
            <>
              {completedAssignments.map((assignment, index) => (
                <motion.div
                  key={assignment.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * index }}
                >
                  <Card className="bg-[#1A1A1E]/50 border-[#2A2A2E] p-4 opacity-60">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#10B981]/20 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-[#10B981]" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium line-through">{assignment.title}</h3>
                        <p className="text-sm text-[#9CA3AF]">
                          Completed on {new Date(assignment.completedAt || '').toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className="bg-[#10B981]">+{assignment.points} pts</Badge>
                    </div>
                  </Card>
                </motion.div>
              ))}
              {completedTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * (completedAssignments.length + index) }}
                >
                  <Card className="bg-[#1A1A1E]/50 border-[#2A2A2E] p-4 opacity-60">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#10B981]/20 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-[#10B981]" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium line-through">{task.title}</h3>
                        <p className="text-sm text-[#9CA3AF]">{getSubjectName(task.subjectId)}</p>
                      </div>
                      <Badge className="bg-[#10B981]">+25 pts</Badge>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
