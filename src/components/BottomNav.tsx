import { useStore } from '@/store';
import { Home, Map, MessageCircle, CheckSquare, BookOpen, User } from 'lucide-react';
import { motion } from 'framer-motion';

export function BottomNav() {
  const { currentPage, setCurrentPage, assignments, tasks } = useStore();

  const navItems = [
    { id: 'dashboard', icon: Home, label: 'Home' },
    { id: 'roadmap', icon: Map, label: 'Roadmap' },
    { id: 'tutor', icon: MessageCircle, label: 'Tutor' },
    { id: 'tasks', icon: CheckSquare, label: 'Tasks' },
    { id: 'catalog', icon: BookOpen, label: 'Practice' },
    { id: 'profile', icon: User, label: 'Profile' },
  ] as const;

  const pendingCount = assignments.filter((a) => a.status === 'pending').length +
    tasks.filter((t) => t.status === 'pending').length;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#1A1A1E] border-t border-[#2A2A2E] z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id as typeof currentPage)}
              className="relative flex flex-col items-center justify-center w-16 h-full"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-1 w-12 h-1 bg-[#CCFF00] rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              
              <div className={`relative ${isActive ? 'text-[#CCFF00]' : 'text-[#9CA3AF]'}`}>
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                
                {item.id === 'tasks' && pendingCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#EF4444] text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </span>
                )}
              </div>
              
              <span
                className={`text-xs mt-1 ${
                  isActive ? 'text-[#CCFF00] font-medium' : 'text-[#9CA3AF]'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
