"use client";
import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";
import { signUp } from "@/lib/auth-client";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function SignUpPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    const fd = new FormData(e.currentTarget);
    const res = await signUp.email({
      name: String(fd.get("name") || ""),
      email: String(fd.get("email") || ""),
      password: String(fd.get("password") || "")
    });
    
    if (res.error) {
      setError(res.error.message || "Échec de l'inscription");
      setLoading(false);
      return;
    }
    
    router.push("/dashboard");
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center">
        Créer un compte
      </h1>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
          <input 
            name="name"
            type="text" 
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Votre nom"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input 
            name="email"
            type="email" 
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="votre@email.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe</label>
          <input 
            name="password"
            type="password" 
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="••••••••"
          />
        </div>
        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {loading ? "Inscription..." : "Créer mon compte"}
        </button>
      </form>
      
      <p className="text-center mt-4 text-sm text-gray-600">
        Déjà un compte ? 
        <a href="/sign-in" className="text-blue-600 hover:underline ml-1">Se connecter</a>
      </p>
    </div>
  );
}