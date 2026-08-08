import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[50dvh] items-center justify-center px-4 py-16">
      <div className="max-w-xl rounded-cute-xl border border-[var(--border)] bg-surface p-10 text-center shadow-cute-lg">
        <p className="text-5xl" aria-hidden="true">
          🔍
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground">Page not found</h1>
        <p className="mt-3 text-lg leading-8 text-muted">
          That interview page doesn&apos;t exist or may have moved. Head home to pick a role and start
          again.
        </p>
        <Link href="/" className="btn-primary mt-8 inline-flex no-underline">
          Back to home
        </Link>
      </div>
    </div>
  );
}
