"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, FormEvent, useEffect } from "react";
import { signIn } from "@/lib/auth-client";
import { withRedirectIfAuth } from "@/components/withAuth";

function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (searchParams.get('blocked') === 'true') {
      setError("Votre compte a été bloqué par un administrateur. Contactez l'administration pour plus d'informations.");
    }
  }, [searchParams]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await signIn.email({
      email: String(fd.get("email") || ""),
      password: String(fd.get("password") || "")
    });
    if (res.error) {
      setError("Identifiants invalides");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div className="max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Se connecter</h1>
      {error && <p className="text-red-600">{error}</p>}
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block mb-1">Email</label>
          <input name="email" type="email" required />
        </div>
        <div>
          <label className="block mb-1">Mot de passe</label>
          <input name="password" type="password" required />
        </div>
        <button className="bg-blue-600 text-white">Connexion</button>
      </form>
      <p>Pas de compte ? <a href="/sign-up">Créer un compte</a></p>
    </div>
  );
}

export default withRedirectIfAuth(SignInPage);
