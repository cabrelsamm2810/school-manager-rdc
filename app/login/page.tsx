import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <main className="login-page relative flex min-h-screen flex-col overflow-x-hidden">
      {/* Logo en arrière-plan */}
      <div
        className="login-bg-logo pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'url(/logo.png)',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundSize: 'contain',
        }}
      />
      {/* Voile de contraste */}
      <div className="login-bg-veil pointer-events-none absolute inset-0" />

      {/* Contenu */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-5 py-10">
        {/* Logo */}
        <div className="login-logo-wrap">
          <div className="login-logo-box">
            <img src="/logo.png" alt="School Manager RDC" className="h-full w-full object-contain" />
          </div>
        </div>

        {/* Titre */}
        <div className="login-title-area">
          <p className="login-eyebrow">School Manager RDC</p>
          <h1 className="login-title">Connexion</h1>
          <p className="login-subtitle">Accédez à votre espace de gestion scolaire</p>
        </div>

        {/* Carte formulaire */}
        <div className="login-card">
          <LoginForm />
        </div>

        {/* Bouton secondaire */}
        <div className="login-secondary-area">
          <p className="login-secondary-text">Vous n'avez pas de compte ?</p>
          <a href="/register" className="login-btn-secondary">
            Créer un compte
          </a>
        </div>
      </div>
    </main>
  );
}
