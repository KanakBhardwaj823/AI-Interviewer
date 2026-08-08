"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  FC,
} from "react";
import {
  INTERVIEW_QUESTIONS,
  InterviewRole,
  ROLE_INITIAL_QUESTIONS,
} from "@/utils/constants";
import {apiClient} from "@/utils/apiClient";

interface InterviewContextType {
  currentQuestion: string;
  transcription: string;
  selectedRole: InterviewRole | null;
  resumeText: string;
  resumeFileName: string | null;
  isStarted: boolean;
  isPaused: boolean;
  isRecording: boolean;
  audioUrl: string | null;
  questionCount: number;
  isCompleted: boolean;
  startInterview: (role?: InterviewRole) => Promise<void>;
  pauseInterview: () => void;
  resumeInterview: () => void;
  endInterview: () => void;
  setCurrentQuestion: (question: string) => void;
  setTranscription: (text: string) => void;
  setSelectedRole: (role: InterviewRole | null) => void;
  setResumeText: (text: string) => void;
  setResumeFileName: (fileName: string | null) => void;
  setIsRecording: (isRecording: boolean) => void;
  setAudioUrl: (url: string | null) => void;
  incrementQuestionCount: () => void;
  setIsCompleted: (completed: boolean) => void;
}

const InterviewContext = createContext<InterviewContextType | undefined>(
  undefined
);

interface InterviewProviderProps {
  children: ReactNode;
}

export const InterviewProvider: FC<InterviewProviderProps> = ({children}) => {
  const [currentQuestion, setCurrentQuestion] = useState<string>(
    INTERVIEW_QUESTIONS.INITIAL
  );
  const [transcription, setTranscription] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<InterviewRole | null>(null);
  const [resumeText, setResumeText] = useState<string>("");
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const startInterview = useCallback(async (role?: InterviewRole) => {
    if (role) {
      setSelectedRole(role);
      if (resumeText.trim()) {
        try {
          const generatedQuestion = await apiClient.getNextQuestion(
            "",
            "",
            role,
            resumeText
          );
          setCurrentQuestion(generatedQuestion);
        } catch {
          setCurrentQuestion(ROLE_INITIAL_QUESTIONS[role]);
        }
      } else {
        setCurrentQuestion(ROLE_INITIAL_QUESTIONS[role]);
      }
    } else {
      setCurrentQuestion(INTERVIEW_QUESTIONS.INITIAL);
    }

    setIsStarted(true);
    setIsPaused(false);
    setQuestionCount(1); // Start with first question
    setIsCompleted(false);
  }, [resumeText]);

  const incrementQuestionCount = useCallback(() => {
    setQuestionCount((prev) => prev + 1);
  }, []);

  const pauseInterview = useCallback(() => {
    setIsPaused(true);
    setIsRecording(false);
  }, []);

  const resumeInterview = useCallback(() => {
    setIsPaused(false);
  }, []);

  const endInterview = useCallback(() => {
    setIsStarted(false);
    setIsPaused(false);
    setIsRecording(false);
    setCurrentQuestion("");
    setTranscription("");
    setSelectedRole(null);
    setAudioUrl(null);
    setQuestionCount(0);
    setIsCompleted(false);
  }, []);

  const value = {
    currentQuestion,
    transcription,
    selectedRole,
    resumeText,
    resumeFileName,
    isStarted,
    isPaused,
    isRecording,
    audioUrl,
    questionCount,
    isCompleted,
    startInterview,
    pauseInterview,
    resumeInterview,
    endInterview,
    setCurrentQuestion,
    setTranscription,
    setSelectedRole,
    setResumeText,
    setResumeFileName,
    setIsRecording,
    setAudioUrl,
    incrementQuestionCount,
    setIsCompleted,
  };

  return (
    <InterviewContext.Provider value={value}>
      {children}
    </InterviewContext.Provider>
  );
};

export const useInterview = () => {
  const context = useContext(InterviewContext);
  if (context === undefined) {
    throw new Error("useInterview must be used within an InterviewProvider");
  }
  return context;
};
