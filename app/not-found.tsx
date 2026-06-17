import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-start gap-4 px-4 py-20 sm:px-6">
      <div className="flex items-center gap-2 text-accent">
        <Compass className="h-6 w-6" aria-hidden />
        <h1 className="text-xl font-semibold text-text-primary">Page not found</h1>
      </div>
      <p className="text-sm leading-relaxed text-text-secondary">
        That page doesn&rsquo;t exist. Try one of the five views from the navigation, or start from the
        story page.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-background hover:bg-accent-dim"
      >
        Back to start
      </Link>
    </div>
  );
}
