"use client";

import {FC} from "react";

interface QuestionDisplayProps {
  question: string;
}

const QuestionDisplay: FC<QuestionDisplayProps> = ({question}) => {
  return (
    <div className="mb-6 rounded-cute-lg border border-[var(--border)] bg-surface p-6 shadow-cute-sm">
      <div className="mb-4 flex items-center gap-2">
        <span className="rounded-lg bg-primary-soft px-2 py-0.5 text-xs font-bold text-primary">
          Q
        </span>
        <h3 className="label-soft">Current question</h3>
      </div>
      <p className="max-w-[42rem] text-lg leading-8 text-foreground">{question}</p>
    </div>
  );
};

export default QuestionDisplay;
