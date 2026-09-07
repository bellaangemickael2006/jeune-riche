"use client";

import type { ButtonHTMLAttributes } from "react";

// Bouton de soumission qui demande une confirmation native avant de laisser
// partir le formulaire — pour les actions destructives (suppression) qui
// n'avaient jusqu'ici aucun garde-fou contre un clic accidentel.
export default function ConfirmButton({
  confirmMessage,
  onClick,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { confirmMessage: string }) {
  return (
    <button
      {...props}
      onClick={(e) => {
        if (!window.confirm(confirmMessage)) {
          e.preventDefault();
          return;
        }
        onClick?.(e);
      }}
    />
  );
}
