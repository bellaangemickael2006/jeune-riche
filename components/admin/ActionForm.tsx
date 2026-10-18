"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import type { ActionResult } from "@/lib/actions/result";
import { cn } from "@/lib/utils";

type Props = {
  action: (formData: FormData) => Promise<ActionResult | void>;
  children: ReactNode;
  className?: string;
  /** Vide les champs après un succès (formulaires de création). */
  resetOnSuccess?: boolean;
};

// Formulaire admin qui affiche le résultat d'une server action : message
// d'erreur lisible en cas d'échec, confirmation courte en cas de succès.
export default function ActionForm({ action, children, className, resetOnSuccess }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    async (_prev, formData) => (await action(formData)) ?? { ok: true },
    null
  );

  useEffect(() => {
    if (state?.ok && resetOnSuccess) formRef.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <form ref={formRef} action={formAction} className={className}>
      {children}
      {state && !state.ok && (
        <p role="alert" className="col-span-full basis-full border border-paper/30 bg-paper/5 px-3 py-2 text-xs text-paper">
          {state.error}
        </p>
      )}
      {state?.ok && state.message && (
        <p role="status" className="col-span-full basis-full text-xs text-paper/60">
          {state.message}
        </p>
      )}
    </form>
  );
}

/** Bouton de soumission qui se désactive pendant l'envoi. */
export function SubmitButton({
  children,
  pendingLabel = "…",
  className,
}: {
  children: ReactNode;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={cn("disabled:opacity-50", className)}>
      {pending ? pendingLabel : children}
    </button>
  );
}
