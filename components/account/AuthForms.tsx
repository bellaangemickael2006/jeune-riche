"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const CONFIG_MISSING =
  !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default function AuthForms() {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (CONFIG_MISSING) {
      setError("Supabase n'est pas encore configuré.");
      setLoading(false);
      return;
    }

    const supabase = createClient();

    if (mode === "forgot") {
      // Passe par notre API (lib/email.ts) pour envoyer un email au design
      // JEUNE RICHE plutôt que le template Supabase par défaut. Message
      // toujours identique, que l'email existe ou non : ne jamais laisser
      // deviner si une adresse est inscrite ou pas.
      await fetch("/api/account/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setMessage("Si un compte existe avec cet email, un lien de réinitialisation vient d'être envoyé.");
      setLoading(false);
      return;
    }

    if (mode === "signup") {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }
      if (data.user) {
        await fetch("/api/account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ supabaseId: data.user.id, email, name }),
        });
      }
      setMessage("Compte créé. Vérifiez votre email pour confirmer votre inscription si nécessaire.");
      setLoading(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError("Identifiants invalides.");
      setLoading(false);
      return;
    }
    router.refresh();
  }

  // La carte bordée centrée au milieu de la page a été retirée : c'est
  // exactement le composant que la direction artistique interdit, et le crest
  // posé au-dessus du titre transformait le blason en vignette d'écran de
  // connexion. Même composition que le reste du site : rail en haut, axe à
  // gauche, mesure étroite, vide tenu à droite.
  return (
    <div className="w-full">
      <div className="border-b border-line pb-4">
        <p className="text-label text-paper/40">Compte</p>
      </div>

      <div className="max-w-sm pt-16 md:pt-20">
        <h1 className="font-editorial text-heading-lg leading-[1.05] text-paper">
          {mode === "login"
            ? "Bon retour"
            : mode === "signup"
              ? "Créer un compte"
              : "Mot de passe oublié"}
        </h1>
        <p className="mt-4 text-body text-paper/45">
          {mode === "login"
            ? "Accédez à votre compte et à vos commandes."
            : mode === "signup"
              ? "Vos commandes et vos adresses, conservées."
              : "Recevez un lien pour en choisir un nouveau."}
        </p>

      {mode === "forgot" ? (
        <button
          onClick={() => {
            setMode("login");
            setError(null);
            setMessage(null);
          }}
          className="mt-8 text-label text-paper/50 underline underline-offset-4 hover:text-paper"
        >
          ← Retour à la connexion
        </button>
      ) : (
        <div className="mt-8 flex gap-6 border-b border-line text-label">
          <button
            onClick={() => setMode("login")}
            className={cn("pb-3 transition-colors", mode === "login" ? "border-b border-paper text-paper" : "text-paper/40 hover:text-paper/70")}
          >
            Connexion
          </button>
          <button
            onClick={() => setMode("signup")}
            className={cn("pb-3 transition-colors", mode === "signup" ? "border-b border-paper text-paper" : "text-paper/40 hover:text-paper/70")}
          >
            Créer un compte
          </button>
        </div>
      )}

      {CONFIG_MISSING && (
        <p className="mb-4 mt-4 border border-paper/30 bg-paper/5 px-3 py-2 text-caption text-paper">
          Supabase n&apos;est pas encore configuré — la connexion sera disponible une fois
          NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY renseignés.
        </p>
      )}
      {error && <p className="mb-4 mt-4 text-caption font-medium text-paper">{error}</p>}
      {message && <p className="mb-4 mt-4 text-caption text-paper/70">{message}</p>}

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        {mode === "signup" && (
          <label className="block">
            <span className="mb-2 block text-label text-paper/50">Nom</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border border-line bg-transparent px-4 py-3 text-body text-paper focus:border-paper focus:outline-none"
            />
          </label>
        )}
        <label className="block">
          <span className="mb-2 block text-label text-paper/50">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-line bg-transparent px-4 py-3 text-body text-paper focus:border-paper focus:outline-none"
          />
        </label>
        {mode !== "forgot" && (
          <label className="block">
            <span className="mb-2 block text-label text-paper/50">Mot de passe</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full border border-line bg-transparent px-4 py-3 text-body text-paper focus:border-paper focus:outline-none"
            />
          </label>
        )}
        {mode === "login" && (
          <button
            type="button"
            onClick={() => {
              setMode("forgot");
              setError(null);
              setMessage(null);
            }}
            className="-mt-2 w-fit text-caption text-paper/40 underline underline-offset-4 hover:text-paper/70"
          >
            Mot de passe oublié ?
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="mt-2 bg-paper py-3 text-label text-ink transition-colors duration-300 ease-editorial hover:bg-studio disabled:opacity-50"
        >
          {loading
            ? "…"
            : mode === "login"
              ? "Se connecter"
              : mode === "signup"
                ? "Créer mon compte"
                : "Envoyer le lien"}
        </button>
        </form>
      </div>
    </div>
  );
}
