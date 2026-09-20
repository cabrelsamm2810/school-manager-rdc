import { RegisterForm } from '@/components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <main className="login-background flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-3xl rounded-3xl bg-white/95 p-8 shadow-soft backdrop-blur-sm">
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-blue-600">School Manager RDC</p>
          <h1 className="mt-4 text-3xl font-bold text-slate-900">Créer un compte</h1>
        </div>

        <RegisterForm />

        <p className="mt-6 text-center text-sm text-slate-600">
          Vous avez déjà un compte ?{' '}
          <a href="/login" className="font-medium text-blue-600 hover:underline">Se connecter</a>
        </p>
      </div>
    </main>
  );
}
