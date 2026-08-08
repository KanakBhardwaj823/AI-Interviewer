export type InterviewRole =
  | "machine-learning-engineer"
  | "data-scientist"
  | "product-manager"
  | "frontend-engineer";

export const INTERVIEW_ROLES = [
  {
    id: "machine-learning-engineer" as const,
    label: "Machine Learning Engineer",
    description:
      "Deep technical interview focusing on model design, evaluation, and production readiness.",
    badge: "ML",
  },
  {
    id: "data-scientist" as const,
    label: "Data Scientist",
    description:
      "Data-centric interview focusing on analytics, feature engineering, and statistical modeling.",
    badge: "DS",
  },
  {
    id: "product-manager" as const,
    label: "Product Manager",
    description:
      "Strategy-oriented interview focusing on product vision, user impact, and AI roadmap planning.",
    badge: "PM",
  },
  {
    id: "frontend-engineer" as const,
    label: "Frontend Engineer",
    description:
      "UX-focused interview covering frontend architecture, accessibility, and responsive web design.",
    badge: "FE",
  },
] as const;

export const ROLE_INITIAL_QUESTIONS: Record<InterviewRole, string> = {
  "machine-learning-engineer":
    "As a Machine Learning Engineer, can you describe how you would design and evaluate a production-ready classification model for a business-critical application?",
  "data-scientist":
    "As a Data Scientist, how would you approach exploring and preparing a new dataset for predictive modeling while ensuring reliable model insights?",
  "product-manager":
    "As a Product Manager, how would you define success metrics and prioritize user impact for an AI-driven feature in your product?",
  "frontend-engineer":
    "As a Frontend Engineer, how would you design an accessible and high-performance UI for an AI interview assistant that responds in real time?",
};

export const ROLE_SYSTEM_PROMPTS: Record<InterviewRole, string> = {
  "machine-learning-engineer":
    "You are interviewing a Machine Learning Engineer. Focus on model training, evaluation, deployment, and production considerations.",
  "data-scientist":
    "You are interviewing a Data Scientist. Focus on data analysis, feature engineering, experimentation, and statistical reasoning.",
  "product-manager":
    "You are interviewing a Product Manager. Focus on product strategy, metrics, stakeholder alignment, and AI ethics.",
  "frontend-engineer":
    "You are interviewing a Frontend Engineer. Focus on frontend architecture, UX, performance, and accessibility.",
};

// API Endpoints
export const API_ENDPOINTS = {
  TRANSCRIBE: "/api/deepgramSTT",
  NEXT_QUESTION: "/api/llmGenerate",
  GENERATE_VOICE: "/api/deepgramTTS",
} as const;

// Interview Questions
export const INTERVIEW_QUESTIONS = {
  INITIAL:
    "Let's begin with a fundamental question about technical interviews. Please answer naturally and clearly.",
  FALLBACK: "That's interesting. Could you elaborate more on that point?",
} as const;

// Timeouts (in milliseconds)
export const TIMEOUTS = {
  RECORDING_MAX_DURATION: 120000, // 2 minutes
  VOICE_GENERATION_TIMEOUT: 10000, // 10 seconds
  API_REQUEST_TIMEOUT: 30000, // 30 seconds
} as const;

// Audio Settings
export const AUDIO_CONFIG = {
  MIME_TYPE: "audio/webm",
  SAMPLE_RATE: 16000,
  CHANNELS: 1,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  MICROPHONE_ACCESS:
    "Error accessing microphone. Please check your permissions.",
  TRANSCRIPTION_FAILED: "Failed to transcribe audio. Please try again.",
  VOICE_GENERATION_FAILED: "Failed to generate voice response.",
  NETWORK_ERROR: "Network error. Please check your connection.",
  PROCESSING_TIMEOUT: "Processing is taking longer than expected...",
} as const;
