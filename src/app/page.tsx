import { CheckWorkspace } from "@/components/haldusakt/check-workspace";
import { SiteHeader } from "@/components/haldusakt/site-header";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <CheckWorkspace />
      </main>
    </>
  );
}
