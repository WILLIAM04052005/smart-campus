import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import { verifyToken, JwtPayload } from "../utils/jwt";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

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

export function authorize(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Accès refusé pour ce rôle." });
    }
    next();
  };
}
