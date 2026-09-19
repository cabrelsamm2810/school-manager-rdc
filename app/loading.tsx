export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="rounded-3xl bg-white p-10 text-center shadow-soft">
        <p className="text-sm uppercase tracking-[0.2em] text-blue-600">404</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Page introuvable</h1>
        <p className="mt-2 text-slate-600">Cette route n’existe pas ou n’est pas encore activée.</p>
      </div>
    </main>
  );
}
