/**
 * AI Voice Player Service
 * 
 * Provides text-to-speech functionality for the AI Tutor using Web Speech API.
 * Supports different voices and languages.
 */

export type VoiceGender = "male" | "female";

interface SpeakOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  gender?: VoiceGender;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
}

class AIVoicePlayer {
  private synth: SpeechSynthesis | null = null;
  private isSpeaking = false;
  private voices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      
      // Some browsers load voices asynchronously
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices(): void {
    if (this.synth) {
      this.voices = this.synth.getVoices();
    }
  }

  /**
   * Check if text-to-speech is supported
   */
  isSupported(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  /**
   * Check if currently speaking
   */
  get speaking(): boolean {
    return this.isSpeaking;
  }

  /**
   * Get available voices
   */
  getVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  /**
   * Find a suitable voice based on gender preference
   */
  private findVoice(gender?: VoiceGender): SpeechSynthesisVoice | null {
    if (this.voices.length === 0) {
      this.loadVoices();
    }

    // Try to find English voices first
    const englishVoices = this.voices.filter(v => 
      v.lang.startsWith("en") || v.lang.startsWith("en-")
    );

    const voicesToUse = englishVoices.length > 0 ? englishVoices : this.voices;

    if (gender) {
      // Try to find voice matching gender preference
      // Note: Voice names often contain gender indicators
      const genderPattern = gender === "female" 
        ? /female|woman|girl|samantha|victoria|karen/i
        : /male|man|boy|alex|daniel|fred/i;

      const matchedVoice = voicesToUse.find(v => 
        genderPattern.test(v.name) || genderPattern.test(v.lang)
      );

      if (matchedVoice) return matchedVoice;
    }

    // Return default voice or first available
    return voicesToUse.find(v => v.default) || voicesToUse[0] || null;
  }

  /**
   * Speak the given text
   */
  speak(text: string, options: SpeakOptions = {}): boolean {
    if (!this.synth) {
      console.error("Text-to-speech not supported in this browser");
      options.onError?.(new Error("Text-to-speech not supported"));
      return false;
    }

    // Stop any current speech
    this.stop();

    // Clean up text - remove markdown-style formatting
    const cleanText = this.cleanTextForSpeech(text);

    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Set voice
    const voice = this.findVoice(options.gender);
    if (voice) {
      utterance.voice = voice;
    }

    // Set speech parameters
    utterance.rate = options.rate ?? 1;
    utterance.pitch = options.pitch ?? 1;
    utterance.volume = options.volume ?? 1;

    // Event handlers
    utterance.onstart = () => {
      this.isSpeaking = true;
      options.onStart?.();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      options.onEnd?.();
    };

    utterance.onerror = (event) => {
      this.isSpeaking = false;
      const error = new Error(`Speech synthesis error: ${event.error}`);
      console.error(error);
      options.onError?.(error);
    };

    this.synth.speak(utterance);
    return true;
  }

  /**
   * Clean text for better speech output
   * Removes markdown, emojis, and special characters
   */
  private cleanTextForSpeech(text: string): string {
    return text
      // Remove emoji
      .replace(/[\u{1F600}-\u{1F64F}]/gu, "")
      .replace(/[\u{1F300}-\u{1F5FF}]/gu, "")
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, "")
      .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, "")
      .replace(/[\u{2600}-\u{26FF}]/gu, "")
      .replace(/[\u{2700}-\u{27BF}]/gu, "")
      // Remove markdown formatting
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/__/g, "")
      .replace(/_/g, "")
      .replace(/`{3}[\s\S]*?`{3}/g, " code block ")
      .replace(/`([^`]+)`/g, "$1")
      // Remove URLs
      .replace(/https?:\/\/\S+/g, " link ")
      // Remove extra whitespace
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Stop speaking
   */
  stop(): void {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
    }
  }

  /**
   * Pause speaking
   */
  pause(): void {
    if (this.synth) {
      this.synth.pause();
    }
  }

  /**
   * Resume speaking
   */
  resume(): void {
    if (this.synth) {
      this.synth.resume();
    }
  }

  /**
   * Toggle speaking state
   */
  toggle(text: string, options: SpeakOptions = {}): boolean {
    if (this.isSpeaking) {
      this.stop();
      return false;
    } else {
      return this.speak(text, options);
    }
  }
}

// Export singleton instance
export const aiVoicePlayer = new AIVoicePlayer();

// Hook for React components
export function useAIVoicePlayer() {
  return {
    speak: (text: string, options?: SpeakOptions) => aiVoicePlayer.speak(text, options),
    stop: () => aiVoicePlayer.stop(),
    pause: () => aiVoicePlayer.pause(),
    resume: () => aiVoicePlayer.resume(),
    toggle: (text: string, options?: SpeakOptions) => aiVoicePlayer.toggle(text, options),
    isSupported: () => aiVoicePlayer.isSupported(),
    isSpeaking: () => aiVoicePlayer.speaking,
  };
}

export default aiVoicePlayer;
