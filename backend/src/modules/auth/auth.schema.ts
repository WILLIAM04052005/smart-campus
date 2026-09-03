import { z } from "zod";

// Validation des données envoyées à l'inscription.
// zod nous évite d'écrire des `if` de validation à la main, et donne
// des messages d'erreur clairs et cohérents.
export const registerSchema = z.object({
  email: z.string().email("Email invalide."),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères."),
  firstName: z.string().min(1, "Le prénom est requis."),
  lastName: z.string().min(1, "Le nom est requis."),
  // Le rôle est optionnel à l'inscription : par défaut STUDENT.
  // (Dans une vraie appli, seul un admin pourrait créer un TEACHER/ADMIN —
  // voir la remarque de sécurité dans auth.routes.ts)
});

export const loginSchema = z.object({
  email: z.string().email("Email invalide."),
  password: z.string().min(1, "Mot de passe requis."),
});
