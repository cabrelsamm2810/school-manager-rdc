'use client';

import { useState } from 'react';

type Eleve = {
  id: string;
  matricule: string;
  nom: string;
  postNom: string;
  prenom: string;
  classe: string;
  sexe: string;
  ecole: { id: string; nom: string } | null;
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatDateShort(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function DossierEleveExportButton({ eleve }: { eleve: Eleve }) {
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      // Récupérer toutes les données du dossier
      const [docsRes, resultatsRes, interactionsRes] = await Promise.all([
        fetch(`/api/eleves/${eleve.id}/documents`),
        fetch(`/api/eleves/${eleve.id}/resultats`),
        fetch(`/api/eleves/${eleve.id}/interactions`),
      ]);

      const docs = await docsRes.json().catch(() => []);
      const resultats = await resultatsRes.json().catch(() => []);
      const interactions = await interactionsRes.json().catch(() => []);

      const html = buildPdfHtml(eleve, docs, resultats, interactions);

      // Ouvrir dans une nouvelle fenêtre et imprimer
      const printWindow = window.open('', '_blank', 'width=800,height=900');
      if (!printWindow) {
        alert('Veuillez autoriser les pop-ups pour exporter le dossier en PDF.');
        return;
      }
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      // Attendre que le contenu soit rendu avant d'imprimer
      printWindow.onload = () => {
        setTimeout(() => printWindow.print(), 300);
      };
      // Fallback si onload ne se déclenche pas
      setTimeout(() => {
        try { printWindow.print(); } catch { /* déjà imprimé */ }
      }, 1000);
    } catch {
      alert('Erreur lors de l\'export du dossier.');
    }
    setExporting(false);
  }

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100 disabled:opacity-50"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
        <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z" />
      </svg>
      {exporting ? 'Préparation…' : 'Export PDF'}
    </button>
  );
}

function escapeHtml(str: string) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildPdfHtml(
  eleve: Eleve,
  docs: any[],
  resultats: any[],
  interactions: any[],
) {
  const fullName = `${eleve.prenom} ${eleve.nom}${eleve.postNom ? ' ' + eleve.postNom : ''}`;
  const now = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  const etabName = eleve.ecole?.nom || '—';

  const docsRows = docs.length
    ? docs.map((d: any) => `
      <tr>
        <td>${escapeHtml(d.type || '—')}</td>
        <td>${escapeHtml(d.titre)}</td>
        <td>${escapeHtml(d.description || '—')}</td>
        <td>${escapeHtml(d.uploadedBy || '—')}</td>
        <td>${d.createdAt ? formatDateShort(d.createdAt) : '—'}</td>
      </tr>`).join('')
    : '<tr><td colspan="5" class="empty">Aucun document</td></tr>';

  const resultatsRows = resultats.length
    ? resultats.map((r: any) => `
      <tr>
        <td>${escapeHtml(r.periode)}</td>
        <td>${escapeHtml(r.matiere || '—')}</td>
        <td class="center">${escapeHtml(r.note || '—')}</td>
        <td class="center">${escapeHtml(r.moyenne || '—')}</td>
        <td>${escapeHtml(r.mention || '—')}</td>
        <td>${escapeHtml(r.appreciation || '—')}</td>
      </tr>`).join('')
    : '<tr><td colspan="6" class="empty">Aucun résultat</td></tr>';

  const interactionsRows = interactions.length
    ? interactions.map((it: any) => `
      <tr>
        <td>${it.date ? formatDateShort(it.date) : '—'}</td>
        <td>${escapeHtml(it.type)}</td>
        <td>${escapeHtml(it.sujet)}</td>
        <td>${escapeHtml(it.description || '—')}</td>
        <td>${escapeHtml(it.intervenant || '—')}</td>
        <td>${escapeHtml(it.statut || '—')}</td>
      </tr>`).join('')
    : '<tr><td colspan="6" class="empty">Aucune interaction enregistrée</td></tr>';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Dossier de ${escapeHtml(fullName)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
      color: #1e293b;
      line-height: 1.5;
      padding: 32px;
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .header-left h1 { font-size: 20px; color: #1e3a8a; margin-bottom: 4px; }
    .header-left p { font-size: 12px; color: #64748b; }
    .header-right { text-align: right; font-size: 11px; color: #64748b; }
    .student-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px 20px;
      margin-bottom: 24px;
    }
    .student-card h2 { font-size: 18px; color: #0f172a; margin-bottom: 8px; }
    .student-info { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px; font-size: 13px; }
    .student-info .label { color: #64748b; font-weight: 600; }
    .section { margin-bottom: 24px; }
    .section-title {
      font-size: 14px;
      font-weight: 700;
      color: #1e3a8a;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 6px;
      margin-bottom: 10px;
    }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th {
      background: #f1f5f9;
      text-align: left;
      padding: 8px 10px;
      font-weight: 600;
      color: #475569;
      border-bottom: 1px solid #e2e8f0;
    }
    td {
      padding: 8px 10px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: top;
    }
    td.center { text-align: center; }
    .empty { text-align: center; color: #94a3b8; font-style: italic; padding: 16px; }
    .footer {
      margin-top: 32px;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
      font-size: 10px;
      color: #94a3b8;
      text-align: center;
    }
    @media print {
      body { padding: 16px; }
      .no-print { display: none; }
      @page { margin: 1.5cm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <h1>📋 Dossier Scolaire</h1>
      <p>School Manager RDC — Gestion des élèves</p>
    </div>
    <div class="header-right">
      <p>Établit le ${now}</p>
      <p>${escapeHtml(etabName)}</p>
    </div>
  </div>

  <div class="student-card">
    <h2>${escapeHtml(fullName)}</h2>
    <div class="student-info">
      <div><span class="label">Matricule :</span> ${escapeHtml(eleve.matricule)}</div>
      <div><span class="label">Classe :</span> ${escapeHtml(eleve.classe)}</div>
      <div><span class="label">Sexe :</span> ${eleve.sexe === 'M' ? 'Masculin' : eleve.sexe === 'F' ? 'Féminin' : '—'}</div>
      <div><span class="label">École :</span> ${escapeHtml(etabName)}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">📁 Documents (${docs.length})</div>
    <table>
      <thead><tr>
        <th>Type</th><th>Titre</th><th>Description</th><th>Déposé par</th><th>Date</th>
      </tr></thead>
      <tbody>${docsRows}</tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">📊 Résultats scolaires (${resultats.length})</div>
    <table>
      <thead><tr>
        <th>Période</th><th>Matière</th><th>Note</th><th>Moyenne</th><th>Mention</th><th>Appréciation</th>
      </tr></thead>
      <tbody>${resultatsRows}</tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">🕐 Historique des interactions (${interactions.length})</div>
    <table>
      <thead><tr>
        <th>Date</th><th>Type</th><th>Sujet</th><th>Description</th><th>Intervenant</th><th>Statut</th>
      </tr></thead>
      <tbody>${interactionsRows}</tbody>
    </table>
  </div>

  <div class="footer">
    Document généré par School Manager RDC — ${now}
  </div>
</body>
</html>`;
}
