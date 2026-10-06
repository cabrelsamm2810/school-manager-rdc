/**
 * Génération du bulletin officiel RDC au format du Ministère de l'EPSP.
 * Suit la structure officielle: en-tête République/MINISTÈRE, tableau
 * trimestriel avec maxima, décision et signatures.
 */

import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

export interface OfficialBulletinBranch {
  cours: string;
  trim1: { d1: number; d2: number; ex: number; total: number } | null;
  trim2: { d1: number; d2: number; ex: number; total: number } | null;
  trim3: { d1: number; d2: number; ex: number; total: number } | null;
  totalGeneral: number;
  pourcentage: number;
}

export interface OfficialBulletinData {
  // Établissement
  province: string;
  provinceEducationnelle: string;
  ville: string;
  commune: string;
  ecole: string;
  code: string;
  // Élève
  eleveNom: string;
  eleveMatricule: string;
  sexe: string;
  lieuNaissance: string;
  dateNaissance: string;
  classe: string;
  // Académique
  anneeScolaire: string;
  branches: OfficialBulletinBranch[];
  totalMax: number;
  totalObtenu: number;
  pourcentageGeneral: number;
  place: string;
  nbreEleves: string;
  application: string;
  conduite: string;
  enseignantNom: string;
  chefEtablissement: string;
  // Vérification
  verifyUrl: string;
}

const C = {
  black: '#000000',
  dark: '#1a1a1a',
  primary: '#0f172a',
  border: '#334155',
  light: '#f1f5f9',
  headerBg: '#1e3a5f',
  white: '#ffffff',
  muted: '#475569',
};

/** Génère le PDF du bulletin officiel RDC et renvoie un Buffer. */
export async function generateOfficialBulletinPdf(data: OfficialBulletinData): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 30,
        info: {
          Title: `Bulletin officiel ${data.eleveNom} - ${data.anneeScolaire}`,
          Author: 'School Manager RDC',
          Subject: 'Bulletin officiel RDC',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      await renderOfficialPage(doc, data);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

async function renderOfficialPage(doc: PDFKit.PDFDocument, data: OfficialBulletinData): Promise<void> {
  const pageW = doc.page.width;
  const ml = 30;
  const mr = 30;
  const usableW = pageW - ml - mr;

  let y = 30;

  // === En-tête officiel ===
  doc.fillColor(C.black).font('Helvetica-Bold');
  doc.fontSize(11).text('RÉPUBLIQUE DÉMOCRATIQUE DU CONGO', ml, y, { width: usableW, align: 'center' });
  y += 15;
  doc.fontSize(8.5).text("MINISTÈRE DE L'ENSEIGNEMENT PRIMAIRE, SECONDAIRE ET PROFESSIONNEL", ml, y, { width: usableW, align: 'center' });
  y += 13;
  doc.fontSize(7).font('Helvetica').text(`N° ID: ${data.eleveMatricule || '…………'}`, ml, y, { width: usableW, align: 'right' });
  y += 14;

  // Ligne
  doc.moveTo(ml, y).lineTo(pageW - mr, y).lineWidth(1.5).strokeColor(C.primary).stroke();
  y += 8;

  // === Informations établissement et élève ===
  const infoColW = usableW / 2;
  const labelFont = 'Helvetica-Bold';
  const valFont = 'Helvetica';
  const lh = 13;

  // Ligne 1
  doc.font(labelFont).fontSize(7.5).text('PROVINCE : ', ml, y);
  doc.font(valFont).text(data.provinceEducationnelle || data.province || '………………', ml + 55, y);
  doc.font(labelFont).text('VILLE : ', ml + infoColW, y);
  doc.font(valFont).text(data.ville || '………………', ml + infoColW + 35, y);
  y += lh;

  // Ligne 2
  doc.font(labelFont).text('COMMUNE/TER : ', ml, y);
  doc.font(valFont).text(data.commune || '………………', ml + 60, y);
  doc.font(labelFont).text('ÉCOLE : ', ml + infoColW, y);
  doc.font(valFont).text(data.ecole || '………………', ml + infoColW + 38, y, { width: infoColW - 40 });
  y += lh;

  // Ligne 3
  doc.font(labelFont).text('CODE : ', ml, y);
  doc.font(valFont).text(data.code || '…………', ml + 32, y);
  doc.font(labelFont).text('ÉLÈVE : ', ml + infoColW, y);
  doc.font(valFont).text(data.eleveNom || '………………', ml + infoColW + 38, y, { width: infoColW - 80 });
  doc.font(labelFont).text('SEXE : ', ml + infoColW + infoColW * 0.62, y);
  doc.font(valFont).text(data.sexe || '…', ml + infoColW + infoColW * 0.62 + 30, y);
  y += lh;

  // Ligne 4
  doc.font(labelFont).text('NÉ(E) À : ', ml, y);
  doc.font(valFont).text(data.lieuNaissance || '………………', ml + 42, y, { width: infoColW - 80 });
  doc.font(labelFont).text('LE : ', ml + infoColW * 0.5, y);
  doc.font(valFont).text(data.dateNaissance || '…/…/……', ml + infoColW * 0.5 + 20, y);
  doc.font(labelFont).text('CLASSE : ', ml + infoColW, y);
  doc.font(valFont).text(data.classe || '………………', ml + infoColW + 40, y);
  doc.font(labelFont).text('N° PERM : ', ml + infoColW + infoColW * 0.5, y);
  doc.font(valFont).text(data.eleveMatricule || '…………', ml + infoColW + infoColW * 0.5 + 45, y);
  y += lh + 4;

  // === Titre du bulletin ===
  doc.fillColor(C.primary).font('Helvetica-Bold').fontSize(10);
  doc.text(`BULLETIN DE L'ÉLÈVE — ${data.classe || '…………'}`, ml, y, { width: usableW, align: 'center' });
  y += 14;
  doc.fontSize(8.5).text(`ANNÉE SCOLAIRE ${data.anneeScolaire}`, ml, y, { width: usableW, align: 'center' });
  y += 16;

  // === Tableau des branches ===
  // Colonnes: BRANCHES | 1er TRIM (D1 D2 EX T) | 2e TRIM (D1 D2 EX T) | 3e TRIM (D1 D2 EX T) | TOTAL | %
  const colBranches = 140;
  const colD = 22;
  const colEx = 22;
  const colT = 30;
  const trimW = colD * 2 + colEx + colT; // 96
  const colTotal = 42;
  const colPct = 33;
  const tableW = colBranches + trimW * 3 + colTotal + colPct; // 140 + 288 + 42 + 33 = 503
  const tableX = ml + (usableW - tableW) / 2; // centrer

  // En-tête du tableau — ligne 1 (groupes de colonnes)
  doc.fillColor(C.headerBg).rect(tableX, y, tableW, 18).fill();
  doc.fillColor(C.white).font('Helvetica-Bold').fontSize(7);

  let cx = tableX;
  doc.text('BRANCHES', cx + 4, y + 6, { width: colBranches - 8 });
  cx += colBranches;

  const trimLabels = ['PREMIER TRIMESTRE', 'DEUXIÈME TRIMESTRE', 'TROISIÈME TRIMESTRE'];
  for (const label of trimLabels) {
    doc.text(label, cx, y + 6, { width: trimW, align: 'center' });
    cx += trimW;
  }
  doc.text('TOTAL', cx, y + 6, { width: colTotal, align: 'center' });
  cx += colTotal;
  doc.text('%', cx, y + 6, { width: colPct, align: 'center' });

  y += 18;

  // En-tête — ligne 2 (sous-colonnes)
  doc.fillColor('#2c4a6e').rect(tableX, y, tableW, 14).fill();
  doc.fillColor(C.white).font('Helvetica-Bold').fontSize(6.5);

  cx = tableX;
  doc.text('', cx + 4, y + 4, { width: colBranches - 8 }); // vide
  cx += colBranches;

  for (let t = 0; t < 3; t++) {
    doc.text('D1', cx, y + 4, { width: colD, align: 'center' }); cx += colD;
    doc.text('D2', cx, y + 4, { width: colD, align: 'center' }); cx += colD;
    doc.text('EX', cx, y + 4, { width: colEx, align: 'center' }); cx += colEx;
    doc.text('T', cx, y + 4, { width: colT, align: 'center' }); cx += colT;
  }
  doc.text('GÉN.', cx, y + 4, { width: colTotal, align: 'center' }); cx += colTotal;
  doc.text('', cx, y + 4, { width: colPct, align: 'center' });

  y += 14;

  // Ligne MAXIMA
  doc.fillColor(C.light).rect(tableX, y, tableW, 13).fill();
  doc.font('Helvetica-Bold').fontSize(6.5).fillColor(C.dark);
  doc.text('MAXIMA', tableX + 4, y + 3, { width: colBranches - 8 });
  cx = tableX + colBranches;
  for (let t = 0; t < 3; t++) {
    doc.text('20', cx, y + 3, { width: colD, align: 'center' }); cx += colD;
    doc.text('20', cx, y + 3, { width: colD, align: 'center' }); cx += colD;
    doc.text('20', cx, y + 3, { width: colEx, align: 'center' }); cx += colEx;
    doc.text('60', cx, y + 3, { width: colT, align: 'center' }); cx += colT;
  }
  doc.text(`${data.branches.length * 180 || '180'}`, cx, y + 3, { width: colTotal, align: 'center' }); cx += colTotal;
  doc.text('100', cx, y + 3, { width: colPct, align: 'center' });

  y += 13;

  // Lignes des branches
  const rowH = 16;
  doc.font('Helvetica').fontSize(7);

  for (const branch of data.branches) {
    // Fond alterné
    if (data.branches.indexOf(branch) % 2 === 0) {
      doc.fillColor('#f8fafc').rect(tableX, y, tableW, rowH).fill();
    }

    // Bordures
    doc.lineWidth(0.3).strokeColor(C.border);
    doc.rect(tableX, y, tableW, rowH).stroke();

    // Nom du cours
    doc.fillColor(C.dark).font('Helvetica-Bold').fontSize(6.5);
    doc.text(branch.cours, tableX + 4, y + 5, { width: colBranches - 8 });

    // Grades par trimestre
    cx = tableX + colBranches;
    doc.font('Helvetica').fontSize(7).fillColor(C.dark);
    const trims = [branch.trim1, branch.trim2, branch.trim3];
    for (const trim of trims) {
      if (trim) {
        doc.text(fmt(trim.d1), cx, y + 5, { width: colD, align: 'center' }); cx += colD;
        doc.text(fmt(trim.d2), cx, y + 5, { width: colD, align: 'center' }); cx += colD;
        doc.text(fmt(trim.ex), cx, y + 5, { width: colEx, align: 'center' }); cx += colEx;
        doc.font('Helvetica-Bold').text(fmt(trim.total), cx, y + 5, { width: colT, align: 'center' }); cx += colT;
        doc.font('Helvetica');
      } else {
        cx += colD * 2 + colEx + colT;
      }
    }

    // Total général
    doc.font('Helvetica-Bold').text(fmt(branch.totalGeneral), cx, y + 5, { width: colTotal, align: 'center' }); cx += colTotal;
    // Pourcentage
    doc.text(`${branch.pourcentage.toFixed(0)}%`, cx, y + 5, { width: colPct, align: 'center' });

    y += rowH;
  }

  // Bordure extérieure du tableau
  doc.lineWidth(0.8).strokeColor(C.primary);
  doc.rect(tableX, y - data.branches.length * rowH - 45, tableW, data.branches.length * rowH + 45).stroke();

  // Ligne MAXIMA GÉNÉRAUX
  y += 2;
  doc.fillColor(C.headerBg).rect(tableX, y, tableW, 16).fill();
  doc.fillColor(C.white).font('Helvetica-Bold').fontSize(7.5);
  cx = tableX + 4;
  doc.text('MAXIMA GÉNÉRAUX', cx, y + 5, { width: colBranches - 8 });
  cx = tableX + colBranches + trimW * 3;
  doc.text(`${data.totalMax}`, cx, y + 5, { width: colTotal, align: 'center' }); cx += colTotal;
  doc.text(`${data.pourcentageGeneral.toFixed(1)}%`, cx, y + 5, { width: colPct, align: 'center' });

  y += 22;

  // === Section résumé ===
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(C.dark);
  const sumW = usableW / 4;
  const sumItems = [
    { label: 'POURCENTAGE', value: `${data.pourcentageGeneral.toFixed(1)}%` },
    { label: 'PLACE / NBRE D\'ÉLÈVES', value: `${data.place || '…'} / ${data.nbreEleves || '…'}` },
    { label: 'APPLICATION', value: data.application || '……' },
    { label: 'CONDUITE', value: data.conduite || '……' },
  ];
  sumItems.forEach((item, i) => {
    const sx = ml + i * sumW;
    doc.rect(sx, y, sumW - 4, 24).lineWidth(0.5).strokeColor(C.border).stroke();
    doc.text(item.label, sx + 3, y + 3, { width: sumW - 10, align: 'center' });
    doc.font('Helvetica').fontSize(9).text(item.value, sx + 3, y + 12, { width: sumW - 10, align: 'center' });
    doc.font('Helvetica-Bold').fontSize(7.5);
  });
  y += 30;

  // === Signatures ===
  doc.font('Helvetica-Bold').fontSize(7).fillColor(C.dark);
  const sigW = usableW / 3;
  const sigItems = [
    { label: 'SIGNAT. DE L\'INST.', value: data.enseignantNom || '…………' },
    { label: 'SIGNAT. DU RESP.', value: '…………' },
    { label: 'SCEAU DE L\'ÉCOLE', value: '' },
  ];
  sigItems.forEach((item, i) => {
    const sx = ml + i * sigW;
    doc.text(item.label, sx, y, { width: sigW - 4, align: 'center' });
    if (item.value) {
      doc.font('Helvetica').fontSize(7).text(item.value, sx, y + 22, { width: sigW - 4, align: 'center' });
      doc.font('Helvetica-Bold');
    }
  });
  y += 40;

  // === Décision ===
  doc.lineWidth(0.5).strokeColor(C.border);
  doc.rect(ml, y, usableW, 52).stroke();
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(C.dark);
  doc.text('DÉCISION DU CONSEIL DE CLASSE :', ml + 6, y + 4);

  doc.font('Helvetica').fontSize(7);
  doc.text('☐  L\'élève passe dans la classe supérieure', ml + 6, y + 16, { width: usableW * 0.48 });
  doc.text('☐  L\'élève double la classe', ml + 6, y + 28, { width: usableW * 0.48 });
  doc.text('☐  L\'élève a échoué', ml + 6, y + 40, { width: usableW * 0.48 });

  doc.font('Helvetica').fontSize(7);
  doc.text(`Fait à ${data.ville || '…………'}, le ……/……/……`, ml + usableW * 0.5, y + 16, { width: usableW * 0.48, align: 'right' });
  doc.font('Helvetica-Bold').text('Chef d\'Établissement', ml + usableW * 0.5, y + 30, { width: usableW * 0.48, align: 'right' });
  doc.font('Helvetica').text('(Noms & Signature)', ml + usableW * 0.5, y + 40, { width: usableW * 0.48, align: 'right' });

  y += 60;

  // === QR Code de vérification ===
  if (data.verifyUrl) {
    try {
      const qrBuffer = await QRCode.toBuffer(data.verifyUrl, {
        width: 80,
        margin: 1,
        color: { dark: C.primary, light: '#ffffff' },
      });
      const qrSize = 60;
      doc.image(qrBuffer, ml, y, { width: qrSize, height: qrSize });
      doc.font('Helvetica-Bold').fontSize(6).fillColor(C.muted);
      doc.text('Vérification QR', ml + qrSize + 6, y + 4, { width: 120 });
      doc.font('Helvetica').fontSize(5.5);
      doc.text('Scannez pour vérifier l\'authenticité', ml + qrSize + 6, y + 14, { width: 120 });
    } catch {
      // ignore QR errors
    }
  }

  // === Pied de page officiel ===
  const footerY = doc.page.height - 55;
  doc.moveTo(ml, footerY).lineTo(pageW - mr, footerY).lineWidth(0.5).strokeColor(C.border).stroke();

  doc.fillColor(C.dark).font('Helvetica-Bold').fontSize(6).text(
    'NOTE IMPORTANTE : Le bulletin est sans valeur s\'il est raturé ou surchargé.',
    ml, footerY + 5, { width: usableW, align: 'center' },
  );
  doc.font('Helvetica').fontSize(5.5).fillColor(C.muted);
  doc.text(
    'Interdiction formelle de reproduire ce bulletin sous peine des sanctions prévues par la loi.',
    ml, footerY + 13, { width: usableW, align: 'center' },
  );
  doc.font('Helvetica-Bold').fontSize(6).fillColor(C.dark);
  doc.text('IGE/P.S/004', ml, footerY + 22, { width: usableW, align: 'center' });
}

function fmt(v: number): string {
  if (v === 0) return '0';
  return v.toFixed(v % 1 === 0 ? 0 : 1);
}
