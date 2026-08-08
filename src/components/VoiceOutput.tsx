"use client";

import {FC, useEffect, useRef, useState} from "react";
import {FaPause, FaPlay} from "react-icons/fa6";

interface VoiceOutputProps {
  audioUrl: string;
  textToSpeak?: string;
}

const VoiceOutput: FC<VoiceOutputProps> = ({audioUrl, textToSpeak}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      setIsLoading(true);
      setError(null);

      const speakWithBrowserTTS = (text: string) => {
        if (typeof window === "undefined" || !window.speechSynthesis) {
          return;
        }

        try {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = "en-US";
          utterance.rate = 1;
          utterance.pitch = 1;
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(utterance);
        } catch (ttsError) {
          console.error("Browser TTS fallback failed:", ttsError);
        }
      };

      const handleCanPlay = () => {
        setIsLoading(false);
        if (typeof window !== "undefined" && window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
        audio.play().catch((playError) => {
          console.error("Error playing audio:", playError);
          if (textToSpeak) {
            speakWithBrowserTTS(textToSpeak);
            setError(null);
          } else {
            setError("Could not play the audio response.");
          }
        });
      };

      const handleError = () => {
        const audioError = audio?.error;
        const message = audioError
          ? `Could not load audio: ${audioError.message || audioError.code}`
          : "Could not load the audio response.";
        console.error(message, audioError);
        if (textToSpeak) {
          speakWithBrowserTTS(textToSpeak);
          setError(null);
        } else {
          setError(message);
        }
        setIsLoading(false);
      };

      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);
      const handleEnded = () => setIsPlaying(false);

      audio.addEventListener("canplay", handleCanPlay);
      audio.addEventListener("error", handleError);
      audio.addEventListener("play", handlePlay);
      audio.addEventListener("pause", handlePause);
      audio.addEventListener("ended", handleEnded);

      audio.load();

      return () => {
        audio.pause();
        audio.currentTime = 0;
        audio.removeEventListener("canplay", handleCanPlay);
        audio.removeEventListener("error", handleError);
        audio.removeEventListener("play", handlePlay);
        audio.removeEventListener("pause", handlePause);
        audio.removeEventListener("ended", handleEnded);
      };
    }
  }, [audioUrl, textToSpeak]);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
  };

  return (
    <div className="flex w-full items-center justify-center" role="region" aria-label="AI Voice Response">
      <div className="flex flex-col items-center gap-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-4 py-2 text-xs font-semibold text-primary">
          <span className="h-2 w-2 rounded-full bg-success shadow-[0_0_0_4px_rgba(52,199,89,0.2)]" />
          Coach voice
        </div>

        <div className="relative mb-10 flex items-center justify-center">
          <button
            className={`group relative flex h-48 w-48 items-center justify-center overflow-hidden rounded-[2rem] border border-white/50 gradient-brand shadow-cute-lg transition-all duration-300 hover:scale-[1.03] focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 ${
              isPlaying ? "animate-pulse" : ""
            }`}
            onClick={togglePlayPause}
            aria-label={isPlaying ? "Pause coach voice" : "Play coach voice"}
            aria-pressed={isPlaying}
          >
            <div className="absolute inset-3 rounded-[1.5rem] border border-white/35 bg-white/15 shadow-inner" />

            {isPlaying && (
              <>
                <div className="absolute inset-0 rounded-[2rem] bg-white/20" aria-hidden="true">
                  <div className="h-full w-full animate-ping" />
                </div>
                <div className="absolute inset-0 rounded-[2rem] bg-white/10" aria-hidden="true">
                  <div className="h-full w-full animate-pulse" />
                </div>
              </>
            )}

            <div className="absolute inset-x-10 bottom-8 flex items-end justify-center gap-1.5" aria-hidden="true">
              {[0, 1, 2, 3].map((bar) => (
                <span
                  key={bar}
                  className={`w-2 rounded-full bg-white/90 transition-all duration-300 ${
                    isPlaying ? "opacity-100" : "opacity-55"
                  }`}
                  style={{
                    height: isPlaying ? `${18 + bar * 7}px` : `${10 + bar * 2}px`,
                    animationName: isPlaying ? "bounce" : undefined,
                    animationDuration: `${0.7 + bar * 0.08}s`,
                    animationTimingFunction: "ease-in-out",
                    animationIterationCount: isPlaying ? "infinite" : "1",
                    animationDelay: `${bar * 0.08}s`,
                  }}
                />
              ))}
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center gap-2 text-white" aria-hidden="true">
              <div className="flex h-16 w-16 items-center justify-center rounded-[1.25rem] border border-white/35 bg-white/20 shadow-cute-sm">
                <span className="text-2xl">🎙️</span>
              </div>
              {isPlaying ? <FaPause className="h-10 w-10" /> : <FaPlay className="ml-1 h-10 w-10" />}
            </div>
          </button>

          {isPlaying && (
            <div
              className="absolute bottom-0 flex h-6 -translate-x-1/2 transform justify-center gap-1.5"
              aria-hidden="true"
            >
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 rounded-full bg-primary/70"
                  style={{
                    animationName: "bounce",
                    animationDuration: `${0.5 + (i % 3) * 0.15}s`,
                    animationTimingFunction: "ease",
                    animationIterationCount: "infinite",
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="text-center" role="status" aria-live="polite">
          {isLoading && (
            <div className="animate-pulse text-sm font-medium text-primary">
              Getting the coach ready…
            </div>
          )}
          {error && (
            <div
              className="rounded-cute border border-danger/20 bg-danger-soft px-4 py-2 text-sm text-foreground"
              role="alert"
            >
              {error}
            </div>
          )}
        </div>

        <audio ref={audioRef} src={audioUrl} className="hidden" preload="auto" aria-hidden="true" />
      </div>
    </div>
  );
};

export default VoiceOutput;
