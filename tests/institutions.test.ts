import { describe, expect, it } from 'vitest';
import {
  INSTITUTIONS,
  STRUCTURE_CATEGORIES,
  institutionsForCategorie,
  isPrivateInstitution,
  parseDateCreation,
} from '@/lib/institutions';
import { registrationRoleOptions, rolesByStructureCategorie, schoolBureauxByRole } from '@/lib/meta-data';
import { describeRolePermissions } from '@/lib/structure-permissions';
import { buildScopeWhere } from '@/lib/territory-filter';

describe('structure institutionnelle', () => {
  it('couvre les quatre catégories de structure', () => {
    expect(STRUCTURE_CATEGORIES.map((c) => c.code)).toEqual([
      'PUBLIC',
      'CONVENTIONNE',
      'PRIVE_AGREE',
      'PRIVE_INDEPENDANT',
    ]);
  });

  it('rattache chaque institution à une catégorie connue', () => {
    const categories = new Set(STRUCTURE_CATEGORIES.map((c) => c.code));
    for (const institution of INSTITUTIONS) {
      expect(categories.has(institution.categorie)).toBe(true);
    }
  });

  it('regroupe les institutions conventionnées', () => {
    expect(institutionsForCategorie('CONVENTIONNE').map((i) => i.code)).toEqual([
      'EC_ERC',
      'CATHOLIQUE',
      'ISLAMIQUE',
    ]);
  });

  it('distingue les établissements privés', () => {
    expect(isPrivateInstitution('INDEPENDANTE')).toBe(true);
    expect(isPrivateInstitution('PRIVE_AGREE')).toBe(true);
    expect(isPrivateInstitution('PUBLIQUE')).toBe(false);
    expect(isPrivateInstitution('EC_ERC')).toBe(false);
  });
});

describe('inscription publique', () => {
  it('ne propose aucun profil d’administration', () => {
    const values = registrationRoleOptions.map((r) => r.value);
    for (const admin of [
      'COORDINATION_NATIONALE',
      'COORDINATION_PROVINCIALE',
      'COORDINATION_SOUS_PROVINCIALE',
      'CHEF_ADMINISTRATION',
      'AGENT_PROVINCIAL',
    ]) {
      expect(values).not.toContain(admin);
    }
  });

  it('adapte les rôles à la structure sélectionnée', () => {
    expect(rolesByStructureCategorie.PUBLIC).not.toContain('PROMOTEUR');
    expect(rolesByStructureCategorie.PRIVE_INDEPENDANT).toContain('PROMOTEUR');
  });

  it('décrit les permissions réelles du rôle, limitées à l’établissement', () => {
    const summary = describeRolePermissions('DIRECTION_ECOLE');
    expect(summary.items).toContain('Gestion de l’établissement');
    expect(summary.items.join(' ')).not.toContain('Coordination');
  });

  it('propose un bureau d’affectation aux rôles d’établissement', () => {
    expect(schoolBureauxByRole.DIRECTION_ECOLE.length).toBeGreaterThan(0);
    expect(schoolBureauxByRole.ENSEIGNANT.length).toBeGreaterThan(0);
  });

  it('limite les utilisateurs d’un établissement à leur école', () => {
    const where = buildScopeWhere(
      { id: 'u1', role: 'DIRECTION_ECOLE', ecoleId: 'ecole-1', typeInstitution: 'EC_ERC' },
      { provinceField: false, institutionField: false, ecoleField: 'ecoleId' },
    );
    expect(where).toEqual({ ecoleId: 'ecole-1' });
  });
});

describe('profil école', () => {
  it('parse la date de création', () => {
    expect(parseDateCreation('2024-09-01')?.toISOString().slice(0, 10)).toBe('2024-09-01');
    expect(parseDateCreation('')).toBeNull();
    expect(parseDateCreation('pas-une-date')).toBeNull();
  });
});
