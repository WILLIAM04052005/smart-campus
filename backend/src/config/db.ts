// Instance unique de PrismaClient, réutilisée dans toute l'application
// (évite de créer une nouvelle connexion à chaque requête).
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();
