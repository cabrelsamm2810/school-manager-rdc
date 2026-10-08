'use client';

import { FormEvent, Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resendMsg, setResendMsg] = useState('');
  const [resending, setResending] = useState(false);

  async function handleResend() {
    setResendMsg('');
    setResending(true);
    try {
      const response = await fetch('/api/auth/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      if (!response.ok) {
        setResendMsg(result.error ?? 'Impossible de renvoyer le code.');
      } else {
        setResendMsg('Un nouveau code a été envoyé à votre adresse email.');
      }
    } catch {
      setResendMsg('Impossible de joindre le serveur.');
    } finally {
      setResending(false);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    if (code.length !== 6) {
      setError('Le code doit contenir 6 chiffres.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error ?? 'Code de validation incorrect.');
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch {
      setError('Impossible de joindre le serveur.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-background flex min-h-screen items-start justify-center overflow-y-auto p-4 sm:items-center sm:p-6">
      <div className="w-full max-w-md rounded-3xl bg-white/95 p-6 shadow-soft backdrop-blur-sm sm:p-8">
        <div className="mb-6 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-blue-600">School Manager RDC</p>
          <h1 className="mt-3 text-2xl font-bold text-slate-900">Validation du compte</h1>
        </div>

        {success ? (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-slate-900">Compte validé !</p>
            <p className="text-sm text-slate-600">Redirection vers la page de connexion…</p>
          </div>
        ) : (
          <>
            <div className="mb-6 rounded-2xl bg-blue-50 p-4 text-center">
              <p className="text-sm text-slate-600">
                Un code de validation à 6 chiffres a été envoyé à :
              </p>
              <p className="mt-1 font-semibold text-blue-700">{email}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Code de validation *</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  className="w-full rounded-xl border border-slate-300 px-3 py-3 text-center text-2xl font-bold tracking-[0.5em] text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  required
                  autoFocus
                />
              </div>

              {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className={`btn-primary w-full px-5 py-3 text-sm ${loading ? 'btn-loading' : ''}`}
              >
                {loading ? (<><span className="btn-spinner" /> Validation…</>) : 'Valider mon compte'}
              </button>
            </form>

            <div className="mt-6 space-y-2 text-center">
              {resendMsg && (
                <p className={`text-sm ${resendMsg.includes('impossible') || resendMsg.includes('Impossible') ? 'text-red-600' : 'text-green-600'}`}>
                  {resendMsg}
                </p>
              )}
              <p className="text-sm text-slate-600">
                Vous n'avez pas reçu le code ?{' '}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="font-medium text-blue-600 hover:underline disabled:opacity-50"
                >
                  {resending ? 'Envoi en cours…' : 'Renvoyer le code'}
                </button>
              </p>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><p className="text-slate-400">Chargement…</p></div>}>
      <VerifyForm />
    </Suspense>
  );
}
