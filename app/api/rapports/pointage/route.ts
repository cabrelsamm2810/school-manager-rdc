import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import PDFDocument from 'pdfkit';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/session-user';

/**
 * GET /api/rapports/pointage?days=30&export=csv|xlsx|pdf
 *
 * Agrège les pointages des enseignants de l'école du directeur connecté.
 * Renvoie :
 *   - totalEnseignants : effectif attendu
 *   - daily : [{ jour, present, retard, absent, taux }]
 *   - weekly : [{ weekStart, present, retard, absent, taux }]
 *   - enseignants : [{ id, nom, prenom, pointages: [{ jour, statut, heureArrivee }] }]
 *
 * ?export=csv → renvoie un fichier CSV (un ligne par enseignant × jour).
 * ?export=xlsx → renvoie un fichier Excel.
 * ?export=pdf → renvoie un résumé PDF imprimable.
 */

function formatDateFr(dateStr: string, opts?: Intl.DateTimeFormatOptions) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', opts ?? { day: '2-digit', month: 'short' });
}
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
  const exportFmt = searchParams.get('export'); // 'csv' | 'xlsx' | 'pdf' | null

  // ── Filtres ──
  const filterClasse = searchParams.get('classe') ?? '';
  const filterDepartement = searchParams.get('departement') ?? '';
  const filterSearch = searchParams.get('search') ?? '';

  // ── Effectif enseignant de l'école (avec filtres) ──
  const enseignantWhere: Record<string, unknown> = { role: 'ENSEIGNANT', ecoleId, isActive: true };
  if (filterClasse) enseignantWhere.classe = filterClasse;
  if (filterDepartement) enseignantWhere.fonction = filterDepartement;
  if (filterSearch) {
    enseignantWhere.OR = [
      { nom: { contains: filterSearch, mode: 'insensitive' } },
      { prenom: { contains: filterSearch, mode: 'insensitive' } },
      { postNom: { contains: filterSearch, mode: 'insensitive' } },
    ];
  }

  const enseignants = await prisma.user.findMany({
    where: enseignantWhere as never,
    select: { id: true, nom: true, postNom: true, prenom: true, classe: true, fonction: true },
    orderBy: { nom: 'asc' },
  });

  // ── Options de filtres disponibles (tous les enseignants de l'école) ──
  const allEnseignants = await prisma.user.findMany({
    where: { role: 'ENSEIGNANT', ecoleId, isActive: true },
    select: { classe: true, fonction: true },
  });
  const availableClasses = [...new Set(allEnseignants.map((e) => e.classe).filter(Boolean))].sort();
  const availableDepartements = [...new Set(allEnseignants.map((e) => e.fonction).filter(Boolean))].sort();

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

  // ── Tous les pointages sur la période (filtrés par enseignant) ──
  const pointageWhere: Record<string, unknown> = {
    ecoleId,
    jour: { gte: startStr, lte: endStr },
  };
  if (enseignantIds.length > 0) {
    pointageWhere.enseignantId = { in: enseignantIds };
  } else if (filterClasse || filterDepartement || filterSearch) {
    // Aucun enseignant ne correspond aux filtres → aucun pointage
    pointageWhere.enseignantId = '__none__';
  }
  const pointages = await prisma.pointageEnseignant.findMany({
    where: pointageWhere as never,
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

  // ── Détail par enseignant (tableau détaillé, réutilisé par l'export PDF) ──
  // Déclaré avant le bloc PDF : `const` n'est pas accessible avant sa déclaration (TDZ).
  const enseignantDetails = enseignants.map((ens) => {
    const ensPointages = pointages.filter((p) => p.enseignantId === ens.id);
    return {
      id: ens.id,
      nom: [ens.prenom, ens.nom, ens.postNom].filter(Boolean).join(' '),
      totalPointages: ensPointages.length,
      totalRetards: ensPointages.filter((p) => p.statut === 'RETARD').length,
    };
  });

  // ── Export PDF (résumé imprimable) ──
  if (exportFmt === 'pdf') {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));

    const periodeLabel = `${formatDateFr(startStr)} — ${formatDateFr(endStr)}`;
    const avgTaux = daily.length > 0 ? Math.round(daily.reduce((s, d) => s + d.taux, 0) / daily.length) : 0;
    const totalRetardsPdf = daily.reduce((s, d) => s + d.retard, 0);

    // ── En-tête ──
    doc.fontSize(18).font('Helvetica-Bold').text('Rapport de présence des enseignants', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica').text(`Période : ${periodeLabel} (${days} jours)`, { align: 'center' });
    doc.moveDown(0.2);
    doc.text(`Édité le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`, { align: 'center' });
    doc.moveDown(1);

    // ── Synthèse ──
    doc.fontSize(13).font('Helvetica-Bold').text('Synthèse', { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica');
    doc.text(`  Effectif enseignants : ${totalEnseignants}`);
    doc.text(`  Taux de présence moyen : ${avgTaux}%`);
    doc.text(`  Total retards (période) : ${totalRetardsPdf}`);
    doc.moveDown(1);

    // ── Tableau quotidien ──
    doc.fontSize(13).font('Helvetica-Bold').text('Détail par jour', { underline: true });
    doc.moveDown(0.3);

    const colW = [150, 80, 80, 80, 80];
    const tableX = 50;
    let y = doc.y;

    // En-tête du tableau
    doc.fontSize(9).font('Helvetica-Bold');
    const headers = ['Jour', 'Présents', 'Retards', 'Absents', 'Taux'];
    headers.forEach((h, i) => {
      doc.text(h, tableX + colW.slice(0, i).reduce((a, b) => a + b, 0), y, { width: colW[i], align: i === 0 ? 'left' : 'center' });
    });
    doc.moveTo(tableX, y + 14).lineTo(tableX + colW.reduce((a, b) => a + b, 0), y + 14).stroke();
    y += 20;

    // Lignes
    doc.font('Helvetica');
    for (const row of daily.slice().reverse()) {
      if (y > 720) { doc.addPage(); y = 50; }
      const label = formatDateFr(row.jour, { weekday: 'short', day: '2-digit', month: 'short' });
      const cells = [label, String(row.present), String(row.retard), String(row.absent), `${row.taux}%`];
      cells.forEach((c, i) => {
        doc.text(c, tableX + colW.slice(0, i).reduce((a, b) => a + b, 0), y, { width: colW[i], align: i === 0 ? 'left' : 'center' });
      });
      y += 16;
    }

    doc.moveDown(1);

    // ── Détail par enseignant ──
    if (enseignantDetails.length > 0) {
      if (doc.y > 680) doc.addPage();
      doc.fontSize(13).font('Helvetica-Bold').text('Détail par enseignant', { underline: true });
      doc.moveDown(0.3);

      y = doc.y;
      doc.fontSize(9).font('Helvetica-Bold');
      const ensHeaders = ['Enseignant', 'Pointages', 'Retards'];
      const ensColW = [250, 100, 100];
      ensHeaders.forEach((h, i) => {
        doc.text(h, tableX + ensColW.slice(0, i).reduce((a, b) => a + b, 0), y, { width: ensColW[i], align: i === 0 ? 'left' : 'center' });
      });
      doc.moveTo(tableX, y + 14).lineTo(tableX + ensColW.reduce((a, b) => a + b, 0), y + 14).stroke();
      y += 20;

      doc.font('Helvetica');
      for (const ens of enseignantDetails) {
        if (y > 760) { doc.addPage(); y = 50; }
        const cells = [ens.nom, String(ens.totalPointages), String(ens.totalRetards)];
        cells.forEach((c, i) => {
          doc.text(c, tableX + ensColW.slice(0, i).reduce((a, b) => a + b, 0), y, { width: ensColW[i], align: i === 0 ? 'left' : 'center' });
        });
        y += 16;
      }
    }

    // ── Pied de page ──
    doc.moveDown(2);
    doc.fontSize(8).font('Helvetica-Oblique').fillColor('gray')
      .text('Document généré automatiquement par School Manager RDC', { align: 'center' });

    doc.end();

    const pdfBuffer = await new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="rapport_pointage_${startStr}_${endStr}.pdf"`,
      },
    });
  }

  return NextResponse.json({
    totalEnseignants,
    periode: { start: startStr, end: endStr, days },
    daily,
    weekly,
    enseignants: enseignantDetails,
    filters: { classes: availableClasses, departements: availableDepartements },
  });
}
