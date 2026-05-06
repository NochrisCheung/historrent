"use client";

import { useEffect } from "react";
import { ErrorOverlay } from "@/components/ui/ErrorOverlay";

/**
 * Next.js error boundary for the root segment. When an unhandled
 * exception bubbles out of the page tree (e.g. data parse failure on a
 * Zod throw), Next.js renders this component with the caught error and
 * a `reset()` callback. We surface the same `<ErrorOverlay>` the
 * orchestrator uses for recoverable load errors — single visual
 * vocabulary for "something went wrong, please retry".
 *
 * `reset()` re-attempts to render the page tree without a full reload —
 * cheaper than `window.location.reload()`, and our orchestrator will
 * re-run on the fresh mount.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled page error:", error);
  }, [error]);

  return <ErrorOverlay onRetry={reset} message={error.message || undefined} />;
}
