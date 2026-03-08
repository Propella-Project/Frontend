import { useState, useEffect } from "react";
import { 
  hasReferralData, 
  getReferrerDisplayName, 
  clearReferralData 
} from "@/utils/referral";

interface UseReferralReturn {
  wasReferred: boolean;
  referrerName: string | null;
  clearReferral: () => void;
}

/**
 * Hook to check and display referral information
 */
export function useReferral(): UseReferralReturn {
  const [wasReferred, setWasReferred] = useState(false);
  const [referrerName, setReferrerName] = useState<string | null>(null);

  useEffect(() => {
    const referred = hasReferralData();
    setWasReferred(referred);
    
    if (referred) {
      setReferrerName(getReferrerDisplayName());
    }
  }, []);

  const clearReferral = () => {
    clearReferralData();
    setWasReferred(false);
    setReferrerName(null);
  };

  return {
    wasReferred,
    referrerName,
    clearReferral,
  };
}

export default useReferral;
