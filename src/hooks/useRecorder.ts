"use client";

import {useState, useRef, useCallback, useEffect} from "react";
import {AUDIO_CONFIG, ERROR_MESSAGES, TIMEOUTS} from "@/utils/constants";

interface UseAudioRecorderReturn {
  isRecording: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  resetAudioBlob: () => void;
  audioBlob: Blob | null;
  error: string | null;
}

export const useAudioRecorder = (): UseAudioRecorderReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setIsRecording(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    setAudioBlob(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio: true});

      // Choose a supported mimeType for MediaRecorder
      let mimeType: string = AUDIO_CONFIG.MIME_TYPE;
      try {
        if (typeof MediaRecorder !== "undefined") {
          const candidates = [
            "audio/webm;codecs=opus",
            "audio/webm",
            "audio/ogg;codecs=opus",
            "audio/wav",
          ];
          const supported = candidates.find((c) => MediaRecorder.isTypeSupported?.(c));
          if (supported) mimeType = supported;
        }
      } catch (e) {
        // fall back to default
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
      });

      streamRef.current = stream;
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mediaRecorder.mimeType || AUDIO_CONFIG.MIME_TYPE,
        });
        // Guard: ensure we have a meaningful audio blob
        if (!blob || blob.size < 500) {
          setError(ERROR_MESSAGES.TRANSCRIPTION_FAILED);
          setAudioBlob(null);
        } else {
          setAudioBlob(blob);
        }

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start();
      setIsRecording(true);

      timeoutRef.current = setTimeout(() => {
        stopRecording();
        setError("Maximum recording time reached.");
      }, TIMEOUTS.RECORDING_MAX_DURATION);
    } catch (err) {
      setError(ERROR_MESSAGES.MICROPHONE_ACCESS);
      console.error("Error accessing microphone:", err);
    }
  }, [stopRecording]);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const resetAudioBlob = useCallback(() => {
    setAudioBlob(null);
  }, []);

  return {
    isRecording,
    startRecording,
    stopRecording,
    resetAudioBlob,
    audioBlob,
    error,
  };
};
