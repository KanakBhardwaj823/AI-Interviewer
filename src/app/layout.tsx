import type {Metadata} from "next";
import {Outfit} from "next/font/google";
import Link from "next/link";
import "./globals.css";
import {InterviewProvider} from "@/context/InterviewContext";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Interviewer — friendly mock interview practice",
  description:
    "Practice technical and product interviews with a voice-first AI coach that listens, asks follow-ups, and summarizes how you did.",
  openGraph: {
    title: "Interviewer — friendly mock interview practice",
    description:
      "Practice technical and product interviews with a voice-first AI coach that listens, asks follow-ups, and summarizes how you did.",
    type: "website",
  },
  icons: {
    icon: "/file.svg",
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.variable} font-sans antialiased`}>
        <div className="grain-overlay" aria-hidden="true" />
        <InterviewProvider>
          <div className="app-shell flex min-h-dvh flex-col text-foreground">
            <a href="#main-content" className="skip-link">
              Skip to content
            </a>

            <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-surface/80 backdrop-blur-xl">
              <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
                <Link href="/" className="group flex items-center gap-3.5 no-underline">
                  <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-[1.1rem] gradient-brand shadow-cute-sm transition group-hover:scale-[1.03]">
                    <span className="text-xl" aria-hidden="true">
                      🎙️
                    </span>
                  </div>
                  <div>
                    <p className="text-lg font-semibold tracking-tight text-foreground">
                      Interviewer
                    </p>
                    <p className="text-sm font-medium text-muted">
                      Your cozy practice studio
                    </p>
                  </div>
                </Link>

                <div className="hidden items-center gap-2 rounded-full border border-[var(--border)] bg-primary-soft px-3.5 py-1.5 text-xs font-semibold text-primary md:flex">
                  <span className="h-2 w-2 rounded-full bg-success shadow-[0_0_0_4px_rgba(52,199,89,0.2)]" />
                  Ready when you are
                </div>
              </div>
            </header>

            <main id="main-content" className="w-full flex-1 px-0 py-2">
              {children}
            </main>

            <footer className="border-t border-[var(--border)] bg-surface/70 backdrop-blur-sm">
              <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
                <p>© {new Date().getFullYear()} Interviewer. Practice at your own pace.</p>
                <nav aria-label="Footer" className="flex flex-wrap gap-4">
                  <Link href="/" className="font-medium text-foreground/80 transition hover:text-primary">
                    Home
                  </Link>
                  <Link
                    href="/privacy"
                    className="font-medium text-foreground/80 transition hover:text-primary"
                  >
                    Privacy
                  </Link>
                  <Link
                    href="/terms"
                    className="font-medium text-foreground/80 transition hover:text-primary"
                  >
                    Terms
                  </Link>
                </nav>
              </div>
            </footer>
          </div>
        </InterviewProvider>
      </body>
    </html>
  );
}
