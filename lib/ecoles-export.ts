/**
 * Génération du fichier Excel des écoles, partagée par l'export du module
 * Écoles (`/api/ecoles/export`) et celui de la console Admin SMD
 * (`/api/admin-smd/ecoles/export`) : mêmes colonnes, même mise en forme.
 */

import * as XLSX from 'xlsx';
import { INSTITUTION_MAP } from '@/lib/institutions';

export type EcoleExportRow = {
  province: string;
  provinceEducationnelle: string;
  commune: string;
  ville: string;
  nom: string;
  identifiantSM: string | null;
  dinacope: string;
  type: string;
  institution: string;
  chefEcole: string;
  telephone: string;
  email: string;
  adresse: string;
  effectif: number;
  statut: string;
  statutValidation: string;
  coordSousProvinciale?: { nom: string } | null;
  ecErc?: { nom: string } | null;
};

/** Enlève les accents et caractères non sûrs d'un nom de fichier. */
function slug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

/** Construit le classeur Excel (.xlsx) à partir des écoles filtrées. */
export function buildEcolesWorkbook(ecoles: EcoleExportRow[]) {
  const rows = ecoles.map((e) => ({
    Province: e.province || '',
    'Province éducationnelle': e.provinceEducationnelle || '',
    Commune: e.commune || '',
    Ville: e.ville || '',
    'Nom de l\u2019école': e.nom,
    'Identifiant SM': e.identifiantSM || '',
    DINACOPE: e.dinacope || '',
    Niveau: e.type || '',
    Institution: INSTITUTION_MAP[e.institution]?.label?.split('—')[0]?.trim() || e.institution,
    'Chef d\u2019établissement': e.chefEcole || '',
    Téléphone: e.telephone || '',
    Email: e.email || '',
    Adresse: e.adresse || '',
    Effectif: e.effectif,
    Statut: e.statut,
    'Statut de validation': e.statutValidation,
    'Structure de rattachement': e.coordSousProvinciale?.nom || e.ecErc?.nom || '',
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 22 }, { wch: 26 }, { wch: 18 }, { wch: 16 }, { wch: 36 },
    { wch: 18 }, { wch: 16 }, { wch: 18 }, { wch: 22 }, { wch: 28 },
    { wch: 16 }, { wch: 26 }, { wch: 36 }, { wch: 10 }, { wch: 12 },
    { wch: 26 }, { wch: 30 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Écoles');
  return new Uint8Array(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
}

/** Nom du fichier téléchargé, ex. `ecoles_kinshasa_2026-11-17.xlsx`. */
export function ecolesExportFilename(province?: string | null): string {
  const date = new Date().toISOString().slice(0, 10);
  return `ecoles_${province ? `${slug(province)}_` : ''}${date}.xlsx`;
}
