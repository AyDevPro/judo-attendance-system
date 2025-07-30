"use client";
import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";
import { signUp } from "@/lib/auth-client";
import { withRedirectIfAuth } from "@/components/withAuth";

function SignUpPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await signUp.email({
      name: String(fd.get("name") || ""),
      email: String(fd.get("email") || ""),
      password: String(fd.get("password") || "")
    });
    if (res.error) {
      setError(res.error.message || "Échec de l'inscription");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div className="max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Créer un compte</h1>
      {error && <p className="text-red-600">{error}</p>}
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block mb-1">Nom</label>
          <input name="name" required />
        </div>
        <div>
          <label className="block mb-1">Email</label>
          <input name="email" type="email" required />
        </div>
        <div>
          <label className="block mb-1">Mot de passe</label>
          <input name="password" type="password" required />
        </div>
        <button className="bg-blue-600 text-white">S'inscrire</button>
      </form>
      <p>Déjà un compte ? <a href="/sign-in">Se connecter</a></p>
    </div>
  );
}

export default withRedirectIfAuth(SignUpPage);
