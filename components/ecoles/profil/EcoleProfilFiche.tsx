'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { PROVINCE_NAMES, PROVINCES_EDUC_BY_ADMIN } from '@/lib/provinces-rdc';
import { INSTITUTION_MAP } from '@/lib/institutions';
import {
  profilInputClass,
  profilLabelClass,
  profilLabelFieldClass,
  profilSectionClass,
  profilValueClass,
  type EcoleProfilData,
} from '@/components/ecoles/profil/types';

type FormState = {
  nom: string;
  type: string;
  dinacope: string;
  province: string;
  provinceEducationnelle: string;
  ville: string;
  commune: string;
  adresse: string;
  telephone: string;
  email: string;
  chefEcole: string;
  effectif: string;
  logoUrl: string;
  chefUserId: string;
};

type ChefOption = { id: string; nom: string; postNom: string; prenom: string; email: string };

function toForm(data: EcoleProfilData): FormState {
  return {
    nom: data.ecole.nom,
    type: data.ecole.type,
    dinacope: data.ecole.dinacope,
    province: data.ecole.province,
    provinceEducationnelle: data.ecole.provinceEducationnelle,
    ville: data.ecole.ville,
    commune: data.ecole.commune,
    adresse: data.ecole.adresse,
    telephone: data.ecole.telephone,
    email: data.ecole.email,
    chefEcole: data.ecole.chefEcole,
    effectif: String(data.ecole.effectif ?? 0),
    logoUrl: data.ecole.logoUrl ?? '',
    chefUserId: data.profil.chefUserId ?? '',
  };
}

/** Fiche administrative de l'école : consultation et modification. */
export function EcoleProfilFiche({ data, onSaved }: { data: EcoleProfilData; onSaved: () => void }) {
  const { ecole, chef, permissions } = data;
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormState>(() => toForm(data));
  const [chefs, setChefs] = useState<ChefOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const inst = INSTITUTION_MAP[ecole.institution];

  useEffect(() => {
    setForm(toForm(data));
  }, [data]);

  useEffect(() => {
    if (!editing || !permissions.canEdit) return;
    fetch(`/api/ecole-profil/chefs?ecoleId=${encodeURIComponent(ecole.id)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => setChefs(json?.chefs ?? []))
      .catch(() => setChefs([]));
  }, [editing, permissions.canEdit, ecole.id]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/ecole-profil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ecoleId: ecole.id,
          nom: form.nom,
          type: form.type,
          dinacope: form.dinacope,
          province: form.province,
          provinceEducationnelle: form.provinceEducationnelle,
          ville: form.ville,
          commune: form.commune,
          adresse: form.adresse,
          telephone: form.telephone,
          email: form.email,
          chefEcole: form.chefEcole,
          effectif: Number(form.effectif || 0),
          logoUrl: form.logoUrl || null,
          chefUserId: form.chefUserId || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Enregistrement impossible.');
      } else {
        setEditing(false);
        onSaved();
      }
    } catch {
      setError('Impossible de joindre le serveur.');
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setForm(toForm(data));
    setError('');
    setEditing(false);
  }

  const provincesEduc = PROVINCES_EDUC_BY_ADMIN[form.province] ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-slate-900">Fiche administrative</h2>
        {permissions.canEdit && !editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-brand-700"
          >
            <Icon name="edit" className="h-3.5 w-3.5" />
            Modifier
          </button>
        )}
        {!permissions.canEdit && (
          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
            Consultation seule
          </span>
        )}
      </div>

      {editing ? (
        <div className="space-y-4">
          <div className={profilSectionClass}>
            <h3 className="mb-3 text-sm font-bold text-slate-900">Identification</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={profilLabelFieldClass}>Nom officiel <span className="text-red-500">*</span></label>
                <input className={profilInputClass} value={form.nom} onChange={(e) => set('nom', e.target.value)} />
              </div>
              <div>
                <label className={profilLabelFieldClass}>Type d’établissement</label>
                <input className={profilInputClass} value={form.type} onChange={(e) => set('type', e.target.value)} />
              </div>
              <div>
                <label className={profilLabelFieldClass}>DINACOPE</label>
                <input className={profilInputClass} value={form.dinacope} onChange={(e) => set('dinacope', e.target.value)} />
              </div>
              <div>
                <label className={profilLabelFieldClass}>Effectif</label>
                <input
                  type="number"
                  min={0}
                  className={profilInputClass}
                  value={form.effectif}
                  onChange={(e) => set('effectif', e.target.value)}
                />
              </div>
              <div>
                <label className={profilLabelFieldClass}>Logo (URL)</label>
                <input className={profilInputClass} value={form.logoUrl} onChange={(e) => set('logoUrl', e.target.value)} placeholder="https://…" />
              </div>
            </div>
          </div>

          <div className={profilSectionClass}>
            <h3 className="mb-3 text-sm font-bold text-slate-900">Localisation</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={profilLabelFieldClass}>Province administrative</label>
                <select
                  className={profilInputClass}
                  value={form.province}
                  onChange={(e) => {
                    set('province', e.target.value);
                    set('provinceEducationnelle', '');
                  }}
                >
                  <option value="">— Choisir —</option>
                  {PROVINCE_NAMES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={profilLabelFieldClass}>Province éducationnelle</label>
                <select
                  className={profilInputClass}
                  value={form.provinceEducationnelle}
                  onChange={(e) => set('provinceEducationnelle', e.target.value)}
                  disabled={provincesEduc.length === 0}
                >
                  <option value="">— Choisir —</option>
                  {provincesEduc.map((p) => (
                    <option key={p.nom} value={p.nom}>{p.nom}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={profilLabelFieldClass}>Ville</label>
                <input className={profilInputClass} value={form.ville} onChange={(e) => set('ville', e.target.value)} />
              </div>
              <div>
                <label className={profilLabelFieldClass}>Commune</label>
                <input className={profilInputClass} value={form.commune} onChange={(e) => set('commune', e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className={profilLabelFieldClass}>Adresse</label>
                <textarea
                  rows={2}
                  className={profilInputClass}
                  value={form.adresse}
                  onChange={(e) => set('adresse', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className={profilSectionClass}>
            <h3 className="mb-3 text-sm font-bold text-slate-900">Contact</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={profilLabelFieldClass}>Téléphone</label>
                <input className={profilInputClass} value={form.telephone} onChange={(e) => set('telephone', e.target.value)} />
              </div>
              <div>
                <label className={profilLabelFieldClass}>Email</label>
                <input type="email" className={profilInputClass} value={form.email} onChange={(e) => set('email', e.target.value)} />
              </div>
            </div>
          </div>

          <div className={profilSectionClass}>
            <h3 className="mb-3 text-sm font-bold text-slate-900">Direction</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={profilLabelFieldClass}>Chef d’établissement (nom affiché)</label>
                <input className={profilInputClass} value={form.chefEcole} onChange={(e) => set('chefEcole', e.target.value)} />
              </div>
              <div>
                <label className={profilLabelFieldClass}>Compte associé</label>
                <select
                  className={profilInputClass}
                  value={form.chefUserId}
                  onChange={(e) => set('chefUserId', e.target.value)}
                >
                  <option value="">— Aucun compte associé —</option>
                  {chefs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {[c.nom, c.postNom, c.prenom].filter(Boolean).join(' ')} · {c.email}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-slate-400">Un chef ne peut être rattaché qu’à une seule école.</p>
              </div>
            </div>
          </div>

          {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={cancel}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
            >
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className={profilSectionClass}>
            <h3 className="mb-3 text-sm font-bold text-slate-900">Identification</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Nom officiel" value={ecole.nom} />
              <Field label="Type" value={ecole.type || '—'} />
              <Field label="Institution" value={inst?.label || ecole.institution} />
              <Field label="DINACOPE" value={ecole.dinacope || '—'} />
              <Field label="Identifiant School Manager" value={ecole.identifiantSM || '—'} />
              <Field label="Effectif déclaré" value={ecole.effectif.toLocaleString('fr-FR')} />
              <Field label="Statut administratif" value={ecole.statut || '—'} />
              <Field label="Validation" value={ecole.statutValidation || '—'} />
            </div>
          </div>

          <div className={profilSectionClass}>
            <h3 className="mb-3 text-sm font-bold text-slate-900">Localisation</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Province administrative" value={ecole.province || '—'} />
              <Field label="Province éducationnelle" value={ecole.provinceEducationnelle || '—'} />
              <Field label="Ville" value={ecole.ville || '—'} />
              <Field label="Commune" value={ecole.commune || '—'} />
              <Field label="Adresse" value={ecole.adresse || '—'} className="sm:col-span-2" />
              <Field
                label="Structure de rattachement"
                value={ecole.coordSousProvinciale?.nom || ecole.ecErc?.nom || '—'}
              />
            </div>
          </div>

          <div className={profilSectionClass}>
            <h3 className="mb-3 text-sm font-bold text-slate-900">Contact</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Téléphone" value={ecole.telephone || '—'} />
              <Field label="Email" value={ecole.email || '—'} />
            </div>
          </div>

          <div className={profilSectionClass}>
            <h3 className="mb-3 text-sm font-bold text-slate-900">Direction</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Chef d’établissement" value={ecole.chefEcole || '—'} />
              <div>
                <p className={profilLabelClass}>Compte associé</p>
                {chef ? (
                  <div className="mt-1.5 flex items-center gap-2.5">
                    {chef.profilePhotoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={chef.profilePhotoUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
                    ) : (
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">
                        {chef.prenom?.[0]?.toUpperCase()}
                        {chef.nom?.[0]?.toUpperCase()}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {[chef.nom, chef.postNom, chef.prenom].filter(Boolean).join(' ')}
                      </p>
                      <p className="truncate text-xs text-slate-500">{chef.email}</p>
                    </div>
                  </div>
                ) : (
                  <p className={`${profilValueClass} text-slate-500`}>Aucun compte associé</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <p className={profilLabelClass}>{label}</p>
      <p className={profilValueClass}>{value}</p>
    </div>
  );
}
