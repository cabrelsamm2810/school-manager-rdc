import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/session-user';

/**
 * GET /api/rapports/pointage?days=30&export=csv
 *
 * Agrège les pointages des enseignants de l'école du directeur connecté.
 * Renvoie :
 *   - totalEnseignants : effectif attendu
 *   - daily : [{ jour, present, retard, absent, taux }]
 *   - weekly : [{ weekStart, present, retard, absent, taux }]
 *   - enseignants : [{ id, nom, prenom, pointages: [{ jour, statut, heureArrivee }] }]
 *
 * ?export=csv → renvoie un fichier CSV (un ligne par enseignant × jour).
 */
export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }
  if (user.role !== 'DIRECTION_ECOLE') {
    return NextResponse.json({ error: 'Réservé à la direction.' }, { status: 403 });
  }

  const ecoleId = user.ecoleId;
  if (!ecoleId) {
    return NextResponse.json({ error: 'Aucune école rattachée.' }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const days = Math.min(Math.max(parseInt(searchParams.get('days') ?? '30', 10) || 30, 1), 90);
  const exportFmt = searchParams.get('export'); // 'csv' | 'xlsx' | null
  const wantExport = exportFmt === 'csv' || exportFmt === 'xlsx';

  // ── Effectif enseignant de l'école ──
  const enseignants = await prisma.user.findMany({
    where: { role: 'ENSEIGNANT', ecoleId, isActive: true },
    select: { id: true, nom: true, postNom: true, prenom: true },
    orderBy: { nom: 'asc' },
  });

  const enseignantIds = enseignants.map((e) => e.id);
  const totalEnseignants = enseignantIds.length;

  // ── Période ──
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (days - 1));
  startDate.setHours(0, 0, 0, 0);

  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];

  // ── Tous les pointages sur la période ──
  const pointages = await prisma.pointageEnseignant.findMany({
    where: {
      ecoleId,
      jour: { gte: startStr, lte: endStr },
    },
    orderBy: { jour: 'asc' },
  });

  // ── Index par jour ──
  const byDay = new Map<string, { present: number; retard: number }>();
  for (const p of pointages) {
    const entry = byDay.get(p.jour) ?? { present: 0, retard: 0 };
    if (p.statut === 'RETARD') entry.retard++;
    else entry.present++;
    byDay.set(p.jour, entry);
  }

  // ── Jours ouvrables (lun-sam) dans la période ──
  const workdays: string[] = [];
  const cursor = new Date(startDate);
  while (cursor <= endDate) {
    const dow = cursor.getDay();
    if (dow !== 0) workdays.push(cursor.toISOString().split('T')[0]); // skip Sunday
    cursor.setDate(cursor.getDate() + 1);
  }

  // ── Agrégation quotidienne ──
  const daily = workdays.map((jour) => {
    const counts = byDay.get(jour) ?? { present: 0, retard: 0 };
    const totalPointe = counts.present + counts.retard;
    const absent = Math.max(totalEnseignants - totalPointe, 0);
    const taux = totalEnseignants > 0 ? Math.round((totalPointe / totalEnseignants) * 100) : 0;
    return { jour, present: counts.present, retard: counts.retard, absent, taux };
  });

  // ── Agrégation hebdomadaire ──
  // Semaine = lundi → dimanche. On regroupe par lundi de la semaine.
  const weekMap = new Map<string, { present: number; retard: number; absent: number; days: number }>();
  for (const d of daily) {
    const date = new Date(d.jour + 'T00:00:00');
    const dow = date.getDay(); // 0=dim, 1=lun…
    const monday = new Date(date);
    monday.setDate(date.getDate() - ((dow + 6) % 7)); // recule au lundi
    const weekKey = monday.toISOString().split('T')[0];
    const entry = weekMap.get(weekKey) ?? { present: 0, retard: 0, absent: 0, days: 0 };
    entry.present += d.present;
    entry.retard += d.retard;
    entry.absent += d.absent;
    entry.days += 1;
    weekMap.set(weekKey, entry);
  }
  const weekly = Array.from(weekMap.entries())
    .map(([weekStart, v]) => {
      const totalExpected = v.days * totalEnseignants;
      const totalPresent = v.present + v.retard;
      const taux = totalExpected > 0 ? Math.round((totalPresent / totalExpected) * 100) : 0;
      return { weekStart, present: v.present, retard: v.retard, absent: v.absent, taux };
    })
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart));

  // ── Préparation des lignes de données (communes CSV + Excel) ──
  const pointageByEnseignant = new Map<string, typeof pointages>();
  for (const p of pointages) {
    const arr = pointageByEnseignant.get(p.enseignantId) ?? [];
    arr.push(p);
    pointageByEnseignant.set(p.enseignantId, arr);
  }

  const exportRows: { Date: string; Enseignant: string; Statut: string; 'Heure arrivee': string }[] = [];
  for (const ens of enseignants) {
    const ensPointages = pointageByEnseignant.get(ens.id) ?? [];
    const pointageMap = new Map(ensPointages.map((p) => [p.jour, p]));
    for (const jour of workdays) {
      const p = pointageMap.get(jour);
      const fullName = [ens.prenom, ens.nom, ens.postNom].filter(Boolean).join(' ');
      const statut = p ? p.statut : 'ABSENT';
      const heure = p ? new Date(p.heureArrivee).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';
      exportRows.push({ Date: jour, Enseignant: fullName, Statut: statut, 'Heure arrivee': heure });
    }
  }

  // ── Export CSV ──
  if (exportFmt === 'csv') {
    const header = 'Date;Enseignant;Statut;Heure arrivee\n';
    const csv = header + exportRows.map((r) => `${r.Date};${r.Enseignant};${r.Statut};${r['Heure arrivee']}`).join('\n');
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="rapport_pointage_${startStr}_${endStr}.csv"`,
      },
    });
  }

  // ── Export Excel (.xlsx) ──
  if (exportFmt === 'xlsx') {
    const ws = XLSX.utils.json_to_sheet(exportRows);
    // Largeurs de colonnes
    ws['!cols'] = [{ wch: 12 }, { wch: 30 }, { wch: 10 }, { wch: 12 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Présences');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="rapport_pointage_${startStr}_${endStr}.xlsx"`,
      },
    });
  }

  // ── Détail par enseignant (pour le tableau détaillé) ──
  const enseignantDetails = enseignants.map((ens) => {
    const ensPointages = pointages.filter((p) => p.enseignantId === ens.id);
    return {
      id: ens.id,
      nom: [ens.prenom, ens.nom, ens.postNom].filter(Boolean).join(' '),
      totalPointages: ensPointages.length,
      totalRetards: ensPointages.filter((p) => p.statut === 'RETARD').length,
    };
  });

  return NextResponse.json({
    totalEnseignants,
    periode: { start: startStr, end: endStr, days },
    daily,
    weekly,
    enseignants: enseignantDetails,
  });
}
