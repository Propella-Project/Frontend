import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store';
import { useUserStore } from '@/state/user.store';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Send,
  Sparkles,
  Music,
  Image,
  BookOpen,
  Volume2,
  VolumeX,
  Zap,
  Lightbulb,
  MoreHorizontal,
  Play,
  Square,
} from 'lucide-react';
import { PERSONALITIES } from '@/types';
import type { ChatMessage, PersonalityType } from '@/types';
import { toast } from 'sonner';
import { useAIVoicePlayer } from '@/services/aiVoicePlayer';
import { tutorApi } from '@/api/tutor.api';
import { usePaymentStatus } from '@/hooks/usePayment';
import { Lock, Crown } from 'lucide-react';

export function TutorPage() {
  const navigate = useNavigate();
  const { user, chatMessages, addMessage, subjects, addAssignment } = useStore();
  const { ai_voice_enabled } = useUserStore();
  const { isPaid, isLoading: isCheckingPayment } = usePaymentStatus();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(ai_voice_enabled);
  const [showOptions, setShowOptions] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const voicePlayer = useAIVoicePlayer();
  const hasAddedGreeting = useRef(false);

  // All hooks must run before any conditional return (React rules of hooks / error #310)
  useEffect(() => {
    return () => {
      voicePlayer?.stop?.();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Initial greeting once when paid, user exists, no messages yet
  const personalityForGreeting =
    user &&
    ((user.personality && PERSONALITIES[user.personality as PersonalityType]) || PERSONALITIES.mentor);
  useEffect(() => {
    if (!user || !isPaid || !personalityForGreeting || hasAddedGreeting.current || chatMessages.length > 0) return;
    hasAddedGreeting.current = true;
    const greeting: ChatMessage = {
      id: `msg_${Date.now()}`,
      userId: user.id || 'user_1',
      role: 'ai',
      content: `${personalityForGreeting.greeting}\n\nI'm here to help you master your JAMB subjects. What would you like to learn about today?`,
      timestamp: new Date(),
      type: 'text',
    };
    addMessage(greeting);
  }, [user, isPaid, personalityForGreeting, chatMessages.length, addMessage]);

  if (!user) return null;

  const personality =
    (user.personality && PERSONALITIES[user.personality as PersonalityType]) || PERSONALITIES.mentor;

  if (!isPaid && !isCheckingPayment) {
    return (
      <div className="min-h-screen bg-[#0F0F11] p-4 pb-24 flex flex-col items-center justify-center">
        <Card className="bg-[#1A1A1E] border-[#2A2A2E] p-8 max-w-md text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#6D28D9]/20 border border-[#6D28D9]/40 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-[#CCFF00]" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Tutor Locked</h2>
          <p className="text-[#9CA3AF] text-sm mb-6">
            Complete payment to unlock the AI tutor and start learning.
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

  // Handle text-to-speech for a message
  const handleSpeak = (message: ChatMessage) => {
    if (!voicePlayer.isSupported()) {
      toast.error("Text-to-speech is not supported in your browser");
      return;
    }

    if (speakingMessageId === message.id) {
      // Stop speaking
      voicePlayer.stop();
      setSpeakingMessageId(null);
    } else {
      // Start speaking
      voicePlayer.stop();
      setSpeakingMessageId(message.id);
      
      voicePlayer.speak(message.content, {
        gender: user.voicePreference === 'male' ? 'male' : 'female',
        rate: 0.9,
        pitch: 1,
        onEnd: () => setSpeakingMessageId(null),
        onError: (error) => {
          console.error('Speech error:', error);
          setSpeakingMessageId(null);
          toast.error("Failed to play audio");
        },
      });
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      userId: user.id || 'user_1',
      role: 'user',
      content: input,
      timestamp: new Date(),
      type: 'text',
    };

    addMessage(userMessage);
    setInput('');
    setIsTyping(true);

    try {
      // Call AI Engine for real response
      const aiResponse = await tutorApi.sendMessage({
        message: input,
      });

      const content =
        (aiResponse?.response && String(aiResponse.response).trim()) ||
        "I couldn't generate a response right now. Please try again.";

      const aiMessage: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        userId: user.id || 'user_1',
        role: 'ai',
        content,
        timestamp: new Date(),
        type: 'text',
      };
      addMessage(aiMessage);
      
      // Auto-play if voice mode is enabled
      if (isVoiceMode && voicePlayer.isSupported()) {
        setSpeakingMessageId(aiMessage.id);
        voicePlayer.speak(aiMessage.content, {
          gender: user.voicePreference === 'male' ? 'male' : 'female',
          rate: 0.9,
          pitch: 1,
          onEnd: () => setSpeakingMessageId(null),
          onError: () => setSpeakingMessageId(null),
        });
      }
    } catch (error) {
      console.error("[Tutor] AI request failed:", error);
      toast.error("AI service temporarily unavailable. Please try again.");
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSpecialAction = (action: 'animate' | 'song' | 'flashcard' | 'diagram') => {
    setShowOptions(false);
    
    let response = '';
    let type: ChatMessage['type'] = 'text';

    switch (action) {
      case 'animate':
        response = `🎬 **Animated Explanation Coming Up!**\n\nImagine this concept as a movie:\n\n*Scene 1: The Setup*\nWe start with the basics, laying the foundation like building blocks.\n\n*Scene 2: The Action*\nNow we see the concept in motion, interacting with real-world scenarios.\n\n*Scene 3: The Climax*\nEverything comes together in a beautiful "aha!" moment.\n\nWould you like me to create a specific animation for a particular topic?`;
        type = 'explanation';
        toast.success('Animation mode activated!');
        break;

      case 'song':
        response = `🎵 **Study Song Mode Activated!** 🎵\n\n${personality.type === 'rapper' ? '🎤 Yo, listen up, here\'s the story...' : '🎶 Let me sing you a melody of knowledge...'}\n\n*(To the tune of a popular song)*\n\n🎵 "Knowledge is power, learning is fun,\nStudy every day until the work is done!\nJAMB is coming, but don't you fear,\nPROPELLA's got your back, the path is clear!" 🎵\n\nWant me to create a custom song for a specific topic?`;
        type = 'song';
        toast.success('Song mode activated!');
        break;

      case 'flashcard':
        response = `🃏 **Flashcard Generator Ready!**\n\nI'll create flashcards for quick revision. Here are some sample cards:\n\n**Front:** What is photosynthesis?\n**Back:** The process by which plants convert light energy into chemical energy.\n\n**Front:** State Newton's First Law\n**Back:** An object remains at rest or in uniform motion unless acted upon by an external force.\n\nWhich topic would you like flashcards for?`;
        type = 'flashcard';
        toast.success('Flashcards ready!');
        break;

      case 'diagram':
        response = `📊 **Diagram Mode Activated!**\n\nI'll create visual diagrams to help you understand complex concepts.\n\nImagine a flowchart showing:\n┌─────────────┐\n│   Input     │\n└──────┬──────┘\n       │\n       ▼\n┌─────────────┐\n│  Process    │\n└──────┬──────┘\n       │\n       ▼\n┌─────────────┐\n│   Output    │\n└─────────────┘\n\nWhat concept would you like me to diagram?`;
        type = 'diagram';
        toast.success('Diagram mode activated!');
        break;
    }

    const aiMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      userId: user.id || 'user_1',
      role: 'ai',
      content: response,
      timestamp: new Date(),
      type,
    };

    setIsTyping(true);
    setTimeout(() => {
      addMessage(aiMessage);
      setIsTyping(false);
    }, 800);
  };

  const handleAssignWork = () => {
    const userSubjects = Array.isArray(user.subjects) ? user.subjects : [];
    const subjectsList = subjects.filter((s) => userSubjects.some((us) => us.id === s.id));
    if (subjectsList.length === 0) {
      toast.error("No subjects selected. Complete onboarding or add subjects in Profile.");
      return;
    }
    const randomSubject = subjectsList[Math.floor(Math.random() * subjectsList.length)];
    const topics = randomSubject?.topics ?? [];
    const randomTopic = topics.length > 0 ? topics[Math.floor(Math.random() * topics.length)] : null;

    if (randomSubject && randomTopic) {
      addAssignment({
        id: `assignment_${Date.now()}`,
        userId: user.id || 'user_1',
        title: `Review: ${randomTopic.name}`,
        description: `Complete a focused study session on ${randomTopic.name} in ${randomSubject.name}.`,
        subjectId: randomSubject.id,
        topicId: randomTopic.id,
        type: 'study',
        assignedBy: 'ai',
        assignedAt: new Date(),
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        completedAt: null,
        status: 'pending',
        points: 50,
      });

      toast.success('Assignment created!', {
        description: `Review ${randomTopic.name} by tomorrow.`,
      });
    } else {
      toast.error("No topics available for assignments. Add subjects in Profile.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F11] flex flex-col">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between p-4 border-b border-[#2A2A2E] bg-[#0F0F11] sticky top-0 z-10"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-[#6D28D9] to-[#8B5CF6] rounded-full flex items-center justify-center text-2xl relative">
            {personality.avatar}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#10B981] rounded-full border-2 border-[#0F0F11]" />
          </div>
          <div>
            <h1 className="font-bold">{personality.name}</h1>
            <p className="text-xs text-[#9CA3AF]">Your AI Tutor</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setIsVoiceMode(!isVoiceMode);
              if (isVoiceMode) {
                voicePlayer.stop();
                setSpeakingMessageId(null);
              }
              toast.info(isVoiceMode ? 'Voice mode disabled' : 'Voice mode enabled');
            }}
            className={isVoiceMode ? 'text-[#CCFF00]' : ''}
            title={isVoiceMode ? 'Voice mode on' : 'Voice mode off'}
          >
            {isVoiceMode ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </Button>
          <Button variant="ghost" size="icon" onClick={handleAssignWork}>
            <Sparkles size={20} className="text-[#CCFF00]" />
          </Button>
        </div>
      </motion.header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatMessages.map((message, index) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] ${
                message.role === 'user'
                  ? 'bg-[#6D28D9] text-white'
                  : 'bg-[#1A1A1E] border border-[#2A2A2E]'
              } rounded-2xl px-4 py-3`}
            >
              {message.role === 'ai' && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{personality.avatar}</span>
                  <span className="text-xs font-medium text-[#9CA3AF]">{personality.name}</span>
                  {message.type === 'song' && <Music size={14} className="text-[#CCFF00]" />}
                  {message.type === 'flashcard' && <BookOpen size={14} className="text-[#3B82F6]" />}
                  {message.type === 'diagram' && <Image size={14} className="text-[#10B981]" />}
                  
                  {/* Text-to-Speech Button for AI Messages */}
                  {voicePlayer.isSupported() && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-6 w-6 ml-2 ${
                        speakingMessageId === message.id 
                          ? 'text-[#CCFF00] animate-pulse' 
                          : 'text-[#9CA3AF] hover:text-white'
                      }`}
                      onClick={() => handleSpeak(message)}
                      title={speakingMessageId === message.id ? 'Stop audio' : 'Play audio'}
                    >
                      {speakingMessageId === message.id ? (
                        <Square size={12} className="fill-current" />
                      ) : (
                        <Play size={12} className="fill-current" />
                      )}
                    </Button>
                  )}
                </div>
              )}
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {message.content}
              </div>
              <div className="text-right mt-1">
                <span className="text-xs opacity-50">
                  {message.timestamp
                    ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : ''}
                </span>
              </div>
            </div>
          </motion.div>
        ))}

        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-[#1A1A1E] border border-[#2A2A2E] rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{personality.avatar}</span>
                <div className="flex gap-1">
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                    className="w-2 h-2 bg-[#CCFF00] rounded-full"
                  />
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 0.5, delay: 0.1 }}
                    className="w-2 h-2 bg-[#CCFF00] rounded-full"
                  />
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 0.5, delay: 0.2 }}
                    className="w-2 h-2 bg-[#CCFF00] rounded-full"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Special Actions */}
      <AnimatePresence>
        {showOptions && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="px-4 pb-2"
          >
            <Card className="bg-[#1A1A1E] border-[#2A2A2E] p-3">
              <div className="flex gap-2 overflow-x-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSpecialAction('animate')}
                  className="flex items-center gap-2 border-[#6D28D9] text-[#CCFF00] whitespace-nowrap"
                >
                  <Zap size={16} />
                  Animate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSpecialAction('song')}
                  className="flex items-center gap-2 border-[#6D28D9] text-[#CCFF00] whitespace-nowrap"
                >
                  <Music size={16} />
                  Sing It
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSpecialAction('flashcard')}
                  className="flex items-center gap-2 border-[#6D28D9] text-[#CCFF00] whitespace-nowrap"
                >
                  <BookOpen size={16} />
                  Flashcards
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSpecialAction('diagram')}
                  className="flex items-center gap-2 border-[#6D28D9] text-[#CCFF00] whitespace-nowrap"
                >
                  <Image size={16} />
                  Diagram
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="p-4 border-t border-[#2A2A2E] bg-[#0F0F11]">
        <div className="flex items-center gap-2 mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowOptions(!showOptions)}
            className="text-[#9CA3AF] hover:text-[#CCFF00]"
          >
            <MoreHorizontal size={18} className="mr-1" />
            Options
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAssignWork}
            className="text-[#9CA3AF] hover:text-[#CCFF00]"
          >
            <Lightbulb size={18} className="mr-1" />
            Assign Work
          </Button>
        </div>

        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Ask ${personality.name} anything...`}
            className="flex-1 bg-[#1A1A1E] border-[#2A2A2E] text-white placeholder:text-[#6B7280]"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="bg-[#6D28D9] hover:bg-[#5B21B6]"
          >
            <Send size={20} />
          </Button>
        </div>
        </div>
    </div>
  );
}
