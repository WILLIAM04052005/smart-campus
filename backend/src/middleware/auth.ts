import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import { verifyToken, JwtPayload } from "../utils/jwt";

// On étend le type Request d'Express pour pouvoir attacher l'utilisateur
// décodé du token sur `req.user`, utilisable dans les routes suivantes.
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// --------------------------------------------------------------
// authenticate : vérifie que la requête contient un token JWT
// valide dans l'en-tête "Authorization: Bearer <token>".
// Bloque la requête (401) si absent ou invalide.
// --------------------------------------------------------------
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentification requise." });
  }

  const token = authHeader.split(" ")[1];

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    return res.status(401).json({ message: "Token invalide ou expiré." });
  }
}

// --------------------------------------------------------------
// authorize : contrôle des rôles (RBAC - Role-Based Access Control)
// À utiliser APRÈS authenticate. Exemple :
//   router.get("/admin-only", authenticate, authorize("ADMIN"), handler)
// --------------------------------------------------------------
export function authorize(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Accès refusé pour ce rôle." });
    }
    next();
  };
}
