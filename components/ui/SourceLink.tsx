import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface SourceLinkProps {
  url: string | null;
  name: string | null;
  className?: string;
}

/**
 * Renders a labeled external source link, or a muted "No source" marker when no
 * URL is available — we never imply a source we don't have.
 */
export function SourceLink({ url, name, className }: SourceLinkProps) {
  if (!url) {
    return <span className={cn("text-xs text-muted", className)}>No source</span>;
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium text-info underline-offset-2 hover:underline",
        className,
      )}
    >
      {name ?? "Source"}
      <ExternalLink className="h-3 w-3" aria-hidden />
    </a>
  );
}
