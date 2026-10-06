import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';
import { buildScopeWhere } from '@/lib/territory-filter';
import { calculateGrades, getCurrentAnneeScolaire, isValidCote } from '@/lib/cahier-de-cote';

/** GET — liste des cotes filtrées par établissement, classe, cours, période. */
export async function GET(request: NextRequest) {
  const auth = await requireRole(request, 'ENSEIGNANT');
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const etablissementId = searchParams.get('etablissementId') || undefined;
  const classe = searchParams.get('classe') || undefined;
  const cours = searchParams.get('cours') || undefined;
  const periode = searchParams.get('periode') || undefined;
  const anneeScolaire = searchParams.get('anneeScolaire') || getCurrentAnneeScolaire();

  const where: Record<string, unknown> = { anneeScolaire };
  if (etablissementId) where.etablissementId = etablissementId;
  if (classe) where.classe = classe;
  if (cours) where.cours = cours;
  if (periode) where.periode = periode;

  // Filtrage hiérarchique par périmètre
  const scopeWhere = buildScopeWhere(auth.user, {
    etablissementField: 'etablissementId',
    // CahierDeCote n'a pas de champ `institution` ni `province` : le libellé
    // `etablissementNom` sert de repli provincial, le filtre institution est désactivé.
    provinceField: 'etablissementNom',
    institutionField: false,
  });
  if (Object.keys(scopeWhere).length > 0) {
    where.AND = [scopeWhere];
  }

  const entries = await prisma.cahierDeCote.findMany({
    where,
    orderBy: [{ eleveNom: 'asc' }],
  });

  return NextResponse.json({ cahierDeCotes: entries });
}

/** POST — enregistrement groupé des cotes (création ou mise à jour). */
export async function POST(request: NextRequest) {
  const auth = await requireRole(request, 'ENSEIGNANT');
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 403 });

  const body = await request.json().catch(() => null);
  if (!body?.entries || !Array.isArray(body.entries) || body.entries.length === 0) {
    return NextResponse.json({ error: 'Aucune cote fournie.' }, { status: 400 });
  }

  const {
    etablissementId = null,
    etablissementNom = '',
    classe,
    cours,
    enseignantNom = '',
    periode,
    anneeScolaire = getCurrentAnneeScolaire(),
  } = body;

  if (!classe || !cours || !periode) {
    return NextResponse.json({ error: 'Classe, cours et période sont obligatoires.' }, { status: 400 });
  }

  const saisiePar = `${auth.user.prenom} ${auth.user.nom}`.trim();
  const saisieParId = auth.user.id;

  // Valider toutes les cotes
  for (const entry of body.entries) {
    const { devoir1, devoir2, examen } = entry;
    if (devoir1 !== null && devoir1 !== '' && !isValidCote(Number(devoir1))) {
      return NextResponse.json({ error: `Cote devoir1 invalide pour ${entry.eleveNom}. Doit être entre 0 et 20.` }, { status: 400 });
    }
    if (devoir2 !== null && devoir2 !== '' && !isValidCote(Number(devoir2))) {
      return NextResponse.json({ error: `Cote devoir2 invalide pour ${entry.eleveNom}. Doit être entre 0 et 20.` }, { status: 400 });
    }
    if (examen !== null && examen !== '' && !isValidCote(Number(examen))) {
      return NextResponse.json({ error: `Cote examen invalide pour ${entry.eleveNom}. Doit être entre 0 et 20.` }, { status: 400 });
    }
  }

  const results: unknown[] = [];

  for (const entry of body.entries) {
    const d1 = Number(entry.devoir1) || 0;
    const d2 = Number(entry.devoir2) || 0;
    const ex = Number(entry.examen) || 0;
    const { total, moyenne, pourcentage, mention } = calculateGrades(d1, d2, ex);

    const data = {
      etablissementId: etablissementId || null,
      etablissementNom,
      classe,
      cours,
      enseignantNom,
      periode,
      anneeScolaire,
      eleveId: entry.eleveId,
      eleveMatricule: entry.eleveMatricule || '',
      eleveNom: entry.eleveNom,
      devoir1: d1,
      devoir2: d2,
      examen: ex,
      total,
      moyenne,
      pourcentage,
      mention,
      statut: 'Enregistré',
      saisiePar,
      saisieParId,
    };

    // Upsert: créer ou mettre à jour (unique sur eleveId + cours + periode + anneeScolaire)
    const existing = await prisma.cahierDeCote.findFirst({
      where: {
        eleveId: entry.eleveId,
        cours,
        periode,
        anneeScolaire,
      },
    });

    if (existing) {
      // Vérifier les permissions: un enseignant ne peut modifier que ses propres saisies
      // La direction et au-dessus peuvent tout modifier
      const canEdit = auth.user.role === 'DIRECTION_ECOLE' ||
        auth.user.role === 'SUPER_ADMIN' ||
        existing.saisieParId === auth.user.id ||
        existing.statut !== 'Validé';

      if (!canEdit) {
        continue; // Ignorer silencieusement les entrées non modifiables
      }

      // Enregistrer l'historique si les valeurs ont changé
      const changedFields: { field: string; oldVal: string; newVal: string }[] = [];
      if (existing.devoir1 !== d1) changedFields.push({ field: 'devoir1', oldVal: String(existing.devoir1), newVal: String(d1) });
      if (existing.devoir2 !== d2) changedFields.push({ field: 'devoir2', oldVal: String(existing.devoir2), newVal: String(d2) });
      if (existing.examen !== ex) changedFields.push({ field: 'examen', oldVal: String(existing.examen), newVal: String(ex) });

      const updated = await prisma.cahierDeCote.update({
        where: { id: existing.id },
        data,
      });

      if (changedFields.length > 0) {
        await prisma.cahierDeCoteHistory.createMany({
          data: changedFields.map((cf) => ({
            cahierDeCoteId: existing.id,
            action: 'modification',
            champModifie: cf.field,
            ancienneValeur: cf.oldVal,
            nouvelleValeur: cf.newVal,
            modifiePar: saisiePar,
            modifieParId: saisieParId,
          })),
        });
      }

      results.push(updated);
    } else {
      const created = await prisma.cahierDeCote.create({ data });

      await prisma.cahierDeCoteHistory.create({
        data: {
          cahierDeCoteId: created.id,
          action: 'création',
          champModifie: '',
          ancienneValeur: '',
          nouvelleValeur: `${d1}/${d2}/${ex}`,
          modifiePar: saisiePar,
          modifieParId: saisieParId,
        },
      });

      results.push(created);
    }
  }

  return NextResponse.json({ saved: results.length, cahierDeCotes: results }, { status: 201 });
}
