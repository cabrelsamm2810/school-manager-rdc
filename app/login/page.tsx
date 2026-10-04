import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <main className="login-background flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-[2.5rem] bg-white/95 p-8 shadow-soft backdrop-blur-sm">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-slate-200">
            <img src="/logo.png" alt="School Manager RDC" className="h-full w-full object-contain" />
          </div>
          <p className="text-sm uppercase tracking-[0.2em] text-blue-600">School Manager RDC</p>
          <h1 className="mt-3 text-2xl font-bold text-slate-900">Connexion</h1>
        </div>

        <LoginForm />

        <div className="mt-6 flex flex-col items-center gap-3">
          <p className="text-sm text-slate-600">Vous n'avez pas de compte ?</p>
          <a href="/register" className="btn-secondary-light w-full px-4 py-2.5 text-sm" style={{ borderRadius: '9999px' }}>
            Créer un compte
          </a>
        </div>
      </div>
    </main>
  );
}
