import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <main className="login-background relative flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl border border-white/20 bg-white/95 p-8 shadow-soft backdrop-blur-sm">
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-blue-600">School Manager RDC</p>
          <h1 className="mt-4 text-3xl font-bold text-slate-900">Connexion</h1>
        </div>

        <LoginForm />

        <p className="mt-6 text-center text-sm text-slate-600">
          Vous n’avez pas de compte ?{' '}
          <a href="/register" className="font-medium text-blue-600 hover:underline">Créer un compte</a>
        </p>
      </div>
    </main>
  );
}
