'use client';

/**
 * Carte de branding EC-ERC : logo officiel centré avec le libellé complet
 * « Écoles Conventionnées des Églises du Réveil du Congo » en dessous.
 */
export function EcErcBrandingCard() {
  return (
    <section className="mb-3 flex flex-col items-center rounded-2xl border border-slate-200 bg-white px-4 py-5 shadow-sm">
      <img
        src="/illustrations/ec-erc-logo.jpg"
        alt="Logo EC-ERC"
        className="h-20 w-20 rounded-xl object-contain"
      />
      <p className="mt-3 text-sm font-bold tracking-wide text-slate-900">EC-ERC</p>
      <p className="mt-0.5 text-center text-[11px] font-medium leading-snug text-slate-500">
        Écoles Conventionnées des Églises du Réveil du Congo
      </p>
    </section>
  );
}
