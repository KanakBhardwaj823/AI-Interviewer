"use client";

import {useState, useEffect, useRef, useCallback} from "react";
import {useInterview} from "@/context/InterviewContext";
import {useInterviewFlow} from "@/hooks/useInterviewFlow";
import {useVoiceOutput} from "@/hooks/useVoiceOutput";
import {useAudioRecorder} from "@/hooks/useRecorder";
import VoiceOutput from "@/components/VoiceOutput";
import QuestionDisplay from "@/components/QuestionDisplay";
import {ErrorHandler} from "@/components/ErrorHandler";
import InterviewControls from "@/components/InterviewControls";
import {INTERVIEW_ROLES} from "@/utils/constants";

export default function InterviewPage() {
  const {
    currentQuestion,
    isStarted,
    isPaused,
    startInterview,
    pauseInterview,
    resumeInterview,
    endInterview,
    questionCount,
    isCompleted,
    setAudioUrl,
    audioUrl,
  } = useInterview();

  const [selectedPageRole, setSelectedPageRole] = useState(
    (): (typeof INTERVIEW_ROLES)[number] | null => INTERVIEW_ROLES[0]
  );

  useEffect(() => {
    const search = typeof window !== "undefined" ? window.location.search : "";
    const roleId = new URLSearchParams(search).get("role");
    const matchedRole = INTERVIEW_ROLES.find((role) => role.id === roleId) ?? null;
    setSelectedPageRole(matchedRole);
  }, []);

  const {handleStopAnswer, isProcessing, error, report, conversationHistory} = useInterviewFlow();
  const {generateVoice, isGenerating} = useVoiceOutput();
  const {
    isRecording,
    startRecording,
    stopRecording,
    audioBlob,
    error: recorderError,
    resetAudioBlob,
  } = useAudioRecorder();
  const [notification, setNotification] = useState<string | null>(null);
  const [geminiAvailable, setGeminiAvailable] = useState<boolean | null>(null);
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const voiceRequestIdRef = useRef(0);
  const totalQuestions = 7;

  const showNotification = useCallback((message: string) => {
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    setNotification(message);
    notificationTimeoutRef.current = setTimeout(() => {
      setNotification(null);
      notificationTimeoutRef.current = null;
    }, 5000);
  }, []);

  const speakViaWebSpeech = useCallback(
    (text: string) => {
      try {
        if (typeof window === "undefined" || !window.speechSynthesis) {
          throw new Error("Web Speech API not supported");
        }
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = "en-US";
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utter);
        showNotification("The coach is speaking with browser voice.");
      } catch (err) {
        console.error("Browser TTS failed:", err);
        showNotification("Voice unavailable. Please read the question on screen.");
      }
    },
    [showNotification]
  );

  useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (error) {
      showNotification(error);
    }
  }, [error, showNotification]);

  useEffect(() => {
    if (recorderError) {
      showNotification(recorderError);
    }
  }, [recorderError, showNotification]);

  useEffect(() => {
    if (!isStarted) {
      return;
    }

    const currentRequestId = ++voiceRequestIdRef.current;
    const cancelSpeech = () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };

    if (geminiAvailable === false) {
      setAudioUrl(null);
      cancelSpeech();
      speakViaWebSpeech(currentQuestion);
      return;
    }

    setAudioUrl(null);
    cancelSpeech();
    showNotification("Preparing the coach's voice…");

    generateVoice(currentQuestion)
      .then((url) => {
        if (voiceRequestIdRef.current !== currentRequestId) {
          URL.revokeObjectURL(url);
          return;
        }
        setAudioUrl(url);
        showNotification("The coach is speaking now.");
      })
      .catch((voiceError) => {
        if (voiceRequestIdRef.current !== currentRequestId) return;
        console.error("Initial voice generation failed:", voiceError);
        setAudioUrl(null);
        speakViaWebSpeech(currentQuestion);
      });

    return () => {
      cancelSpeech();
      voiceRequestIdRef.current += 1;
    };
  }, [isStarted, generateVoice, currentQuestion, geminiAvailable, setAudioUrl, showNotification, speakViaWebSpeech]);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch("/api/health");
        if (!res.ok) {
          setGeminiAvailable(false);
          return;
        }
        const json = await res.json();
        const ok = json?.gemini?.ok === true;
        if (!cancelled) setGeminiAvailable(Boolean(ok));
        if (!ok) {
          showNotification("LLM unavailable — using browser voice instead.");
        }
      } catch (err) {
        if (!cancelled) setGeminiAvailable(false);
      }
    };
    check();
    return () => {
      cancelled = true;
    };
  }, [showNotification]);

  useEffect(() => {
    if (audioBlob && !isPaused) {
      showNotification("Processing your answer…");
      handleStopAnswer(audioBlob).catch((err) => {
        console.error("Error processing answer:", err);
      });
      resetAudioBlob();
    }
  }, [audioBlob, handleStopAnswer, isPaused, resetAudioBlob, showNotification]);

  const handleRecordingToggle = () => {
    if (isRecording) {
      stopRecording();
      showNotification("Recording stopped.");
    } else {
      startRecording();
      showNotification("Recording started — take your time.");
    }
  };

  const handleStartInterview = async () => {
    if (!selectedPageRole) {
      showNotification("No role selected. Head back home and pick one first.");
      return;
    }
    await startInterview(selectedPageRole.id);
    showNotification(`Session started for ${selectedPageRole.label}.`);
  };

  const handlePauseInterview = () => {
    pauseInterview();
    showNotification("Interview paused.");
  };

  const handleResumeInterview = () => {
    resumeInterview();
    showNotification("Interview resumed.");
  };

  const handleEndInterview = () => {
    endInterview();
    showNotification("Interview ended.");
  };

  return (
    <div className="px-4 py-8 pb-12 sm:px-6 lg:px-8">
      <ErrorHandler message={notification} type="info" />
      <div className="card-cute mx-auto max-w-6xl p-6 sm:p-8 lg:p-10">
        <div className="mb-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="mb-4 rounded-cute-lg border border-[var(--border)] bg-surface-soft/80 p-5">
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-primary-soft px-2 py-0.5 text-xs font-bold text-primary">
                  {selectedPageRole?.badge ?? "—"}
                </span>
                <span className="label-soft">Selected role</span>
              </div>
              <p className="mt-3 text-lg font-semibold text-foreground">
                {selectedPageRole?.label ?? "General interview"}
              </p>
              <p className="mt-1 text-sm leading-6 text-muted">
                {selectedPageRole?.description ??
                  "Answer questions across core interview topics."}
              </p>
            </div>
            {isStarted ? (
              <QuestionDisplay question={currentQuestion} />
            ) : (
              <div className="rounded-cute-lg border border-[var(--border)] bg-surface p-6">
                <p className="text-lg font-semibold text-foreground">
                  Ready when you are.
                </p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Start the session and the coach will guide you through a friendly, voice-first conversation.
                </p>
              </div>
            )}
            {isGenerating && (
              <div
                className="mt-4 rounded-cute border border-[var(--border)] bg-surface-soft px-4 py-3"
                role="status"
                aria-live="polite"
              >
                <div className="flex items-center gap-3">
                  <div className="space-y-1.5">
                    <div className="h-2.5 w-28 animate-pulse rounded-full bg-primary/25" />
                    <div className="h-2.5 w-40 animate-pulse rounded-full bg-primary/15" />
                  </div>
                  <span className="text-sm font-medium text-primary">Preparing response…</span>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center justify-center">
            {audioUrl ? (
              <VoiceOutput audioUrl={audioUrl} textToSpeak={currentQuestion} />
            ) : (
              <div className="flex flex-col items-center gap-5 rounded-cute-xl border border-[var(--border)] bg-gradient-to-br from-surface-soft to-[#eef8ff] px-8 py-8 text-center shadow-cute-sm">
                <div className="animate-float relative flex h-40 w-40 items-center justify-center rounded-[2rem] gradient-brand shadow-cute">
                  <div className="absolute inset-3 rounded-[1.5rem] border border-white/40 bg-white/15" />
                  <div className="absolute inset-x-10 bottom-7 flex items-end justify-center gap-1.5" aria-hidden="true">
                    {[0, 1, 2, 3].map((bar) => (
                      <span
                        key={bar}
                        className="w-2 rounded-full bg-white/85"
                        style={{height: `${12 + bar * 6}px`}}
                      />
                    ))}
                  </div>
                  <span className="relative z-10 text-4xl" aria-hidden="true">
                    🎧
                  </span>
                </div>
                <div>
                  <p className="text-base font-semibold text-foreground">Voice coming up</p>
                  <p className="mt-1 max-w-[15rem] text-sm leading-6 text-muted">
                    The coach&apos;s voice will appear here as soon as the next response is ready.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {isCompleted && report && (
          <div className="mb-8 rounded-cute-xl border border-primary/25 bg-gradient-to-br from-primary-soft/60 to-surface p-6">
            <h2 className="text-xl font-semibold text-foreground">Your session report</h2>
            <p className="mt-2 text-muted">{report.summary}</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="font-semibold text-foreground">Strengths</h3>
                <ul className="mt-2 list-disc pl-5 text-sm text-muted">
                  {report.strengths.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Focus areas</h3>
                <ul className="mt-2 list-disc pl-5 text-sm text-muted">
                  {report.focusAreas.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-4">
              <h3 className="font-semibold text-foreground">What to improve</h3>
              <ul className="mt-2 list-disc pl-5 text-sm text-muted">
                {report.improvements.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="mt-4">
              <h3 className="font-semibold text-foreground">Questions and answers reviewed</h3>
              <ul className="mt-2 space-y-2 text-sm text-muted">
                {conversationHistory.map((entry, index) => (
                  <li
                    key={`${entry.question}-${index}`}
                    className="rounded-cute border border-[var(--border)] bg-surface/80 p-3"
                  >
                    <p className="font-medium text-foreground">
                      Q{index + 1}: {entry.question}
                    </p>
                    <p className="mt-1">A: {entry.answer}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-4 inline-flex rounded-full bg-surface px-4 py-2 text-sm font-semibold text-primary">
              Overall score: {report.overallScore}/10
            </div>
          </div>
        )}
        <InterviewControls
          onStart={handleStartInterview}
          onPause={handlePauseInterview}
          onResume={handleResumeInterview}
          onEnd={handleEndInterview}
          onRecordingToggle={handleRecordingToggle}
          isStarted={isStarted}
          isPaused={isPaused}
          isListening={isRecording}
          isProcessing={isProcessing}
          isCompleted={isCompleted}
          questionCount={questionCount}
          totalQuestions={totalQuestions}
        />
      </div>
    </div>
  );
}
