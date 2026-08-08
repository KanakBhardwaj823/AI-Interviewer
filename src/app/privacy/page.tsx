import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="px-4 py-12 sm:px-6 lg:px-8">
      <article className="card-cute mx-auto max-w-3xl p-8 sm:p-10">
        <p className="label-soft">Legal</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Privacy policy</h1>
        <p className="prose-cute mt-4">
          Interviewer processes voice recordings and uploaded resumes only to run your mock interview
          session. We do not sell your data. Session content is used to generate questions, transcripts,
          and your post-interview summary.
        </p>
        <p className="prose-cute mt-4">
          If you have questions about how your data is handled, contact your project administrator or
          the team maintaining this deployment.
        </p>
        <Link href="/" className="btn-secondary mt-8 inline-flex no-underline">
          Back to home
        </Link>
      </article>
    </div>
  );
}
