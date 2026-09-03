import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET as string;

if (!JWT_SECRET) {
  // On préfère planter au démarrage plutôt que de signer des tokens
  // avec un secret vide (faille de sécurité classique).
  throw new Error("JWT_SECRET manquant dans le fichier .env");
}

export interface JwtPayload {
  userId: string;
  role: Role;
}

// Génère un token signé, valable 7 jours.
// On y stocke le minimum nécessaire (id + rôle), jamais le mot de passe.
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

// Vérifie et décode un token. Lance une erreur s'il est invalide/expiré.
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}
