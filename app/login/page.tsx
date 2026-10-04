import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <main className="login-background flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl bg-white/95 p-8 shadow-soft backdrop-blur-sm">
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-blue-600">School Manager RDC</p>
          <h1 className="mt-4 text-3xl font-bold text-slate-900">Connexion</h1>
        </div>

        <LoginForm />

        <div className="mt-6 flex flex-col items-center gap-3">
          <p className="text-sm text-slate-600">Vous n'avez pas de compte ?</p>
          <a href="/register" className="btn-secondary-light w-full px-4 py-2.5 text-sm">
            Créer un compte
          </a>
        </div>
      </div>
    </main>
  );
}
