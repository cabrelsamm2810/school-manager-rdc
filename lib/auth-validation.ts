import { z } from 'zod';

export const userRoleSchema = z.enum([
  'SUPER_ADMIN',
  'COORDINATION_NATIONALE',
  'COORDINATION_PROVINCIALE',
  'AGENT_PROVINCIAL',
  'COORDINATION_SOUS_PROVINCIALE',
  'AGENT_SOUS_PROVINCIAL',
  'DIRECTION_ECOLE',
  'ENSEIGNANT',
  'PARENT',
  'ELEVE'
]);

export const registerSchema = z.object({
  nom: z.string().min(2, 'Le nom est obligatoire.'),
  postNom: z.string().optional().or(z.literal('')),
  prenom: z.string().min(2, 'Le prénom est obligatoire.'),
  email: z.string().email('Email invalide.'),
  telephone: z.string().optional().or(z.literal('')),
  password: z.string().min(8, 'Le mot de passe doit faire au moins 8 caractères.'),
  role: userRoleSchema
});

export const loginSchema = z.object({
  email: z.string().email('Email invalide.'),
  password: z.string().min(8, 'Le mot de passe doit faire au moins 8 caractères.')
});
