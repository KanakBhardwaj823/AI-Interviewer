import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="px-4 py-12 sm:px-6 lg:px-8">
      <article className="card-cute mx-auto max-w-3xl p-8 sm:p-10">
        <p className="label-soft">Legal</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Terms of use</h1>
                <p className="prose-cute mt-4">
          PrepIQ is a practice tool. AI-generated questions and feedback are meant to help you
          rehearse — they are not hiring decisions, legal advice, or guaranteed interview outcomes.
        </p>
        <p className="prose-cute mt-4">
          Use the app responsibly, verify important details independently, and do not upload documents
          you are not permitted to share.
        </p>
        <Link href="/" className="btn-secondary mt-8 inline-flex no-underline">
          Back to home
        </Link>
      </article>
    </div>
  );
}
