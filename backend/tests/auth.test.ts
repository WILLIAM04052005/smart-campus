import request from "supertest";
import app from "../src/app";
import { prisma } from "../src/config/db";

const testEmail = `test-${Date.now()}@smart-campus.test`;
const testPassword = "motdepasse123";

describe("Authentification", () => {
  afterAll(async () => {
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
      expect(res.body.user.role).toBe("STUDENT");
      expect(res.body.user.password).toBeUndefined();
    });

    it("refuse un email déjà utilisé (409)", async () => {
      const res = await request(app).post("/api/auth/register").send({
        email: testEmail, 
        password: testPassword,
        firstName: "Doublon",
        lastName: "Test",
      });

      expect(res.status).toBe(409);
    });

    it("refuse un mot de passe trop court (400)", async () => {
      const res = await request(app).post("/api/auth/register").send({
        email: `short-${Date.now()}@smart-campus.test`,
        password: "123",
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
          role: "ADMIN", 
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
      const res = await request(app).post("/api/auth/login").send({
        email: "inexistant@smart-campus.test",
        password: testPassword,
      });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Email ou mot de passe incorrect.");
    });
  });
});
