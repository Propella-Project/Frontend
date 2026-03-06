import { motion } from "framer-motion";
import { Coins, Sparkles, TrendingUp, Users } from "lucide-react";

export function ReferralAnimation() {
  return (
    <div className="relative w-full h-48 flex items-center justify-center overflow-hidden">
      {/* Background glow effect */}
      <motion.div
        className="absolute w-64 h-64 bg-[#6D28D9] rounded-full blur-[100px] opacity-30"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Central celebration icon */}
      <motion.div
        className="relative z-10"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 20,
          delay: 0.2,
        }}
      >
        <motion.div
          className="w-20 h-20 bg-gradient-to-br from-[#CCFF00] to-[#6D28D9] rounded-2xl flex items-center justify-center shadow-lg shadow-[#6D28D9]/50"
          animate={{
            y: [0, -10, 0],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Coins className="w-10 h-10 text-[#0F0F11]" />
        </motion.div>
      </motion.div>

      {/* Orbiting elements */}
      <motion.div
        className="absolute"
        animate={{ rotate: 360 }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <motion.div
          className="absolute -top-12 -left-12 w-10 h-10 bg-[#1A1A1E] border border-[#2A2A2E] rounded-full flex items-center justify-center"
          style={{ transform: "translate(-40px, -40px)" }}
        >
          <Users className="w-5 h-5 text-[#CCFF00]" />
        </motion.div>
      </motion.div>

      <motion.div
        className="absolute"
        animate={{ rotate: -360 }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <motion.div
          className="absolute -bottom-12 -right-12 w-10 h-10 bg-[#1A1A1E] border border-[#2A2A2E] rounded-full flex items-center justify-center"
          style={{ transform: "translate(40px, 40px)" }}
        >
          <TrendingUp className="w-5 h-5 text-[#10B981]" />
        </motion.div>
      </motion.div>

      {/* Floating sparkles */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          initial={{
            x: Math.random() * 200 - 100,
            y: Math.random() * 100 - 50,
            opacity: 0,
          }}
          animate={{
            y: [null, -30, -60],
            opacity: [0, 1, 0],
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: i * 0.5,
            ease: "easeOut",
          }}
        >
          <Sparkles className="w-4 h-4 text-[#CCFF00]" />
        </motion.div>
      ))}

      {/* Text label */}
      <motion.div
        className="absolute bottom-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <p className="text-sm text-[#9CA3AF] text-center">
          Earn <span className="text-[#CCFF00] font-bold">₦10</span> per referral!
        </p>
      </motion.div>
    </div>
  );
}
