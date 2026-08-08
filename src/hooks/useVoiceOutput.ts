"use client";

import {useState, useCallback} from "react";
import {ERROR_MESSAGES} from "@/utils/constants";
import {apiClient} from "@/utils/apiClient";

interface UseVoiceOutputReturn {
  generateVoice: (text: string) => Promise<string>;
  isGenerating: boolean;
  error: string | null;
}

export const useVoiceOutput = (): UseVoiceOutputReturn => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateVoice = useCallback(async (text: string): Promise<string> => {
    setIsGenerating(true);
    setError(null);

    try {
      // Use centralized api client which handles retries/timeouts
      const blob = await apiClient.generateVoice(text);
      if (!blob || blob.size === 0) {
        throw new Error(ERROR_MESSAGES.VOICE_GENERATION_FAILED);
      }
      return URL.createObjectURL(blob);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : ERROR_MESSAGES.NETWORK_ERROR;
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return {
    generateVoice,
    isGenerating,
    error,
  };
};
