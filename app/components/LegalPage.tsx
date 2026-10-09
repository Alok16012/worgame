import Link from "next/link";

export const supportEmail = "support@shrikalyan.app";

export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return <main className="min-h-screen bg-[#0b1d4f] px-5 py-12 text-slate-100">
    <article className="mx-auto max-w-3xl space-y-6 rounded-2xl bg-white p-6 text-slate-800 sm:p-10 [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold [&_p]:leading-7 [&_a]:underline [&_li]:mb-2">
      <Link href="/">Shri Kalyan</Link>
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="text-sm text-slate-500">Updated 9 October 2026</p>
      {children}
      <nav className="flex flex-wrap gap-5 border-t pt-5 text-sm"><Link href="/privacy-policy">Privacy policy</Link><Link href="/delete-account">Delete account and data</Link></nav>
    </article>
  </main>;
}
