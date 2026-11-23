/**
 * Fiche PDF du Profil École.
 *
 * Génère côté serveur (pdfkit + qrcode) une fiche A4 professionnelle :
 * identification de l'établissement, localisation, contact, direction,
 * sections/options et QR code officiel de l'école.
 *
 * Le QR encode la valeur fournie par le serveur (`qrPayload`) : code école
 * public + jeton de l'école, jamais de donnée personnelle.
 */

import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { INSTITUTION_MAP } from '@/lib/institutions';

export type EcoleProfilPdfEcole = {
  nom: string;
  type: string;
  institution: string;
  dinacope: string;
  province: string;
  provinceEducationnelle: string;
  ville: string;
  commune: string;
  adresse: string;
  telephone: string;
  email: string;
  chefEcole: string;
  identifiantSM: string | null;
  effectif: number;
  statut: string;
  statutValidation: string;
  coordSousProvinciale: { nom: string } | null;
  ecErc: { nom: string } | null;
};

export type EcoleProfilPdfChef = {
  nom: string;
  postNom: string | null;
  prenom: string;
  email: string;
  telephone: string;
};

export type EcoleProfilPdfSection = {
  type: string;
  nom: string;
  cycle: string;
  statut: string;
};

export type EcoleProfilPdfData = {
  ecole: EcoleProfilPdfEcole;
  profil: { codeEcole: string; createdAt: Date | string };
  chef: EcoleProfilPdfChef | null;
  sections: EcoleProfilPdfSection[];
  qrPayload: string;
  generatedBy: string;
};

const COLORS = {
  primary: '#1e3a5f',
  accent: '#2563eb',
  text: '#1e293b',
  muted: '#64748b',
  border: '#e2e8f0',
  light: '#f8fafc',
  bandMuted: '#93b3d4',
  bandText: '#c7d7e8',
};

const MARGIN = 45;
const WIDTH = 595.28 - MARGIN * 2;

type GridItem = { label: string; value: string; span?: number };

function clean(value: string | null | undefined): string {
  return (value ?? '').trim() || '—';
}

function formatDate(value: Date | string): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function sectionTitle(doc: PDFKit.PDFDocument, y: number, title: string): number {
  doc
    .fillColor(COLORS.accent)
    .font('Helvetica-Bold')
    .fontSize(8.5)
    .text(title.toUpperCase(), MARGIN, y, { characterSpacing: 0.9 });
  doc
    .moveTo(MARGIN, y + 13)
    .lineTo(MARGIN + WIDTH, y + 13)
    .lineWidth(0.8)
    .strokeColor(COLORS.border)
    .stroke();
  return y + 23;
}

function drawGrid(doc: PDFKit.PDFDocument, y: number, items: GridItem[], cols = 3): number {
  const colWidth = WIDTH / cols;
  const rowHeight = 32;
  let x = MARGIN;
  let row = 0;

  for (const item of items) {
    const span = Math.min(Math.max(item.span ?? 1, 1), cols);
    if (x + span * colWidth > MARGIN + WIDTH + 0.5) {
      x = MARGIN;
      row += 1;
    }
    const top = y + row * rowHeight;
    doc
      .fillColor(COLORS.muted)
      .font('Helvetica-Bold')
      .fontSize(6.5)
      .text(item.label.toUpperCase(), x, top, { width: span * colWidth - 10, characterSpacing: 0.6 });
    doc
      .fillColor(COLORS.text)
      .font('Helvetica-Bold')
      .fontSize(9.5)
      .text(clean(item.value), x, top + 10, { width: span * colWidth - 10, height: 12, ellipsis: true });
    x += span * colWidth;
  }

  return y + (row + 1) * rowHeight;
}

function drawFooter(doc: PDFKit.PDFDocument, data: EcoleProfilPdfData): void {
  const y = doc.page.height - 66;
  doc
    .moveTo(MARGIN, y)
    .lineTo(MARGIN + WIDTH, y)
    .lineWidth(0.8)
    .strokeColor(COLORS.border)
    .stroke();
  // `lineBreak: false` + `height` empêchent pdfkit de créer une nouvelle page
  // depuis ce pied de page : un saut de page déclencherait `pageAdded`, qui le
  // redessinerait → récursion infinie.
  doc
    .fillColor(COLORS.muted)
    .font('Helvetica')
    .fontSize(7.5)
    .text(`Généré le ${formatDate(new Date())} par ${data.generatedBy}`, MARGIN, y + 7, {
      width: WIDTH / 2,
      height: 10,
      lineBreak: false,
    });
  doc
    .fillColor(COLORS.muted)
    .font('Helvetica')
    .fontSize(7.5)
    .text('School Manager RDC', MARGIN, y + 7, { width: WIDTH, height: 10, align: 'right', lineBreak: false });
  doc
    .fillColor(COLORS.muted)
    .font('Helvetica')
    .fontSize(7.5)
    .text('Le QR Code identifie l’établissement ; aucune donnée personnelle n’y est encodée.', MARGIN, y + 18, {
      width: WIDTH,
      height: 10,
      lineBreak: false,
    });
}

/** Génère la fiche PDF du profil école et renvoie le Buffer du document. */
export async function generateEcoleProfilPdf(data: EcoleProfilPdfData): Promise<Buffer> {
  const qrPng = await QRCode.toBuffer(data.qrPayload, {
    type: 'png',
    width: 320,
    margin: 1,
    color: { dark: '#0f172a', light: '#ffffff' },
  });

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: MARGIN,
        info: {
          Title: `Fiche école — ${data.ecole.nom}`,
          Author: 'School Manager RDC',
          Subject: `Profil de l’établissement ${data.profil.codeEcole}`,
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      doc.on('pageAdded', () => drawFooter(doc, data));

      renderFiche(doc, data, qrPng);
      drawFooter(doc, data);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

function renderFiche(doc: PDFKit.PDFDocument, data: EcoleProfilPdfData, qrPng: Buffer): void {
  const { ecole, profil, chef, sections } = data;
  const inst = INSTITUTION_MAP[ecole.institution];
  const bandHeight = 112;

  // ── En-tête ──
  doc.roundedRect(MARGIN, MARGIN, WIDTH, bandHeight, 10).fill(COLORS.primary);

  doc
    .fillColor(COLORS.bandMuted)
    .font('Helvetica-Bold')
    .fontSize(7)
    .text('PROFIL OFFICIEL D’ÉTABLISSEMENT SCOLAIRE', MARGIN + 18, MARGIN + 15, { characterSpacing: 1.2 });
  doc
    .fillColor('#ffffff')
    .font('Helvetica-Bold')
    .fontSize(16)
    .text(ecole.nom, MARGIN + 18, MARGIN + 29, { width: WIDTH - 160, height: 40, ellipsis: true });
  doc
    .fillColor(COLORS.bandText)
    .font('Helvetica')
    .fontSize(8.5)
    .text([ecole.type, inst?.label || ecole.institution].filter(Boolean).join(' · '), MARGIN + 18, MARGIN + 72, {
      width: WIDTH - 160,
      height: 12,
      ellipsis: true,
    });
  doc
    .fillColor(COLORS.bandMuted)
    .font('Helvetica-Bold')
    .fontSize(6.5)
    .text('CODE ÉCOLE', MARGIN + 18, MARGIN + 89, { characterSpacing: 1 });
  doc
    .fillColor('#ffffff')
    .font('Helvetica-Bold')
    .fontSize(11)
    .text(profil.codeEcole, MARGIN + 18, MARGIN + 98, { characterSpacing: 0.6 });

  // QR code (carte blanche dans la bande)
  const cardSize = 100;
  const cardX = MARGIN + WIDTH - cardSize - 14;
  const cardY = MARGIN + (bandHeight - cardSize) / 2;
  doc.roundedRect(cardX, cardY, cardSize, cardSize, 8).fill('#ffffff');
  doc.image(qrPng, cardX + 8, cardY + 8, { fit: [cardSize - 16, cardSize - 16] });

  let y = MARGIN + bandHeight + 22;

  // ── Identification ──
  y = sectionTitle(doc, y, 'Identification');
  y = drawGrid(doc, y, [
    { label: 'Nom officiel', value: ecole.nom, span: 2 },
    { label: 'Type', value: ecole.type },
    { label: 'Institution', value: inst?.label || ecole.institution },
    { label: 'DINACOPE', value: ecole.dinacope },
    { label: 'Identifiant School Manager', value: ecole.identifiantSM ?? '' },
    { label: 'Code école', value: profil.codeEcole },
    { label: 'Effectif déclaré', value: ecole.effectif.toLocaleString('fr-FR') },
    { label: 'Statut administratif', value: ecole.statut },
    { label: 'Validation', value: ecole.statutValidation },
  ]);
  y += 6;

  // ── Localisation & contact ──
  y = sectionTitle(doc, y, 'Localisation & contact');
  y = drawGrid(doc, y, [
    { label: 'Province administrative', value: ecole.province },
    { label: 'Province éducationnelle', value: ecole.provinceEducationnelle },
    { label: 'Ville', value: ecole.ville },
    { label: 'Commune', value: ecole.commune },
    { label: 'Adresse', value: ecole.adresse, span: 2 },
    { label: 'Structure de rattachement', value: ecole.coordSousProvinciale?.nom || ecole.ecErc?.nom || '' },
    { label: 'Téléphone', value: ecole.telephone },
    { label: 'Email', value: ecole.email },
  ]);
  y += 6;

  // ── Direction ──
  y = sectionTitle(doc, y, 'Direction');
  y = drawGrid(doc, y, [
    { label: 'Chef d’établissement', value: ecole.chefEcole, span: 2 },
    { label: 'Compte associé', value: chef ? [chef.nom, chef.postNom, chef.prenom].filter(Boolean).join(' ') : 'Aucun compte associé' },
    { label: 'Email du compte', value: chef?.email ?? '' },
    { label: 'Téléphone du compte', value: chef?.telephone ?? '' },
    { label: 'Profil créé le', value: formatDate(profil.createdAt) },
  ]);
  y += 6;

  // ── Sections & options ──
  y = sectionTitle(doc, y, 'Sections & options');
  const colWidths = [WIDTH * 0.18, WIDTH * 0.42, WIDTH * 0.22, WIDTH * 0.18];

  if (sections.length === 0) {
    doc.fillColor(COLORS.muted).font('Helvetica-Oblique').fontSize(9).text('Aucune section enregistrée.', MARGIN, y + 2);
    return;
  }

  const drawTableHeader = (top: number) => {
    doc.roundedRect(MARGIN, top, WIDTH, 20, 4).fill(COLORS.primary);
    let x = MARGIN + 6;
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(7.5);
    ['Type', 'Section / option', 'Cycle', 'Statut'].forEach((label, i) => {
      doc.text(label.toUpperCase(), x, top + 6, { width: colWidths[i] - 8, characterSpacing: 0.5 });
      x += colWidths[i];
    });
    return top + 20;
  };

  y = drawTableHeader(y);

  sections.forEach((section, index) => {
    if (y + 20 > doc.page.height - 90) {
      doc.addPage();
      y = drawTableHeader(MARGIN + 10);
    }
    if (index % 2 === 0) {
      doc.rect(MARGIN, y, WIDTH, 20).fill(COLORS.light);
    }
    let x = MARGIN + 6;
    const values = [section.type, section.nom, section.cycle, section.statut];
    doc.fillColor(COLORS.text).font('Helvetica').fontSize(8.5);
    values.forEach((value, i) => {
      doc.text(clean(value), x, y + 6, { width: colWidths[i] - 8, height: 10, ellipsis: true });
      x += colWidths[i];
    });
    y += 20;
  });
}
