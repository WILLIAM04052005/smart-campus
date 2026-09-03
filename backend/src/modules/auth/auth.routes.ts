import { Router } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../../config/db";
import { signToken } from "../../utils/jwt";
import { authenticate } from "../../middleware/auth";
import { registerSchema, loginSchema } from "./auth.schema";

const router = Router();
const SALT_ROUNDS = 10; // coût du hash bcrypt : bon compromis sécurité/performance

// ================================================================
// POST /api/auth/register
// ================================================================
router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: "Données invalides", errors: parsed.error.flatten() });
  }

  const { email, password, firstName, lastName } = parsed.data;

  // On vérifie que l'email n'est pas déjà utilisé
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return res.status(409).json({ message: "Un compte existe déjà avec cet email." });
  }

  // ⚠️ IMPORTANT (sécurité) : on ne stocke JAMAIS le mot de passe en clair.
  // bcrypt.hash génère un "salt" aléatoire et produit un hash irréversible.
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // Sécurité : le rôle n'est JAMAIS pris depuis req.body ici. Sans cette
  // précaution, n'importe qui pourrait s'inscrire en tant que "ADMIN" en
  // ajoutant "role": "ADMIN" dans le corps de la requête. Tout nouvel
  // inscrit est STUDENT par défaut (valeur définie dans schema.prisma).
  // La promotion vers TEACHER/ADMIN se fera via une route protégée,
  // réservée aux admins (à construire dans un sprint ultérieur).
  const user = await prisma.user.create({
    data: { email, password: hashedPassword, firstName, lastName },
  });

  const token = signToken({ userId: user.id, role: user.role });

  res.status(201).json({
    token,
    user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role },
  });
});

// ================================================================
// POST /api/auth/login
// ================================================================
router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: "Données invalides", errors: parsed.error.flatten() });
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });

  // Message volontairement identique que l'email n'existe pas OU que le
  // mot de passe soit faux : ça évite de révéler à un attaquant si un
  // email est enregistré dans la base (bonne pratique de sécurité).
  if (!user) {
    return res.status(401).json({ message: "Email ou mot de passe incorrect." });
  }

  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) {
    return res.status(401).json({ message: "Email ou mot de passe incorrect." });
  }

  const token = signToken({ userId: user.id, role: user.role });

  res.json({
    token,
    user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role },
  });
});

// ================================================================
// GET /api/auth/me — retourne le profil de l'utilisateur connecté
// Route protégée : sert à vérifier qu'un token est valide et à
// récupérer les infos utilisateur côté frontend après un refresh.
// ================================================================
router.get("/me", authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { id: true, email: true, firstName: true, lastName: true, role: true },
  });

  if (!user) {
    return res.status(404).json({ message: "Utilisateur introuvable." });
  }

  res.json({ user });
});

export default router;
