import { z } from 'zod';

export const roleEnum = z.enum([
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

export const registerInputSchema = z.object({
  nom: z.string().min(2, 'Le nom est obligatoire.'),
  postNom: z.string().min(2, 'Le post-nom est obligatoire.').optional().or(z.literal('')),
  prenom: z.string().min(2, 'Le prénom est obligatoire.'),
  email: z.string().email('Email invalide.'),
  telephone: z.string().min(8, 'Le téléphone est invalide.').optional().or(z.literal('')),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères.'),
  role: roleEnum
});

export const loginInputSchema = z.object({
  email: z.string().email('Email invalide.'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères.')
});
