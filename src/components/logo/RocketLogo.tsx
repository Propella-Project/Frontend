import { Rocket } from "lucide-react";

interface RocketLogoProps {
  className?: string;
}

export function RocketLogo({ className = "w-12 h-12" }: RocketLogoProps) {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-[#8B5CF6] to-[#A78BFA] rounded-xl opacity-20 blur-lg" />
      <div className="relative w-full h-full bg-gradient-to-br from-[#8B5CF6] to-[#A78BFA] rounded-xl flex items-center justify-center">
        <Rocket className="w-1/2 h-1/2 text-white" />
      </div>
    </div>
  );
}

export default RocketLogo;
