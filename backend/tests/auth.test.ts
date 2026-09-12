import request from "supertest";
import app from "../src/app";
import { prisma } from "../src/config/db";

// On utilise un email unique à chaque exécution (timestamp) pour éviter
// tout conflit avec des données déjà présentes en base, et on nettoie
// tout ce qu'on a créé à la fin (voir afterAll).
const testEmail = `test-${Date.now()}@smart-campus.test`;
const testPassword = "motdepasse123";

describe("Authentification", () => {
  afterAll(async () => {
    // Nettoyage : on supprime le compte de test créé pendant ces tests,
    // pour ne pas polluer la base de données au fil des exécutions.
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await prisma.$disconnect();
  });

  describe("POST /api/auth/register", () => {
    it("crée un compte avec des données valides et renvoie un token", async () => {
      const res = await request(app).post("/api/auth/register").send({
        email: testEmail,
        password: testPassword,
        firstName: "Test",
        lastName: "Utilisateur",
      });

      expect(res.status).toBe(201);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(testEmail);
      // Le rôle doit TOUJOURS être STUDENT par défaut, même si on essaie
      // d'envoyer autre chose (voir test de sécurité plus bas).
      expect(res.body.user.role).toBe("STUDENT");
      // Le mot de passe ne doit JAMAIS être renvoyé dans la réponse.
      expect(res.body.user.password).toBeUndefined();
    });

    it("refuse un email déjà utilisé (409)", async () => {
      const res = await request(app).post("/api/auth/register").send({
        email: testEmail, // déjà créé par le test précédent
        password: testPassword,
        firstName: "Doublon",
        lastName: "Test",
      });

      expect(res.status).toBe(409);
    });

    it("refuse un mot de passe trop court (400)", async () => {
      const res = await request(app).post("/api/auth/register").send({
        email: `short-${Date.now()}@smart-campus.test`,
        password: "123", // moins de 8 caractères
        firstName: "Test",
        lastName: "Test",
      });

      expect(res.status).toBe(400);
    });

    it("ignore un rôle envoyé par le client (faille de sécurité classique)", async () => {
      const email = `admin-attempt-${Date.now()}@smart-campus.test`;
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          email,
          password: testPassword,
          firstName: "Attaquant",
          lastName: "Test",
          role: "ADMIN", // tentative d'auto-promotion, doit être ignorée
        });

      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe("STUDENT");

      await prisma.user.deleteMany({ where: { email } });
    });
  });

  describe("POST /api/auth/login", () => {
    it("connecte avec les bons identifiants", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: testEmail,
        password: testPassword,
      });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
    });

    it("refuse un mauvais mot de passe (401)", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: testEmail,
        password: "mauvais-mot-de-passe",
      });

      expect(res.status).toBe(401);
    });

    it("refuse un email inexistant avec le même message d'erreur (401)", async () => {
      // Le message doit être identique à celui du mauvais mot de passe,
      // pour ne pas révéler si un email est enregistré ou non.
      const res = await request(app).post("/api/auth/login").send({
        email: "inexistant@smart-campus.test",
        password: testPassword,
      });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Email ou mot de passe incorrect.");
    });
  });
});
