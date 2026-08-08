export interface ConversationEntry {
  question: string;
  answer: string;
}

export interface InterviewReport {
  overallScore: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  focusAreas: string[];
}

const ROLE_KEYWORDS: Record<string, string[]> = {
  "machine-learning-engineer": [
    "model",
    "data",
    "evaluation",
    "metric",
    "training",
    "deployment",
  ],
  "data-scientist": [
    "dataset",
    "feature",
    "experiment",
    "statistic",
    "analysis",
    "model",
  ],
  "product-manager": [
    "user",
    "metrics",
    "roadmap",
    "priority",
    "stakeholder",
    "customer",
  ],
  "frontend-engineer": [
    "performance",
    "accessibility",
    "component",
    "ux",
    "testing",
    "render",
  ],
};

export function generateInterviewReport(
  history: ConversationEntry[],
  role: string | null
): InterviewReport {
  if (!history.length) {
    return {
      overallScore: 6,
      summary: "You started the interview and began building your response flow.",
      strengths: ["You engaged with the interviewer promptly."],
      improvements: ["Share a bit more structure and examples in your next round."],
      focusAreas: ["Clarity", "Specific examples"],
    };
  }

  const totalAnswers = history.length;
  const wordsPerAnswer = history.map((entry) =>
    entry.answer.trim().split(/\s+/).filter(Boolean).length
  );
  const avgWords =
    wordsPerAnswer.reduce((sum, count) => sum + count, 0) / totalAnswers;
  const roleKeywords = ROLE_KEYWORDS[role ?? ""] ?? [];
  const matchedKeywords = history.flatMap((entry) =>
    roleKeywords.filter((keyword) =>
      entry.answer.toLowerCase().includes(keyword.toLowerCase())
    )
  );
  const uniqueKeywords = Array.from(new Set(matchedKeywords));

  const strengths: string[] = [];
  if (avgWords >= 35) {
    strengths.push("Your answers were detailed and gave the interviewer useful substance.");
  } else {
    strengths.push("You stayed engaged and responded consistently throughout the interview.");
  }

  if (uniqueKeywords.length >= 2) {
    strengths.push(
      `You referenced role-relevant ideas such as ${uniqueKeywords.slice(0, 3).join(", ")}.`
    );
  } else {
    strengths.push("You can strengthen your answers by mentioning more concrete domain concepts.");
  }

  if (totalAnswers >= 4) {
    strengths.push("You maintained a steady conversational flow across multiple questions.");
  }

  const improvements: string[] = [];
  improvements.push(
    "Add sharper trade-offs and implementation details to show deeper judgment."
  );
  improvements.push(
    "Include one concrete example or metric in each answer to make it more persuasive."
  );
  if (uniqueKeywords.length < 2) {
    improvements.push("Use more specific terminology tied to your role and the question.");
  }

  const focusAreas = role
    ? (() => {
        switch (role) {
          case "machine-learning-engineer":
            return ["Model evaluation", "Deployment trade-offs", "Monitoring"];
          case "data-scientist":
            return ["Experiment design", "Feature engineering", "Statistical significance"];
          case "product-manager":
            return ["User impact", "Success metrics", "Stakeholder alignment"];
          case "frontend-engineer":
            return ["Performance optimization", "Accessibility", "Testing strategy"];
          default:
            return ["Clarity", "Examples", "Trade-offs"];
        }
      })()
    : ["Clarity", "Examples", "Trade-offs"];

  const overallScore = Math.min(
    10,
    Math.max(
      5,
      Math.round(
        5 +
          Math.min(2, totalAnswers / 7) +
          (avgWords >= 35 ? 1 : 0) +
          (uniqueKeywords.length >= 2 ? 1 : 0)
      )
    )
  );

  return {
    overallScore,
    summary: `You answered ${totalAnswers} question${totalAnswers === 1 ? "" : "s"} with a ${overallScore}/10 level of depth and structure. The conversation stayed focused and relevant, which is a strong sign of interview readiness.`,
    strengths,
    improvements,
    focusAreas,
  };
}
