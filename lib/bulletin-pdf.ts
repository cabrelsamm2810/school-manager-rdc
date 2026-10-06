/**
 * Génération de bulletin au format PDF avec QR code intégré.
 * Utilise pdfkit pour produire un PDF professionnel côté serveur.
 */

import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

export interface BulletinPdfData {
  eleveNom: string;
  eleveMatricule: string;
  classe: string;
  etablissementNom: string;
  periode: string;
  anneeScolaire: string;
  moyenneGenerale: number;
  pourcentageGeneral: number;
  mentionGenerale: string;
  generePar: string;
  createdAt: string;
  donnees: Array<{
    cours: string;
    devoir1: number;
    devoir2: number;
    examen: number;
    total: number;
    moyenne: number;
    pourcentage: number;
    mention: string;
  }>;
  verifyUrl: string;
}

const COLORS = {
  primary: '#1e3a5f',
  accent: '#2563eb',
  light: '#f1f5f9',
  border: '#cbd5e1',
  text: '#1e293b',
  muted: '#64748b',
};

const MENTION_COLORS: Record<string, [number, number, number]> = {
  'Excellent': [5, 150, 105],
  'Très Bien': [37, 99, 235],
  'Bien': [14, 165, 233],
  'Assez Bien': [245, 158, 11],
  'Passable': [249, 115, 22],
  'Insuffisant': [239, 68, 68],
};

/** Génère un PDF de bulletin et renvoie un Buffer. */
export async function generateBulletinPdf(data: BulletinPdfData): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Bulletin ${data.eleveNom} - ${data.periode}`,
          Author: 'School Manager RDC',
          Subject: 'Bulletin de notes',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      await renderBulletinPage(doc, data);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/** Génère un PDF unique multi-pages contenant plusieurs bulletins. */
export async function generateBulletinsPdf(items: BulletinPdfData[]): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Bulletins de classe`,
          Author: 'School Manager RDC',
          Subject: 'Bulletins de notes',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      for (let i = 0; i < items.length; i++) {
        if (i > 0) doc.addPage();
        await renderBulletinPage(doc, items[i]);
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/** Dessine un bulletin sur la page courante du document PDF. */
async function renderBulletinPage(doc: PDFKit.PDFDocument, data: BulletinPdfData): Promise<void> {

      const pageWidth = doc.page.width - 100; // marges 50 de chaque côté

      // === En-tête ===
      doc
        .fillColor(COLORS.primary)
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('School Manager RDC', 50, 50);

      doc
        .fillColor(COLORS.muted)
        .fontSize(10)
        .font('Helvetica')
        .text(data.etablissementNom || 'Établissement', 50, 73);

      // Bloc période (à droite)
      doc
        .fillColor(COLORS.muted)
        .fontSize(9)
        .text('Bulletin de notes', 0, 52, { width: pageWidth, align: 'right' })
        .fillColor(COLORS.text)
        .fontSize(13)
        .font('Helvetica-Bold')
        .text(data.periode, 0, 65, { width: pageWidth, align: 'right' })
        .fillColor(COLORS.muted)
        .fontSize(9)
        .font('Helvetica')
        .text(data.anneeScolaire, 0, 80, { width: pageWidth, align: 'right' });

      // Ligne de séparation
      doc
        .moveTo(50, 100)
        .lineTo(doc.page.width - 50, 100)
        .lineWidth(2)
        .strokeColor(COLORS.primary)
        .stroke();

      // === Informations élève ===
      let y = 115;
      const infoBoxHeight = 55;
      doc
        .fillColor(COLORS.light)
        .roundedRect(50, y, pageWidth, infoBoxHeight, 8)
        .fill();

      const colWidth = pageWidth / 2;
      const infoItems = [
        { label: 'Nom de l\'élève', value: data.eleveNom },
        { label: 'Matricule', value: data.eleveMatricule },
        { label: 'Classe', value: data.classe },
        { label: 'Établissement', value: data.etablissementNom || '—' },
      ];

      infoItems.forEach((item, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = 60 + col * colWidth;
        const iy = y + 8 + row * 24;

        doc
          .fillColor(COLORS.muted)
          .fontSize(8)
          .font('Helvetica')
          .text(item.label.toUpperCase(), x, iy);

        doc
          .fillColor(COLORS.text)
          .fontSize(11)
          .font('Helvetica-Bold')
          .text(item.value, x, iy + 11);
      });

      y += infoBoxHeight + 15;

      // === Tableau des cotes ===
      const tableX = 50;
      const colWidths = {
        cours: pageWidth * 0.28,
        d1: pageWidth * 0.09,
        d2: pageWidth * 0.09,
        exam: pageWidth * 0.09,
        total: pageWidth * 0.11,
        moy: pageWidth * 0.11,
        pct: pageWidth * 0.09,
        mention: pageWidth * 0.14,
      };

      // En-tête du tableau
      doc
        .fillColor(COLORS.primary)
        .roundedRect(tableX, y, pageWidth, 22, 4)
        .fill();

      let cx = tableX + 6;
      const headers = [
        { label: 'Cours', w: colWidths.cours },
        { label: 'D1', w: colWidths.d1, align: 'center' },
        { label: 'D2', w: colWidths.d2, align: 'center' },
        { label: 'Exam', w: colWidths.exam, align: 'center' },
        { label: 'Total', w: colWidths.total, align: 'center' },
        { label: 'Moy.', w: colWidths.moy, align: 'center' },
        { label: '%', w: colWidths.pct, align: 'center' },
        { label: 'Mention', w: colWidths.mention, align: 'center' },
      ];

      doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
      headers.forEach((h) => {
        doc.text(h.label, cx, y + 7, { width: h.w - 6, align: h.align as 'left' | 'center' | 'right' });
        cx += h.w;
      });

      y += 22;

      // Lignes du tableau
      doc.font('Helvetica').fontSize(8);
      data.donnees.forEach((d, i) => {
        const rowHeight = 20;
        if (i % 2 === 0) {
          doc.fillColor('#f8fafc').rect(tableX, y, pageWidth, rowHeight).fill();
        }

        cx = tableX + 6;
        doc.fillColor(COLORS.text);
        doc.font('Helvetica-Bold').text(d.cours, cx, y + 6, { width: colWidths.cours - 6 });
        cx += colWidths.cours;

        doc.font('Helvetica');
        doc.text(d.devoir1.toFixed(1), cx, y + 6, { width: colWidths.d1 - 6, align: 'center' });
        cx += colWidths.d1;
        doc.text(d.devoir2.toFixed(1), cx, y + 6, { width: colWidths.d2 - 6, align: 'center' });
        cx += colWidths.d2;
        doc.text(d.examen.toFixed(1), cx, y + 6, { width: colWidths.exam - 6, align: 'center' });
        cx += colWidths.exam;
        doc.font('Helvetica-Bold').text(d.total.toFixed(2), cx, y + 6, { width: colWidths.total - 6, align: 'center' });
        cx += colWidths.total;
        doc.text(d.moyenne.toFixed(2), cx, y + 6, { width: colWidths.moy - 6, align: 'center' });
        cx += colWidths.moy;
        doc.font('Helvetica').text(`${d.pourcentage}%`, cx, y + 6, { width: colWidths.pct - 6, align: 'center' });
        cx += colWidths.pct;

        const mentionColor = MENTION_COLORS[d.mention] || [100, 116, 139];
        const mentionHex = `#${mentionColor.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
        doc.fillColor(mentionHex).font('Helvetica-Bold');
        doc.text(d.mention, cx, y + 6, { width: colWidths.mention - 6, align: 'center' });

        y += rowHeight;
      });

      // Ligne moyenne générale
      y += 2;
      doc
        .fillColor(COLORS.primary)
        .roundedRect(tableX, y, pageWidth, 26, 4)
        .fill();

      doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold');
      cx = tableX + 6;
      doc.text('MOYENNE GÉNÉRALE', cx, y + 8, { width: colWidths.cours + colWidths.d1 + colWidths.d2 + colWidths.exam + colWidths.total - 6, align: 'right' });
      cx = tableX + colWidths.cours + colWidths.d1 + colWidths.d2 + colWidths.exam + colWidths.total;
      doc.fontSize(13).text(data.moyenneGenerale.toFixed(2), cx, y + 6, { width: colWidths.moy - 6, align: 'center' });
      cx += colWidths.moy;
      doc.fontSize(9).text(`${data.pourcentageGeneral}%`, cx, y + 8, { width: colWidths.pct - 6, align: 'center' });
      cx += colWidths.pct;
      doc.text(data.mentionGenerale, cx, y + 8, { width: colWidths.mention - 6, align: 'center' });

      y += 40;

      // === QR Code et vérification ===
      // Générer le QR code en buffer PNG
      const qrBuffer = await QRCode.toBuffer(data.verifyUrl, {
        width: 150,
        margin: 1,
        color: { dark: COLORS.primary, light: '#ffffff' },
      });

      const qrSize = 90;
      const qrX = 50;
      const qrY = y;

      // Bordure autour du QR
      doc
        .fillColor('#ffffff')
        .roundedRect(qrX - 4, qrY - 4, qrSize + 8, qrSize + 8, 6)
        .fill()
        .lineWidth(1)
        .strokeColor(COLORS.border)
        .roundedRect(qrX - 4, qrY - 4, qrSize + 8, qrSize + 8, 6)
        .stroke();

      doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });

      // Texte de vérification à côté du QR
      const textX = qrX + qrSize + 16;
      doc
        .fillColor(COLORS.text)
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('Vérification d\'authenticité', textX, qrY + 4);

      doc
        .fillColor(COLORS.muted)
        .fontSize(7)
        .font('Helvetica')
        .text(
          'Scannez ce QR code pour vérifier l\'authenticité de ce bulletin sur la plateforme School Manager RDC.',
          textX, qrY + 18, { width: 200 },
        );

      doc
        .fillColor(COLORS.muted)
        .fontSize(6)
        .font('Helvetica')
        .text(`Token: ${data.verifyUrl.split('token=')[1] || ''}`, textX, qrY + 50, { width: 200 });

      // Bloc génération (à droite)
      const genX = doc.page.width - 50 - 160;
      doc
        .fillColor(COLORS.muted)
        .fontSize(8)
        .font('Helvetica')
        .text('Généré par', genX, qrY + 4, { width: 160, align: 'right' })
        .fillColor(COLORS.text)
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(data.generePar, genX, qrY + 18, { width: 160, align: 'right' })
        .fillColor(COLORS.muted)
        .fontSize(7)
        .font('Helvetica')
        .text(new Date(data.createdAt).toLocaleDateString('fr-FR'), genX, qrY + 34, { width: 160, align: 'right' });

      // === Pied de page ===
      const footerY = doc.page.height - 60;
      doc
        .moveTo(50, footerY)
        .lineTo(doc.page.width - 50, footerY)
        .lineWidth(0.5)
        .strokeColor(COLORS.border)
        .stroke();

      doc
        .fillColor(COLORS.muted)
        .fontSize(7)
        .font('Helvetica')
        .text(
          'Document généré par School Manager RDC — Plateforme nationale de gestion scolaire de la RDC',
          50, footerY + 8, { width: pageWidth, align: 'center' },
        );
  }
