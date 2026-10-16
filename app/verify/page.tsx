'use client';

import { FormEvent, Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get('email') || '';
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resendMsg, setResendMsg] = useState('');
  const [resending, setResending] = useState(false);

  useEffect(() => {
    setEmail(initialEmail);
    setCode('');
    setError('');
    setResendMsg('');
  }, [initialEmail]);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => router.push('/login'), 2000);
    return () => clearTimeout(timer);
  }, [success, router]);

  function validEmail() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Saisissez l’adresse email utilisée lors de votre inscription.');
      return false;
    }
    return true;
  }

  async function handleResend() {
    setError('');
    setResendMsg('');
    if (!validEmail()) return;
    setResending(true);
    try {
      const response = await fetch('/api/auth/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error ?? 'Impossible de renvoyer le code.');
      } else {
        setResendMsg('Le code de validation a été renvoyé à votre adresse email.');
      }
    } catch {
      setError('Impossible de joindre le serveur. Réessayez.');
    } finally {
      setResending(false);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setResendMsg('');
    if (!validEmail()) return;
    if (!/^\d{6}$/.test(code)) {
      setError('Le code doit contenir 6 chiffres.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error ?? 'Code de validation incorrect.');
        return;
      }
      setSuccess(true);
    } catch {
      setError('Impossible de joindre le serveur. Réessayez.');
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
          <div className="space-y-4 text-center" role="status">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-slate-900">Compte validé !</p>
            <p className="text-sm text-slate-600">Redirection vers la page de connexion…</p>
            <Link href="/login" className="inline-block font-medium text-blue-600 hover:underline">Se connecter</Link>
          </div>
        ) : (
          <>
            <div className="mb-6 rounded-2xl bg-blue-50 p-4 text-center">
              <p className="text-sm text-slate-600">Saisissez votre email d’inscription et le code à 6 chiffres reçu par email pour activer votre compte.</p>
              <p className="mt-2 text-xs text-slate-500">Vérifiez également votre dossier spam ou courriers indésirables.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label htmlFor="activation-email" className="mb-1.5 block text-sm font-medium text-slate-700">Email d’inscription *</label>
                <input
                  id="activation-email"
                  type="email"
                  autoComplete="email"
                  className="w-full rounded-xl border border-slate-300 px-3 py-3 text-base text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setCode(''); setError(''); setResendMsg(''); }}
                  placeholder="votre@email.com"
                  required
                  readOnly={loading || resending}
                />
              </div>
              <div>
                <label htmlFor="activation-code" className="mb-1.5 block text-sm font-medium text-slate-700">Code de validation *</label>
                <input
                  id="activation-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  className="w-full rounded-xl border border-slate-300 px-3 py-3 text-center text-2xl font-bold tracking-[0.3em] text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  required
                  readOnly={loading || resending}
                  aria-describedby={error ? 'activation-error' : undefined}
                />
              </div>

              {error && <p id="activation-error" role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

              <button
                type="submit"
                disabled={loading || resending || code.length !== 6}
                className={`btn-primary w-full px-5 py-3 text-sm ${loading ? 'btn-loading' : ''}`}
              >
                {loading ? (<><span className="btn-spinner" /> Validation…</>) : 'Valider mon compte'}
              </button>
            </form>

            <div className="mt-6 space-y-3 text-center">
              {resendMsg && <p role="status" className="text-sm text-green-700">{resendMsg}</p>}
              <p className="text-sm text-slate-600">
                Vous n’avez pas reçu le code ?{' '}
                <button type="button" onClick={handleResend} disabled={resending || loading} className="font-medium text-blue-600 hover:underline disabled:opacity-50">
                  {resending ? 'Envoi en cours…' : 'Renvoyer le code'}
                </button>
              </p>
              <Link href="/login" className="inline-block text-sm font-medium text-blue-600 hover:underline">Retour à la connexion</Link>
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
