import type { ActionResult } from "@/lib/types";

// Renders the error (or nothing) returned from a server action.
export function FormError({ state }: { state: ActionResult | null }) {
  if (!state || state.ok) return null;
  return (
    <p role="alert" className="text-sm text-destructive">
      {state.error}
    </p>
  );
}
