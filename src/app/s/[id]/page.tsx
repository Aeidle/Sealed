import { RevealSecret } from "@/components/reveal-secret";
import { SiteHeader } from "@/components/site-header";
import { PrivacyNote } from "@/components/privacy-note";

export default async function RevealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <main className="app-backdrop min-h-screen pb-24">
      <div className="glow-layer" aria-hidden />
      <SiteHeader />

      <div className="enter mx-auto flex w-full max-w-md flex-col gap-8 px-5 pt-10 sm:pt-16">
        <RevealSecret id={id} />
      </div>

      <div className="mx-auto mt-20 w-full max-w-md px-5">
        <PrivacyNote />
      </div>
    </main>
  );
}
