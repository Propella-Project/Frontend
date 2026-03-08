/**
 * AI Tutor Page
 * 
 * Chat interface for the AI tutor feature.
 */

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Bot, Send, User, Sparkles, Trash2, Loader2 } from "lucide-react";
import { DashboardLayout } from "../components/DashboardLayout";
import { tutorApi } from "@/api/tutor.api";
interface ChatMessage {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date | string;
}
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function AiTutorPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch chat history (not implemented yet)
  useEffect(() => {
    // TODO: Implement chat history fetching when backend supports it
    setHistoryLoading(false);
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Send message
  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: `temp_${Date.now()}`,
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await tutorApi.sendMessage({ message: input });
      
      // Replace temp message and add AI response
      const aiMessage: ChatMessage = {
        id: `msg_${Date.now()}_ai`,
        role: "assistant",
        content: response.response,
        timestamp: new Date(),
      };
      
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== userMessage.id);
        return [...filtered, 
          { ...userMessage, id: `msg_${Date.now()}_user` },
          aiMessage
        ];
      });
    } catch (error) {
      console.error("[Tutor] Failed to send message:", error);
      toast.error("Failed to get response. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Clear chat history
  const clearHistory = async () => {
    try {
      // TODO: Implement clear history on backend when supported
      setMessages([]);
      toast.success("Chat history cleared");
    } catch (error) {
      console.error("[Tutor] Failed to clear history:", error);
      toast.error("Failed to clear history");
    }
  };

  // Handle enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Format timestamp
  const formatTime = (timestamp: Date | string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <DashboardLayout title="AI Tutor">
      <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)]">
        <Card className="h-full bg-[#1A1A1D] border-white/10 flex flex-col">
          {/* Header */}
          <CardHeader className="border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#18A0FB] to-[#0B54A0] flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white">AI Tutor</CardTitle>
                  <p className="text-sm text-gray-400">
                    Ask me anything about your studies
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={clearHistory}
                disabled={messages.length === 0}
                className="border-white/10 hover:bg-white/5"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </CardHeader>

          {/* Chat Messages */}
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full" ref={scrollRef}>
              <div className="p-4 space-y-4">
                {historyLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin text-[#18A0FB]" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-[#18A0FB]/10 mb-4">
                      <Sparkles className="h-8 w-8 text-[#18A0FB]" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">
                      Start a conversation
                    </h3>
                    <p className="text-gray-400 max-w-sm mx-auto">
                      Ask me anything about JAMB subjects, topics you&apos;re struggling with,
                      or request practice questions.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-2 justify-center">
                      {[
                        "Explain photosynthesis",
                        "Help with algebra",
                        "JAMB past questions",
                        "Study tips",
                      ].map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => {
                            setInput(suggestion);
                          }}
                          className="px-3 py-1.5 text-sm bg-[#0F0F11] border border-white/10 rounded-lg text-gray-300 hover:bg-white/5 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <motion.div
                      key={message.id || index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "flex gap-3",
                        message.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      {message.role === "assistant" && (
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#18A0FB] to-[#0B54A0] flex items-center justify-center flex-shrink-0">
                          <Bot className="h-4 w-4 text-white" />
                        </div>
                      )}
                      
                      <div
                        className={cn(
                          "max-w-[80%] rounded-lg px-4 py-2",
                          message.role === "user"
                            ? "bg-[#18A0FB] text-white"
                            : "bg-[#0F0F11] border border-white/10 text-gray-200"
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <span className="text-xs opacity-50 mt-1 block">
                          {formatTime(message.timestamp)}
                        </span>
                      </div>

                      {message.role === "user" && (
                        <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                          <User className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </motion.div>
                  ))
                )}
                
                {loading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-3 justify-start"
                  >
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#18A0FB] to-[#0B54A0] flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div className="bg-[#0F0F11] border border-white/10 rounded-lg px-4 py-2">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </ScrollArea>
          </CardContent>

          {/* Input Area */}
          <div className="p-4 border-t border-white/10">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about your studies..."
                disabled={loading}
                className="flex-1 bg-[#0F0F11] border-white/10 text-white placeholder:text-gray-500"
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="bg-[#18A0FB] hover:bg-[#0B54A0]"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default AiTutorPage;
