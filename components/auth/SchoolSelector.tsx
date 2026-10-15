'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export type SchoolOption = {
  id: string;
  nom: string;
  dinacope: string;
  province: string;
  commune: string;
  type: string;
  adresse: string;
};

type SchoolSelectorProps = {
  institution: string;
  province?: string;
  value: string; // ecoleId
  onChange: (ecoleId: string, ecoleNom: string) => void;
  required?: boolean;
  label?: string;
};

export function SchoolSelector({
  institution,
  province,
  value,
  onChange,
  required = false,
  label = 'Sélectionner une école',
}: SchoolSelectorProps) {
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = schools.find((s) => s.id === value);

  const fetchSchools = useCallback(async () => {
    if (!institution) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ institution });
      if (province) params.set('province', province);
      if (search.trim()) params.set('search', search.trim());
      const res = await fetch(`/api/ecoles/public?${params.toString()}`);
      const data = await res.json();
      setSchools(data.ecoles ?? []);
    } catch {
      setSchools([]);
    } finally {
      setLoading(false);
    }
  }, [institution, province, search]);

  // Debounced fetch
  useEffect(() => {
    const timer = setTimeout(fetchSchools, 250);
    return () => clearTimeout(timer);
  }, [fetchSchools]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleSelect(school: SchoolOption) {
    onChange(school.id, school.nom);
    setOpen(false);
    setSearch('');
  }

  const inputClass = 'reg-field';

  return (
    <div ref={containerRef} className="relative">
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {selected ? (
        <div className="flex items-center justify-between gap-2 rounded-xl border-2 border-blue-500 bg-blue-50/50 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-900">{selected.nom}</p>
            <p className="truncate text-xs text-slate-500">
              {selected.commune && `${selected.commune} · `}
              {selected.dinacope && `DINACOPE: ${selected.dinacope}`}
              {!selected.commune && !selected.dinacope && selected.province}
            </p>
          </div>
          <button
            type="button"
            onClick={() => { onChange('', ''); setOpen(true); }}
            className="shrink-0 text-xs font-medium text-blue-600 hover:underline"
          >
            Changer
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            type="text"
            className={inputClass}
            placeholder="Rechercher une école par nom, commune ou DINACOPE…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
          />
          {open && (
            <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
              {loading ? (
                <div className="px-4 py-3 text-sm text-slate-400">Chargement…</div>
              ) : schools.length === 0 ? (
                <div className="px-4 py-3 text-sm text-slate-400">
                  {search ? 'Aucune école trouvée.' : 'Commencez à taper pour rechercher.'}
                </div>
              ) : (
                schools.map((school) => (
                  <button
                    key={school.id}
                    type="button"
                    onClick={() => handleSelect(school)}
                    className="flex w-full flex-col items-start border-b border-slate-50 px-4 py-2.5 text-left last:border-0 hover:bg-blue-50/50"
                  >
                    <span className="font-medium text-slate-900">{school.nom}</span>
                    <span className="text-xs text-slate-500">
                      {school.commune && `${school.commune} · `}
                      {school.dinacope && `DINACOPE: ${school.dinacope}`}
                      {!school.commune && !school.dinacope && school.province}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
