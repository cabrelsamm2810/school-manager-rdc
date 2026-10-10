/**
 * Génération d'un rapport PDF mensuel des absences par classe.
 * Utilise pdfkit pour produire un PDF professionnel côté serveur.
 */

import PDFDocument from 'pdfkit';

export interface AbsenceJour {
  date: string;
  jour: string;
}

export interface AbsenceEleve {
  nom: string;
  matricule: string;
  nbAbsences: number;
  nbPresences: number;
  joursAbsence: AbsenceJour[];
}

export interface ClasseStat {
  classe: string;
  effectif: number;
  totalAbsences: number;
  totalPresences: number;
  tauxAbsence: number;
  eleves: AbsenceEleve[];
}

export interface RapportAbsencesData {
  ecoleNom: string;
  mois: string;
  anneeScolaire: string;
  generePar: string;
  createdAt: string;
  classes: ClasseStat[];
  totalGeneral: {
    effectif: number;
    absences: number;
    presences: number;
    tauxAbsence: number;
  };
}

const COLORS = {
  primary: '#1e3a5f',
  accent: '#2563eb',
  light: '#f1f5f9',
  border: '#cbd5e1',
  text: '#1e293b',
  muted: '#64748b',
  red: '#dc2626',
  green: '#16a34a',
};

/** Génère le rapport PDF des absences mensuelles et renvoie un Buffer. */
export async function generateRapportAbsencesPdf(data: RapportAbsencesData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Rapport d'absences - ${data.mois}`,
          Author: 'School Manager RDC',
          Subject: 'Rapport mensuel des absences',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      renderRapport(doc, data);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

function renderRapport(doc: PDFKit.PDFDocument, data: RapportAbsencesData): void {
  const pageWidth = doc.page.width - 100;
  const pageHeight = doc.page.height;
  let y = 50;

  // === En-tête ===
  doc
    .fillColor(COLORS.primary)
    .fontSize(20)
    .font('Helvetica-Bold')
    .text('School Manager RDC', 50, y);

  doc
    .fillColor(COLORS.muted)
    .fontSize(10)
    .font('Helvetica')
    .text(data.ecoleNom || 'École', 50, y + 23);

  doc
    .fillColor(COLORS.muted)
    .fontSize(9)
    .font('Helvetica')
    .text('Rapport mensuel d\'absences', 0, y + 2, { width: pageWidth, align: 'right' })
    .fillColor(COLORS.text)
    .fontSize(13)
    .font('Helvetica-Bold')
    .text(data.mois, 0, y + 15, { width: pageWidth, align: 'right' })
    .fillColor(COLORS.muted)
    .fontSize(9)
    .font('Helvetica')
    .text(data.anneeScolaire, 0, y + 30, { width: pageWidth, align: 'right' });

  y += 50;

  // Ligne de séparation
  doc
    .moveTo(50, y)
    .lineTo(doc.page.width - 50, y)
    .lineWidth(2)
    .strokeColor(COLORS.primary)
    .stroke();

  y += 20;

  // === Tableau récapitulatif par classe ===
  doc
    .fillColor(COLORS.primary)
    .fontSize(12)
    .font('Helvetica-Bold')
    .text('Récapitulatif par classe', 50, y);

  y += 18;

  const recapCols = [
    { label: 'Classe', w: pageWidth * 0.25 },
    { label: 'Effectif', w: pageWidth * 0.15, align: 'center' as const },
    { label: 'Absences', w: pageWidth * 0.15, align: 'center' as const },
    { label: 'Présences', w: pageWidth * 0.15, align: 'center' as const },
    { label: 'Taux d\'absence', w: pageWidth * 0.30, align: 'center' as const },
  ];

  // En-tête tableau récap
  doc
    .fillColor(COLORS.primary)
    .roundedRect(50, y, pageWidth, 22, 4)
    .fill();

  let cx = 56;
  doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
  recapCols.forEach((h) => {
    doc.text(h.label, cx, y + 7, { width: h.w - 6, align: h.align });
    cx += h.w;
  });

  y += 22;

  // Lignes récap
  doc.font('Helvetica').fontSize(8);
  data.classes.forEach((c, i) => {
    if (i % 2 === 0) {
      doc.fillColor('#f8fafc').rect(50, y, pageWidth, 20).fill();
    }
    cx = 56;
    doc.fillColor(COLORS.text).font('Helvetica-Bold').text(c.classe, cx, y + 6, { width: recapCols[0].w - 6 });
    cx += recapCols[0].w;
    doc.font('Helvetica').fillColor(COLORS.text).text(String(c.effectif), cx, y + 6, { width: recapCols[1].w - 6, align: 'center' });
    cx += recapCols[1].w;
    doc.fillColor(COLORS.red).font('Helvetica-Bold').text(String(c.totalAbsences), cx, y + 6, { width: recapCols[2].w - 6, align: 'center' });
    cx += recapCols[2].w;
    doc.fillColor(COLORS.green).font('Helvetica-Bold').text(String(c.totalPresences), cx, y + 6, { width: recapCols[3].w - 6, align: 'center' });
    cx += recapCols[3].w;
    const tauxColor = c.tauxAbsence >= 20 ? COLORS.red : c.tauxAbsence >= 10 ? '#d97706' : COLORS.green;
    doc.fillColor(tauxColor).font('Helvetica-Bold').text(`${c.tauxAbsence}%`, cx, y + 6, { width: recapCols[4].w - 6, align: 'center' });
    y += 20;
  });

  // Ligne total général
  doc
    .fillColor(COLORS.primary)
    .roundedRect(50, y, pageWidth, 24, 4)
    .fill();

  cx = 56;
  doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold');
  doc.text('TOTAL GÉNÉRAL', cx, y + 7, { width: recapCols[0].w - 6 });
  cx += recapCols[0].w;
  doc.text(String(data.totalGeneral.effectif), cx, y + 7, { width: recapCols[1].w - 6, align: 'center' });
  cx += recapCols[1].w;
  doc.text(String(data.totalGeneral.absences), cx, y + 7, { width: recapCols[2].w - 6, align: 'center' });
  cx += recapCols[2].w;
  doc.text(String(data.totalGeneral.presences), cx, y + 7, { width: recapCols[3].w - 6, align: 'center' });
  cx += recapCols[3].w;
  doc.text(`${data.totalGeneral.tauxAbsence}%`, cx, y + 7, { width: recapCols[4].w - 6, align: 'center' });

  y += 34;

  // === Détail des absences par classe ===
  data.classes.forEach((c) => {
    const elevesAbsents = c.eleves.filter((e) => e.nbAbsences > 0);
    if (elevesAbsents.length === 0) return;

    // Vérifier l'espace restant, nouvelle page si nécessaire
    if (y > pageHeight - 120) {
      doc.addPage();
      y = 50;
    }

    doc
      .fillColor(COLORS.primary)
      .fontSize(11)
      .font('Helvetica-Bold')
      .text(`Classe ${c.classe} — ${elevesAbsents.length} élève(s) avec absence(s)`, 50, y);

    y += 16;

    const detailCols = [
      { label: 'Nom de l\'élève', w: pageWidth * 0.35 },
      { label: 'Matricule', w: pageWidth * 0.18, align: 'center' as const },
      { label: 'Absences', w: pageWidth * 0.12, align: 'center' as const },
      { label: 'Présences', w: pageWidth * 0.12, align: 'center' as const },
      { label: 'Taux', w: pageWidth * 0.10, align: 'center' as const },
      { label: 'Jours d\'absence', w: pageWidth * 0.13, align: 'center' as const },
    ];

    // En-tête tableau détail
    doc
      .fillColor(COLORS.accent)
      .roundedRect(50, y, pageWidth, 20, 4)
      .fill();

    cx = 56;
    doc.fillColor('#ffffff').fontSize(7).font('Helvetica-Bold');
    detailCols.forEach((h) => {
      doc.text(h.label, cx, y + 6, { width: h.w - 6, align: h.align });
      cx += h.w;
    });

    y += 20;

    // Lignes détail
    doc.font('Helvetica').fontSize(7);
    elevesAbsents.forEach((e, i) => {
      if (y > pageHeight - 60) {
        doc.addPage();
        y = 50;
      }
      if (i % 2 === 0) {
        doc.fillColor('#f8fafc').rect(50, y, pageWidth, 18).fill();
      }
      cx = 56;
      const total = e.nbAbsences + e.nbPresences;
      const taux = total > 0 ? Math.round((e.nbAbsences / total) * 100) : 0;
      const joursStr = e.joursAbsence.map((j) => `${j.jour} ${new Date(j.date).getDate()}`).join(', ');

      doc.fillColor(COLORS.text).font('Helvetica-Bold').text(e.nom, cx, y + 5, { width: detailCols[0].w - 6 });
      cx += detailCols[0].w;
      doc.font('Helvetica').fillColor(COLORS.muted).text(e.matricule, cx, y + 5, { width: detailCols[1].w - 6, align: 'center' });
      cx += detailCols[1].w;
      doc.fillColor(COLORS.red).font('Helvetica-Bold').text(String(e.nbAbsences), cx, y + 5, { width: detailCols[2].w - 6, align: 'center' });
      cx += detailCols[2].w;
      doc.fillColor(COLORS.green).font('Helvetica-Bold').text(String(e.nbPresences), cx, y + 5, { width: detailCols[3].w - 6, align: 'center' });
      cx += detailCols[3].w;
      doc.fillColor(taux >= 20 ? COLORS.red : COLORS.text).font('Helvetica-Bold').text(`${taux}%`, cx, y + 5, { width: detailCols[4].w - 6, align: 'center' });
      cx += detailCols[4].w;
      doc.fillColor(COLORS.muted).font('Helvetica').text(joursStr, cx, y + 5, { width: detailCols[5].w - 6, align: 'center' });
      y += 18;
    });

    y += 14;
  });

  // === Bloc génération ===
  if (y > pageHeight - 80) {
    doc.addPage();
    y = 50;
  }

  const genY = pageHeight - 80;
  doc
    .moveTo(50, genY)
    .lineTo(doc.page.width - 50, genY)
    .lineWidth(0.5)
    .strokeColor(COLORS.border)
    .stroke();

  doc
    .fillColor(COLORS.muted)
    .fontSize(8)
    .font('Helvetica')
    .text('Généré par', 50, genY + 8)
    .fillColor(COLORS.text)
    .fontSize(10)
    .font('Helvetica-Bold')
    .text(data.generePar, 50, genY + 20)
    .fillColor(COLORS.muted)
    .fontSize(7)
    .font('Helvetica')
    .text(new Date(data.createdAt).toLocaleDateString('fr-FR'), 50, genY + 34);

  doc
    .fillColor(COLORS.muted)
    .fontSize(7)
    .font('Helvetica')
    .text(
      'Document généré par School Manager RDC — Plateforme nationale de gestion scolaire de la RDC',
      0, genY + 50, { width: pageWidth, align: 'center' },
    );
}
