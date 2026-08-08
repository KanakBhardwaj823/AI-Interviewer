"use client";

import {FC} from "react";
import {FaMicrophone, FaStop} from "react-icons/fa";
import Link from "next/link";

interface InterviewControlsProps {
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
  onRecordingToggle: () => void;
  isStarted: boolean;
  isPaused: boolean;
  isListening: boolean;
  isProcessing: boolean;
  isCompleted: boolean;
  questionCount: number;
  totalQuestions: number;
  isGenerating?: boolean;
}

const InterviewControls: FC<InterviewControlsProps> = ({
  onStart,
  onPause,
  onResume,
  onEnd,
  onRecordingToggle,
  isStarted,
  isPaused,
  isListening,
  isProcessing,
  isCompleted,
  questionCount,
  totalQuestions,
  isGenerating,
}) => {
  if (!isStarted) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-8 rounded-cute-xl border border-[var(--border)] bg-surface-soft/70 p-8 shadow-cute-sm"
        role="region"
        aria-label="Interview Start Screen"
      >
        <div className="max-w-2xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1.5 text-sm font-semibold text-primary">
            <span aria-hidden="true">☁️</span>
            Session ready
          </div>
          <h1 className="mb-4 text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Shall we begin your mock interview?
          </h1>
          <p className="text-lg leading-8 text-muted">
            Speak naturally, take a breath between thoughts, and let the coach guide the conversation.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-muted">
            <span className="rounded-full bg-surface px-4 py-2">Voice-first flow</span>
            <span className="rounded-full bg-surface px-4 py-2">Thoughtful follow-ups</span>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={onStart}
            className="btn-primary px-8 py-3.5"
            aria-label="Start the interview"
          >
            Start interview
          </button>
          <Link href="/" className="btn-secondary px-8 py-3.5 no-underline">
            Back to selection
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl" role="region" aria-label="Interview Controls">
      <div className="mb-8 rounded-cute-lg border border-[var(--border)] bg-surface-soft/80 p-5 shadow-cute-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="label-soft">Session in progress</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
              Take your time — clarity beats speed
            </h2>
          </div>
          <div className="rounded-full border border-[var(--border)] bg-surface px-3 py-1.5 text-sm font-semibold text-foreground">
            Question {questionCount} of {totalQuestions}
          </div>
        </div>
        <div
          className="h-3 w-full overflow-hidden rounded-full bg-surface"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={(questionCount / totalQuestions) * 100}
          aria-label="Interview progress"
        >
          <div
            className="h-3 rounded-full bg-gradient-to-r from-success via-primary to-[#7dd3fc] transition-[width] duration-300 ease-out"
            style={{width: `${(questionCount / totalQuestions) * 100}%`}}
          />
        </div>
      </div>

      {isGenerating && (
        <div className="mb-4 flex items-center justify-center gap-3" role="status" aria-live="polite">
          <div className="h-8 w-8 animate-pulse rounded-2xl bg-primary/20" aria-hidden="true" />
          <span className="text-sm font-medium text-primary">Preparing response…</span>
        </div>
      )}

      <div
        className="mb-8 flex flex-col items-center justify-center"
        role="region"
        aria-label="Voice Recording Controls"
      >
        <button
          onClick={onRecordingToggle}
          disabled={isPaused || isProcessing}
          className={`mb-4 flex h-24 w-24 items-center justify-center rounded-[1.75rem] border border-[var(--border)] text-white shadow-cute transition ${
            isListening
              ? "animate-pulse bg-danger"
              : "gradient-brand"
          }`}
          aria-label={isListening ? "Stop recording" : "Start recording"}
          aria-pressed={isListening}
        >
          {isListening ? (
            <FaStop className="h-8 w-8" aria-hidden="true" />
          ) : (
            <FaMicrophone className="h-8 w-8" aria-hidden="true" />
          )}
        </button>

        <div role="status" aria-live="polite">
          {isListening && (
            <div className="mb-4 text-sm font-semibold text-success">Listening to your answer…</div>
          )}
          {isProcessing && (
            <div className="mb-4 text-sm font-semibold text-primary">Processing response…</div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-3">
          {isPaused ? (
            <button
              onClick={onResume}
              className="rounded-full bg-success px-6 py-2.5 font-semibold text-white transition hover:brightness-105"
              aria-label="Resume interview"
            >
              Resume interview
            </button>
          ) : (
            <button
              onClick={onPause}
              className="rounded-full bg-warning px-6 py-2.5 font-semibold text-foreground transition hover:brightness-105"
              aria-label="Pause interview"
            >
              Pause interview
            </button>
          )}
          <button
            onClick={onEnd}
            className="rounded-full border border-danger/30 bg-danger-soft px-6 py-2.5 font-semibold text-foreground transition hover:bg-danger/10"
            aria-label="End interview"
          >
            End interview
          </button>
        </div>
      </div>

      {isCompleted && (
        <div
          className="rounded-cute-lg border border-success/30 bg-success-soft p-6 text-center"
          role="alert"
          aria-live="polite"
        >
          <h3 className="mb-4 text-xl font-semibold text-foreground">
            Interview complete — nice work
          </h3>
          <div className="flex justify-center gap-4">
            <button
              onClick={onEnd}
              className="rounded-full bg-success px-6 py-2.5 font-semibold text-white transition hover:brightness-105"
              aria-label="Start new interview"
            >
              Start new interview
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewControls;
