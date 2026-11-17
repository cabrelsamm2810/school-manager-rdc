import { describe, expect, it } from 'vitest';
import { extractSchoolData } from '@/lib/ocr-school-parser';

/**
 * Vérifie que le texte brut renvoyé par l'OCR d'une photo est bien transformé
 * en liste d'écoles : en-têtes administratifs et bruit écartés, une ligne par
 * école, adresse / téléphone / chef d'établissement rattachés à la bonne école,
 * accents conservés et doublons supprimés.
 */

/** Sortie OCR réaliste d'une liste d'écoles photographiée. */
const OCR_LISTE = `RÉPUBLIQUE DÉMOCRATIQUE DU CONGO
MINISTÈRE DE L'EPST
PROVINCE ÉDUCATIONNELLE DE KINSHASA
Page 1/2
---oOo---
LISTE DES ÉCOLES DE LA COMMUNE DE GOMBE

1. École Primaire de Matadi
Avenue de la Libération n° 12, Commune de Matete
Tél : 0812 345 678
Directeur : M. Kasa

2. Institut Technique de Kinshasa
Boulevard du 30 Juin, Gombe
Chef d'établissement : Mme Ilunga

3. Complexe Scolaire Bon Berger
Quartier Salongo, Rue 7
0812345678
`;

const noms = (text: string) => extractSchoolData(text).rows.map((r) => r.nom);

describe('extractSchoolData — liste d’écoles issue d’une photo', () => {
  it('ne garde que les écoles, sans les en-têtes administratifs ni la pagination', () => {
    expect(noms(OCR_LISTE)).toEqual([
      'École Primaire de Matadi',
      'Institut Technique de Kinshasa',
      'Complexe Scolaire Bon Berger',
    ]);
    expect(extractSchoolData(OCR_LISTE).warnings).toEqual([]);
  });

  it('conserve les accents et la casse des noms lus sur la photo', () => {
    const [premiere] = extractSchoolData('École Primaire Saint-Joseph').rows;
    expect(premiere.nom).toBe('École Primaire Saint-Joseph');
  });

  it('rattache adresse, téléphone et chef d’établissement à la bonne école', () => {
    const [matadi, kinshasa, bonBerger] = extractSchoolData(OCR_LISTE).rows;

    expect(matadi).toMatchObject({
      adresse: 'Avenue de la Libération n° 12, Commune de Matete',
      telephone: '0812 345 678',
      chefEcole: 'M. Kasa',
    });
    expect(kinshasa).toMatchObject({
      adresse: 'Boulevard du 30 Juin, Gombe',
      telephone: '',
      chefEcole: 'Mme Ilunga',
    });
    expect(bonBerger).toMatchObject({ adresse: 'Quartier Salongo, Rue 7', telephone: '0812345678' });
  });

  it('retire la numérotation devant chaque école', () => {
    expect(noms('1. École A\n2) Institut B\n3 - Collège C')).toEqual([
      'École A', 'Institut B', 'Collège C',
    ]);
  });

  it('supprime les doublons du même nom (casse et accents indifférents)', () => {
    expect(noms('École Sainte-Marie\nECOLE SAINTE-MARIE\nInstitut Lumière')).toEqual([
      'École Sainte-Marie', 'Institut Lumière',
    ]);
  });

  it('garde un nom sans mot-clé mais composé de plusieurs mots', () => {
    expect(noms('Bon Berger\nSaint Joseph')).toEqual(['Bon Berger', 'Saint Joseph']);
  });

  it('ignore les en-têtes de colonnes d’un tableau photographié', () => {
    const texte = `N°  DÉNOMINATION  ADRESSE  TÉLÉPHONE
École Primaire de Matadi
Dénomination Adresse Téléphone Effectif`;
    expect(noms(texte)).toEqual(['École Primaire de Matadi']);
  });

  it('ignore les bandeaux d’en-tête quelle que soit leur casse', () => {
    const texte = `MINISTÈRE DE L'EPST
Sous-division de Gombe
Année scolaire 2024-2025
École du Centre`;
    expect(noms(texte)).toEqual(['École du Centre']);
  });

  it('ignore les lignes vides laissées par l’OCR (espaces, caractères invisibles, séparateurs)', () => {
    const texte = 'École du Centre\n\n   \n\u200b\n· · ·\n  .  \nInstitut Lumière';
    expect(noms(texte)).toEqual(['École du Centre', 'Institut Lumière']);
  });

  it('garde un nom d’école écrit en majuscules', () => {
    expect(noms('ÉCOLE PRIMAIRE DE MATADI\nINSTITUT TECHNIQUE DE KINSHASA')).toEqual([
      'ÉCOLE PRIMAIRE DE MATADI', 'INSTITUT TECHNIQUE DE KINSHASA',
    ]);
  });

  it('ignore les lignes de bruit seules (dates, séparateurs, numéros)', () => {
    const rows = noms(`Kinshasa, le 12/03/2024
----------
12
École du Centre`);
    expect(rows).toEqual(['École du Centre']);
  });

  it('attribue une confiance élevée aux noms contenant un mot-clé d’école', () => {
    const { confidences } = extractSchoolData('Institut Lumière\nBon Berger');

    expect(confidences[0].nom).toBe('high');
    expect(confidences[1].nom).toBe('medium');
  });

  it('ne renvoie aucune école et un avertissement pour du texte illisible', () => {
    const vide = extractSchoolData('   \n\n  ');
    expect(vide.rows).toEqual([]);
    expect(vide.warnings[0]).toContain('Aucun texte détecté');

    const bruit = extractSchoolData('Page 2\n---\n12');
    expect(bruit.rows).toEqual([]);
    expect(bruit.warnings[0]).toContain('Aucune ligne valide');
  });

  it('plafonne à 500 écoles et prévient quand la photo en contient davantage', () => {
    const texte = Array.from({ length: 520 }, (_, i) => `École numéro ${i + 1}`).join('\n');
    const { rows, warnings } = extractSchoolData(texte);

    expect(rows).toHaveLength(500);
    expect(warnings[0]).toContain('Seules les 500 premières');
  });
});
