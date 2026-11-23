'use client';

import { useEffect, useMemo, useState } from 'react';
import { ModulePage } from '@/components/ModulePage';
import { CrudManager } from '@/components/CrudManager';
import { crudConfigs } from '@/lib/crud-configs';
import { classesForSections } from '@/lib/ecole-sections';

export default function ClassesRdcPage() {
  const [sectionsEcole, setSectionsEcole] = useState<string[] | null>(null);

  // Sections organisées par l'école : les classes proposées s'y limitent.
  useEffect(() => {
    fetch('/api/ecoles')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const sections: string[] = (data?.ecoles?.[0]?.sections ?? []).map((s: any) => s.nom);
        setSectionsEcole(sections.length > 0 ? sections : null);
      })
      .catch(() => {});
  }, []);

  const filterItems = useMemo(() => {
    if (!sectionsEcole) return undefined;
    const autorisees = new Set(classesForSections(sectionsEcole).map((c) => c.nom));
    return (items: Record<string, any>[]) => items.filter((item) => autorisees.has(item.nom));
  }, [sectionsEcole]);

  return (
    <ModulePage icon="school" eyebrow="Curriculum national" title="Classes & Niveaux" description="Les classes et niveaux officiels du système éducatif congolais (MINEDU-NC) : maternel, primaire, CTEB et humanités.">
      {sectionsEcole && (
        <p className="mb-4 rounded-xl bg-blue-50 px-4 py-2.5 text-sm text-blue-700">
          Limité aux sections organisées par l&apos;établissement : {sectionsEcole.join(', ')}.
        </p>
      )}
      <CrudManager config={crudConfigs['classes-rdc']} filterItems={filterItems} />
    </ModulePage>
  );
}
