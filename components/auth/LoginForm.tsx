'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { getRoleDestination } from '@/lib/role-destination';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const result = await response.json();

      if (!response.ok) {
        if (result.needsValidation) {
          router.push(`/verify?email=${encodeURIComponent(email.trim().toLowerCase())}`);
          return;
        }
        setError(result.error ?? 'Identifiants incorrects.');
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(getRoleDestination(result.user?.role));
        router.refresh();
      }, 600);
    } catch {
      setError('Impossible de joindre le serveur.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* Email / Identifiant */}
      <div>
        <label htmlFor="email" className="login-label">Adresse e-mail ou identifiant</label>
        <div className="login-input-wrap">
          <span className="login-input-icon">
            <Icon name="user" className="h-[18px] w-[18px]" />
          </span>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="exemple@schoolmanager.rdc"
            className="login-input"
          />
        </div>
      </div>

      {/* Mot de passe */}
      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="login-label">Mot de passe</label>
          <a href="/forgot-password" className="login-link">Mot de passe oublié ?</a>
        </div>
        <div className="login-input-wrap">
          <span className="login-input-icon">
            <Icon name="lock" className="h-[18px] w-[18px]" />
          </span>
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="login-input pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="login-eye-btn"
            aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            tabIndex={-1}
          >
            <Icon name={showPassword ? 'eye-off' : 'eye'} className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="login-error" role="alert">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Succès */}
      {success && (
        <div className="login-success" role="status">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          <span>Connexion réussie — redirection en cours…</span>
        </div>
      )}

      {/* Bouton principal */}
      <button
        type="submit"
        disabled={loading || success}
        className={`login-btn-primary ${(loading || success) ? 'login-btn-loading' : ''}`}
      >
        {loading ? (
          <>
            <span className="btn-spinner" />
            <span>Connexion en cours…</span>
          </>
        ) : success ? (
          <>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            <span>Connexion réussie</span>
          </>
        ) : (
          <span>Se connecter</span>
        )}
      </button>

      <Link
        href={`/verify${email.trim() ? `?email=${encodeURIComponent(email.trim().toLowerCase())}` : ''}`}
        className="login-link block text-center"
      >
        Activer mon compte
      </Link>
    </form>
  );
}
