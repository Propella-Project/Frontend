/**
 * Loading Screen
 * 
 * Full-screen loading indicator with optional message.
 */

import { Loader2 } from "lucide-react";

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = "Loading..." }: LoadingScreenProps) {
  return (
    <div className="min-h-screen bg-[#0F0F11] flex flex-col items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-[#18A0FB]" />
      <p className="mt-4 text-gray-400 text-sm">{message}</p>
    </div>
  );
}

export default LoadingScreen;
