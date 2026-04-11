import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, ChevronRight, Loader2, Play, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface NotePageProps {
  task: any; // Task object with title, topicId, etc.
  noteHtml: string | null;
  isLoading: boolean;
  hasNextTask: boolean;
  dayNumber: number; // Day number for breadcrumb
  taskType?: string; // Task type: study, revision, quiz
  onClose: () => void;
  onNext: () => void;
  onMarkComplete: () => void; // New callback for mark complete
}

export function NotePage({
  task,
  noteHtml,
  isLoading,
  hasNextTask,
  dayNumber,
  taskType = "study",
  onClose,
  onNext,
  onMarkComplete,
}: NotePageProps) {
  const [videoLinks, setVideoLinks] = useState<string[]>([]);

  // Extract video links from note HTML
  useEffect(() => {
    if (noteHtml) {
      const videoRegex =
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/g;
      const links: string[] = [];
      let match;
      while ((match = videoRegex.exec(noteHtml)) !== null) {
        links.push(`https://www.youtube.com/watch?v=${match[1]}`);
      }
      setVideoLinks(links);
    }
  }, [noteHtml]);

  if (!task) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[#0F0F11] z-[100] flex flex-col"
    >
      {/* Header */}
      <motion.header
        initial={{ y: -40 }}
        animate={{ y: 0 }}
        className="sticky top-0 bg-[#1A1A1E] border-b border-[#2A2A2E] px-4 py-4 z-50"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1">
            {/* Breadcrumb: Day X → Task Y (Type) */}
            <p className="text-xs text-[#9CA3AF] flex items-center gap-2 mb-2">
              <span>📌</span>
              <span>
                Day {dayNumber} → {task?.title || "Task"} (
                {taskType === "study" && "Study"}
                {taskType === "revision" && "Revision"}
                {taskType === "quiz" && "Quiz"})
              </span>
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-[#9CA3AF] hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        <h1 className="text-lg font-bold">Study Materials</h1>
      </motion.header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 pb-32">
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[#CCFF00]" />
            </div>
          )}

          {/* Note Content */}
          {!isLoading && noteHtml && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="prose prose-invert max-w-none"
            >
              <div
                className="text-[#E5E7EB] leading-relaxed"
                dangerouslySetInnerHTML={{ __html: noteHtml }}
              />
            </motion.div>
          )}

          {/* Video Links */}
          {!isLoading && videoLinks.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-8"
            >
              <h2 className="text-lg font-bold mb-4">Video Resources</h2>
              <div className="space-y-3">
                {videoLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Card className="bg-[#1A1A1E] border-[#2A2A2E] p-4 hover:border-[#CCFF00]/50 transition-colors cursor-pointer flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#6D28D9] rounded-lg flex items-center justify-center flex-shrink-0">
                        <Play className="w-5 h-5 text-white fill-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          Video Resource {index + 1}
                        </p>
                        <p className="text-xs text-[#9CA3AF]">
                          Watch on YouTube
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-[#9CA3AF] flex-shrink-0" />
                    </Card>
                  </a>
                ))}
              </div>
            </motion.div>
          )}

          {/* Empty State */}
          {!isLoading && !noteHtml && (
            <div className="text-center py-12">
              <p className="text-[#9CA3AF]">
                No notes available for this topic.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer - Action Buttons */}
      <motion.footer
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#0F0F11] via-[#0F0F11] to-transparent px-4 py-4 border-t border-[#2A2A2E]"
      >
        <div className="max-w-4xl mx-auto flex gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="border-[#4B5563] text-[#E5E7EB] hover:bg-[#1A1A1E]"
          >
            Close
          </Button>
          {taskType !== "quiz" && (
            <Button
              onClick={onMarkComplete}
              variant="outline"
              className="border-[#4B5563] text-[#E5E7EB] hover:bg-[#1A1A1E] flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Mark Complete
            </Button>
          )}
          <Button
            onClick={onNext}
            disabled={isLoading}
            className="flex-1 bg-[#CCFF00] text-[#0F0F11] hover:bg-[#B3E600] font-semibold"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading…
              </>
            ) : (
              <>
                Next {hasNextTask ? "Task" : ""}
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </motion.footer>
    </motion.div>
  );
}
