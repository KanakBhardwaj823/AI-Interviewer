"use client";

import React from "react";

interface ErrorHandlerProps {
  message: string | null;
  type?: "error" | "info";
}

export const ErrorHandler: React.FC<ErrorHandlerProps> = ({
  message,
  type = "error",
}) => {
  if (!message) return null;

  const styles = {
    error: "border-danger/25 bg-danger-soft text-foreground shadow-cute",
    info: "border-primary/25 bg-primary-soft text-foreground shadow-cute",
  };

  return (
    <div
      className="fixed right-4 top-4 z-[var(--z-toast)] max-w-md animate-fade-in"
      role={type === "error" ? "alert" : "status"}
      aria-live="polite"
    >
      <div className={`${styles[type]} rounded-cute-lg border p-4 backdrop-blur-sm`}>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 text-lg" aria-hidden="true">
            {type === "error" ? "!" : "i"}
          </span>
          <div className="text-sm leading-7">{message}</div>
        </div>
      </div>
    </div>
  );
};
