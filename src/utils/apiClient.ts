"use client";

import axios from "axios";
import {TIMEOUTS, type InterviewRole} from "./constants";
import type {AxiosPromise} from "axios";

interface TranscriptionResponse {
  transcription: string;
}

interface NextQuestionResponse {
  response: string;
}

class ApiClient {
  private static instance: ApiClient;
  private readonly client;

  private constructor() {
    this.client = axios.create({
      baseURL: "/api",
      headers: {
        "Content-Type": "application/json",
      },
      timeout: TIMEOUTS.API_REQUEST_TIMEOUT,
    });
  }

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  private async handleResponse<T>(promise: AxiosPromise<T>): Promise<T> {
    try {
      const response = await promise;
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 429) {
        throw new Error(
          error.response.data.error ||
            "Rate limit exceeded. Please try again later."
        );
      }
      throw error;
    }
  }

  async transcribeAudio(audioBlob: Blob): Promise<string> {
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "answer.webm");

      const response = await fetch("/api/deepgramSTT", {
        method: "POST",
        body: formData,
      });
      const contentType = response.headers.get("content-type") || "";

      if (!response.ok) {
        let message = `Transcription failed with status ${response.status}`;
        try {
          if (contentType.includes("application/json")) {
            const errJson = await response.json();
            message = errJson?.error || errJson?.message || message;
          } else {
            const text = await response.text();
            if (text) message = text;
          }
        } catch (e) {
          // ignore parsing errors
        }
        throw new Error(message);
      }

      if (contentType.includes("application/json")) {
        const data = (await response.json()) as TranscriptionResponse;
        if (!data || !data.transcription) {
          throw new Error("Transcription response missing transcription field");
        }
        return data.transcription;
      }

      // Fallback: attempt to parse text body then JSON
      const textBody = await response.text();
      try {
        const parsed = JSON.parse(textBody) as TranscriptionResponse;
        if (parsed?.transcription) return parsed.transcription;
      } catch (e) {
        // not JSON
      }
      throw new Error("Invalid transcription response format");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Transcription failed:", message);
      throw new Error(message);
    }
  }

  async getNextQuestion(
    currentQuestion: string,
    answer: string,
    role?: InterviewRole,
    resumeText?: string
  ): Promise<string> {
    try {
      const response = await this.client.post<NextQuestionResponse>(
        "/llmGenerate",
        {
          currentQuestion,
          answer,
          role,
          resumeText,
        }
      );

      if (response.data?.response) {
        return response.data.response;
      }

      throw new Error("Empty response from interviewer service");
    } catch (error) {
      console.error("Failed to get next question:", error);
      return "Could you expand on your answer with a concrete example, a trade-off, or the outcome you would expect?";
    }
  }

  async generateVoice(text: string): Promise<Blob> {
    try {
      const response = await this.client.post(
        "/deepgramTTS",
        {
          text,
        },
        {
          responseType: "blob",
          timeout: TIMEOUTS.API_REQUEST_TIMEOUT * 2, // Double timeout for voice generation
        }
      );

      return response.data;
    } catch (error) {
      console.error("Voice generation failed:", error);
      throw new Error("Failed to generate voice");
    }
  }
}

export const apiClient = ApiClient.getInstance();
