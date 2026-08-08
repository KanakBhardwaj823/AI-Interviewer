"use client";

import {ChangeEvent, useMemo, useState} from "react";
import {useRouter} from "next/navigation";
import {INTERVIEW_ROLES, InterviewRole} from "@/utils/constants";
import {useInterview} from "@/context/InterviewContext";

export default function Home() {
  const [selectedRole, setSelectedRole] = useState<InterviewRole | null>(null);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [resumeUploadError, setResumeUploadError] = useState<string | null>(null);
  const {resumeText, resumeFileName, setResumeText, setResumeFileName} = useInterview();
  const router = useRouter();

  const selectedRoleDetails = useMemo(
    () => INTERVIEW_ROLES.find((role) => role.id === selectedRole) ?? null,
    [selectedRole]
  );

  const handleStart = () => {
    if (selectedRole) {
      router.push(`/interview?role=${selectedRole}`);
    }
  };

  const handleResumeUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsUploadingResume(true);
    setResumeUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/resumeExtract", {
        method: "POST",
        body: formData,
      });

      const contentType = response.headers.get("content-type") || "";
      const responseText = await response.text();
      let data: {text?: string; fileName?: string; error?: string} | null = null;

      if (contentType.includes("application/json")) {
        try {
          data = JSON.parse(responseText) as {
            text?: string;
            fileName?: string;
            error?: string;
          };
        } catch {
          data = null;
        }
      }

      if (!response.ok) {
        const fallbackMessage = responseText.trim() || "Failed to extract resume text";
        throw new Error(data?.error || fallbackMessage);
      }

      if (!data?.text) {
        throw new Error("Resume extraction returned no readable text.");
      }

      setResumeText(data.text);
      setResumeFileName(data.fileName || file.name);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Resume upload failed";
      setResumeUploadError(message);
      setResumeText("");
      setResumeFileName(null);
    } finally {
      setIsUploadingResume(false);
      event.target.value = "";
    }
  };

  return (
    <div className="px-4 py-10 pb-14 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-12">
        <section className="card-cute overflow-hidden p-8 lg:p-12">
          <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-primary-soft px-4 py-2 text-sm font-semibold text-primary">
                <span className="text-base" aria-hidden="true">
                  ✨
                </span>
                Voice-first mock interviews
              </div>
              <h1 className="max-w-2xl text-balance text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-[3.35rem]">
                Practice interviews in a calm, cheerful space
              </h1>
              <p className="prose-cute mt-5">
                Pick a role, talk naturally, and get follow-up questions that feel like a real conversation — not a script.
              </p>

              <div className="mt-8 flex flex-wrap gap-2.5">
                {["Speak your answers", "Role-specific prompts", "Session summary"].map((item) => (
                  <span
                    key={item}
                    className="rounded-full bg-surface-soft px-4 py-2 text-sm font-medium text-foreground/80"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-cute-xl bg-gradient-to-br from-surface-soft via-surface to-[#eef8ff] p-6 shadow-cute-sm">
              <div
                className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/15 blur-2xl"
                aria-hidden="true"
              />
              <p className="label-soft">How it works</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                Three small steps, one big confidence boost
              </h2>
              <ol className="mt-6 space-y-3">
                {[
                  {
                    title: "Choose your track",
                    body: "Focus on the role you are actually interviewing for.",
                  },
                  {
                    title: "Answer out loud",
                    body: "The coach listens and asks thoughtful follow-ups.",
                  },
                  {
                    title: "Review your notes",
                    body: "See what landed well and what to sharpen next time.",
                  },
                ].map((step, index) => (
                  <li
                    key={step.title}
                    className="flex gap-3 rounded-cute border border-[var(--border)] bg-surface/80 p-4 transition hover:-translate-y-0.5 hover:shadow-cute-sm"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-sm font-bold text-primary">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-foreground">{step.title}</p>
                      <p className="mt-0.5 text-sm leading-6 text-muted">{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="card-cute p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="label-soft">Pick your interview</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                  Which role are you preparing for?
                </h3>
              </div>
              <span className="rounded-xl bg-surface-soft px-3 py-1.5 text-xs font-semibold text-muted">
                {selectedRole ? "Looks good" : "Choose one"}
              </span>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {INTERVIEW_ROLES.map((role) => {
                const isActive = selectedRole === role.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRole(role.id)}
                    className={`flex h-full flex-col rounded-cute-lg border p-5 text-left transition ${
                      isActive
                        ? "border-primary/40 bg-primary-soft shadow-cute-sm"
                        : "border-[var(--border)] bg-surface hover:-translate-y-0.5 hover:border-primary/25 hover:bg-surface-soft"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-lg bg-surface-muted px-2.5 py-1 text-[11px] font-bold tracking-wide text-primary">
                        {role.badge}
                      </span>
                      {isActive && (
                        <span className="rounded-lg bg-primary px-2.5 py-1 text-[11px] font-semibold text-white">
                          Selected
                        </span>
                      )}
                    </div>
                    <h4 className="mt-4 text-lg font-semibold text-foreground">{role.label}</h4>
                    <p className="mt-2 flex-1 text-sm leading-6 text-muted">{role.description}</p>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 rounded-cute-lg border border-primary/20 bg-gradient-to-br from-primary-soft/70 to-surface p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="label-soft">Optional resume mode</p>
                  <h4 className="mt-2 text-lg font-semibold text-foreground">Upload a PDF resume</h4>
                </div>
                <label className="btn-primary cursor-pointer px-5 py-2.5 text-sm">
                  {isUploadingResume ? "Reading file…" : "Choose PDF"}
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    className="hidden"
                    onChange={handleResumeUpload}
                    disabled={isUploadingResume}
                  />
                </label>
              </div>

              <div className="mt-4 rounded-cute border border-[var(--border)] bg-surface/90 p-4">
                {isUploadingResume ? (
                  <div className="space-y-2" aria-live="polite">
                    <div className="h-4 w-2/3 animate-pulse rounded-lg bg-surface-soft" />
                    <div className="h-3 w-1/2 animate-pulse rounded-lg bg-surface-soft" />
                  </div>
                ) : resumeFileName ? (
                  <>
                    <p className="text-sm font-semibold text-foreground">{resumeFileName}</p>
                    <p className="mt-1 text-sm leading-6 text-muted">
                      Your background will shape the opening question and follow-ups.
                    </p>
                    <p className="mt-2 text-xs font-semibold text-success">
                      {resumeText.length.toLocaleString()} characters extracted
                    </p>
                  </>
                ) : (
                  <p className="text-sm leading-6 text-muted">
                    Add a PDF and the coach will tailor questions around your projects, skills, and experience.
                  </p>
                )}

                {resumeUploadError && (
                  <p
                    className="mt-3 rounded-cute border border-danger/20 bg-danger-soft px-4 py-2.5 text-sm text-foreground"
                    role="alert"
                  >
                    {resumeUploadError}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleStart}
              disabled={!selectedRole}
              className="btn-primary mt-8 disabled:hover:translate-y-0"
            >
              {selectedRole
                ? `Start ${selectedRoleDetails?.label ?? "interview"}`
                : "Select a role to begin"}
            </button>
          </div>

          <div className="card-cute flex flex-col p-6 sm:p-8">
            <p className="label-soft">What you get</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
              A gentle place to rehearse under pressure
            </h3>
            <ul className="mt-6 flex flex-1 flex-col gap-3">
              {[
                "Voice answers with natural follow-up questions",
                "Role-specific technical and product conversations",
                "A clear report so you know what to practice next",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-cute border border-[var(--border)] bg-surface-soft/80 p-4"
                >
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-sm"
                    aria-hidden="true"
                  >
                    ♡
                  </span>
                  <p className="text-sm leading-6 text-muted">{item}</p>
                </li>
              ))}
            </ul>
            <div
              className="mt-6 h-44 w-full overflow-hidden rounded-cute-lg bg-cover bg-center opacity-90"
              style={{
                backgroundImage:
                  "url('https://picsum.photos/seed/interviewer-cozy/960/540')",
              }}
              role="img"
              aria-label="Soft sunlight over a desk with notebook and coffee, suggesting a calm study session"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
