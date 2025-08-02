"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { verifyEmail } from "@/lib/auth-client";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      if (error === 'invalid_token') {
        setStatus('expired');
        setMessage('Le lien de vérification est invalide ou a expiré.');
      } else {
        setStatus('error');
        setMessage('Une erreur est survenue lors de la vérification.');
      }
      return;
    }

    if (!token) {
      setStatus('error');
      setMessage('Token de vérification manquant.');
      return;
    }

    // Vérifier l'email avec le token
    verifyEmail({
      query: { token }
    }).then((res) => {
      if (res.error) {
        setStatus('error');
        setMessage('Erreur lors de la vérification de l\'email.');
      } else {
        setStatus('success');
        setMessage('Votre email a été vérifié avec succès ! Vous allez être redirigé...');
        // Redirection après 2 secondes
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      }
    }).catch(() => {
      setStatus('error');
      setMessage('Erreur lors de la vérification de l\'email.');
    });
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className={`mx-auto h-16 w-16 rounded-full flex items-center justify-center shadow-lg ${
            status === 'success' ? 'bg-green-600' :
            status === 'error' || status === 'expired' ? 'bg-red-600' :
            'bg-blue-600'
          }`}>
            {status === 'loading' && (
              <svg className="animate-spin h-8 w-8 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {status === 'success' && (
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {(status === 'error' || status === 'expired') && (
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            {status === 'loading' && 'Vérification en cours...'}
            {status === 'success' && 'Email vérifié !'}
            {status === 'error' && 'Erreur de vérification'}
            {status === 'expired' && 'Lien expiré'}
          </h2>
          
          <p className="mt-2 text-sm text-gray-600">
            {message}
          </p>
        </div>

        {status !== 'loading' && status !== 'success' && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="text-center space-y-4">
              <p className="text-gray-700">
                Vous pouvez demander un nouvel email de vérification depuis la page de connexion.
              </p>
              <button
                onClick={() => router.push('/sign-in')}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
              >
                Retour à la connexion
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}