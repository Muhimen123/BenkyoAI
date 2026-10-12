import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { DocsHeader } from "@/components/docs/DocsHeader";
import { AdminSignIn, VisibilityPanel } from "@/components/docs/AdminPanel";
import { configFromEnv } from "@/lib/docs/access";
import { adminConfigured, getDocsStatus, getOverride, isAdmin } from "@/lib/docs/accessServer";
import { signOut } from "./actions";

export const metadata: Metadata = {
  title: "BenkyoAI — Docs admin",
  robots: { index: false, follow: false },
};

export default async function DocsAdminPage() {
  await connection();
  const configured = adminConfigured();
  const admin = configured && (await isAdmin());

  return (
    <div className="min-h-dvh bg-paper">
      <DocsHeader>
        <Link href="/docs" className="hover:text-ink">
          Docs
        </Link>
      </DocsHeader>
      <main className="mx-auto max-w-2xl space-y-6 px-4 py-10 sm:px-6 sm:py-14">
        <div>
          <p className="label-data text-gold-700">Docs admin</p>
          <h1 className="mt-2 text-[28px] leading-tight font-semibold tracking-tight text-ink">
            Who can see /docs, and when
          </h1>
        </div>

        {!configured ? (
          <div className="space-y-3 rounded-xl border border-line bg-surface p-5 text-[14px] leading-relaxed text-ink-soft">
            <p>
              Admin is turned off on this server. Set{" "}
              <code className="rounded bg-sunk px-1.5 py-0.5 text-ink">DOCS_ADMIN_TOKEN</code> to a
              long random value and restart to turn it on.
            </p>
            <p>
              The docs window can also be set with env vars alone:{" "}
              <code className="rounded bg-sunk px-1.5 py-0.5 text-ink">DOCS_ENABLED</code>,{" "}
              <code className="rounded bg-sunk px-1.5 py-0.5 text-ink">DOCS_START</code>,{" "}
              <code className="rounded bg-sunk px-1.5 py-0.5 text-ink">DOCS_END</code> or{" "}
              <code className="rounded bg-sunk px-1.5 py-0.5 text-ink">DOCS_DURATION_HOURS</code>.
              See <code className="rounded bg-sunk px-1.5 py-0.5 text-ink">.env.example</code>.
            </p>
          </div>
        ) : !admin ? (
          <AdminSignIn />
        ) : (
          <>
            <VisibilityPanel
              status={getDocsStatus()}
              envConfig={configFromEnv(process.env).config}
              overrideUpdatedAt={getOverride()?.updatedAt}
            />
            <form action={signOut}>
              <button type="submit" className="text-[13px] text-ink-soft underline hover:text-ink">
                Sign out
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
