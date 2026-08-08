"use client";

import {useState, useCallback} from "react";
import {useInterview} from "../context/InterviewContext";
import {apiClient} from "../utils/apiClient";
import {ERROR_MESSAGES} from "@/utils/constants";
import {generateInterviewReport, type ConversationEntry, type InterviewReport} from "@/utils/interviewReport";

interface UseInterviewFlowReturn {
  handleStopAnswer: (audioBlob: Blob) => Promise<void>;
  isProcessing: boolean;
  error: string | null;
  report: InterviewReport | null;
  conversationHistory: ConversationEntry[];
}

export const useInterviewFlow = (): UseInterviewFlowReturn => {
  const {
    selectedRole,
    resumeText,
    setCurrentQuestion,
    setTranscription,
    currentQuestion,
    questionCount,
    incrementQuestionCount,
    setIsCompleted,
  } = useInterview();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const QUESTION_LIMIT = 7;
  const MIN_ANSWER_LENGTH = 20;
  const [conversationHistory, setConversationHistory] = useState<ConversationEntry[]>([]);
  const [report, setReport] = useState<InterviewReport | null>(null);

  const handleStopAnswer = useCallback(
    async (audioBlob: Blob) => {
      setIsProcessing(true);
      setError(null);
      try {
        // Check if audio blob is empty or too small
        if (!audioBlob || audioBlob.size < 1000) {
          throw new Error("No speech detected. Please try again.");
        }

        // Send audio for transcription
        const transcription = await apiClient.transcribeAudio(audioBlob);

        const cleanedTranscript = transcription.trim();
        if (!cleanedTranscript || cleanedTranscript.length < MIN_ANSWER_LENGTH) {
          throw new Error(
            "Your answer was too short or unclear. Please provide a more detailed response."
          );
        }

        setTranscription(cleanedTranscript);
        const updatedHistory = [
          ...conversationHistory,
          {question: currentQuestion, answer: cleanedTranscript},
        ];
        setConversationHistory(updatedHistory);
        console.log(
          `Question ${questionCount}/${QUESTION_LIMIT}:`,
          currentQuestion
        );
        console.log("Your answer:", transcription);

        if (questionCount >= QUESTION_LIMIT) {
          const completionMessage =
            "Interview completed successfully! Thank you for your participation. You have completed all questions.";
          const generatedReport = generateInterviewReport(updatedHistory, selectedRole ?? null);
          setReport(generatedReport);
          setCurrentQuestion(completionMessage);
          setIsCompleted(true);
          return;
        }

        let nextQuestion = "Could you please elaborate more on your previous answer?";
        try {
          nextQuestion = await apiClient.getNextQuestion(
            currentQuestion,
            cleanedTranscript,
            selectedRole ?? undefined,
            resumeText.trim() ? resumeText : undefined
          );
        } catch (apiError) {
          setError(" AI response is unavailable. Please read the next prompt and continue.");
        }

        setCurrentQuestion(nextQuestion);
        incrementQuestionCount();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "An unknown error occurred";
        setError(errorMessage);

        if (
          errorMessage.includes("too short") ||
          errorMessage.includes("No speech detected")
        ) {
          setCurrentQuestion(
            "I didn't capture enough of that. Please answer again with a bit more detail, especially your approach, reasoning, and the outcome you expect."
          );
        } else if (errorMessage.toLowerCase().includes("network")) {
          setError(ERROR_MESSAGES.NETWORK_ERROR);
        } else {
          setError("Something went wrong. Please try again.");
        }
      } finally {
        setIsProcessing(false);
      }
    },
    [
      currentQuestion,
      questionCount,
      selectedRole,
      resumeText,
      setCurrentQuestion,
      setTranscription,
      incrementQuestionCount,
      setIsCompleted,
      conversationHistory,
    ]
  );

  return {
    handleStopAnswer,
    isProcessing,
    error,
    report,
    conversationHistory,
  };
};
