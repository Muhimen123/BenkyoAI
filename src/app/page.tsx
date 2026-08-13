import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 dark:bg-black p-6 font-sans">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-center py-16 px-8 bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm text-center sm:text-left sm:items-start gap-8">
        <div className="flex flex-col gap-3">
          <span className="text-3xl">📚</span>
          <h1 className="text-3xl font-bold tracking-tight text-black dark:text-zinc-50">
            Benkyo AI — Default Vault & Study Helper
          </h1>
          <p className="text-base text-zinc-600 dark:text-zinc-400 max-w-xl">
            Your AI-powered study companion with local default vault storage (OPFS) supporting full read, write, import, and export across Chrome, Firefox, and Safari.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full">
          <Link
            href="/vault-test"
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors shadow-sm"
          >
            <span>🗄️</span> Open Vault Test Page
          </Link>
        </div>
      </main>
    </div>
  );
}
