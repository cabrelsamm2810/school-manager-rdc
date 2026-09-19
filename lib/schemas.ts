import { z } from 'zod';

export const registerSchema = z.object({
  nom: z.string().min(2, 'Le nom est obligatoire.'),
  postNom: z.string().optional().or(z.literal('')),
  prenom: z.string().min(2, 'Le prénom est obligatoire.'),
  email: z.string().email('L’adresse email est invalide.'),
  telephone: z.string().optional().or(z.literal('')),
  password: z.string().min(8, 'Le mot de passe doit faire au moins 8 caractères.'),
  role: z.enum([
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
  ])
});

export const loginSchema = z.object({
  email: z.string().email('L’adresse email est invalide.'),
  password: z.string().min(8, 'Le mot de passe doit faire au moins 8 caractères.')
});
