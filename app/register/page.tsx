import { RegisterLayout } from '@/components/auth/RegisterLayout';

export default function RegisterPage() {
  return (
    <main className="register-bg flex min-h-screen items-start justify-center overflow-y-auto p-4 sm:items-center sm:p-6">
      <div className="reg-card-in relative z-10 w-full max-w-3xl">
        {/* Branding header */}
        <div className="reg-header-in mb-5 flex flex-col items-center text-center">
          {/* Le logo officiel est présenté tel quel : aucun cadre n'est ajouté par l'application. */}
          <img src="/logo.png" alt="School Manager RDC" className="mb-3 h-16 w-16 object-contain" />
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-200">School Manager RDC</p>
          <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Créer un compte</h1>
          <p className="mt-2 max-w-md text-sm text-slate-300">Rejoignez School Manager RDC et accédez à votre espace numérique.</p>
          <p className="mt-1 text-xs text-slate-400">Une plateforme numérique dédiée à la gestion scolaire en RDC.</p>
        </div>

        {/* Main card with illustration + form */}
        <div className="register-card rounded-[2rem] p-5 sm:p-8">
          <RegisterLayout />

          <p className="mt-6 text-center text-sm text-slate-600">
            Vous avez déjà un compte ?{' '}
            <a href="/login" className="font-semibold text-blue-600 hover:underline">Se connecter</a>
          </p>
        </div>
      </div>
    </main>
  );
}
