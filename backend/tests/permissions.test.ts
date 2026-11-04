import request from "supertest";
import app from "../src/app";
import { prisma } from "../src/config/db";
import bcrypt from "bcrypt";

const studentEmail = `student-${Date.now()}@smart-campus.test`;
const adminEmail = `admin-${Date.now()}@smart-campus.test`;
const password = "motdepasse123";

let studentToken: string;
let adminToken: string;

describe("Contrôle d'accès par rôle (RBAC)", () => {
  beforeAll(async () => {

    const studentRes = await request(app).post("/api/auth/register").send({
      email: studentEmail,
      password,
      firstName: "Étudiant",
      lastName: "Test",
    });
    studentToken = studentRes.body.token;

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        firstName: "Admin",
        lastName: "Test",
        role: "ADMIN",
      },
    });

    const adminRes = await request(app).post("/api/auth/login").send({ email: adminEmail, password });
    adminToken = adminRes.body.token;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { in: [studentEmail, adminEmail] } } });
    await prisma.$disconnect();
  });

  it("refuse l'accès sans token (401)", async () => {
    const res = await request(app).get("/api/admin/ping");
    expect(res.status).toBe(401);
  });

  it("refuse l'accès à un utilisateur STUDENT (403)", async () => {
    const res = await request(app).get("/api/admin/ping").set("Authorization", `Bearer ${studentToken}`);
    expect(res.status).toBe(403);
  });

  it("autorise l'accès à un utilisateur ADMIN (200)", async () => {
    const res = await request(app).get("/api/admin/ping").set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  it("refuse un token invalide (401)", async () => {
    const res = await request(app).get("/api/admin/ping").set("Authorization", "Bearer token-invalide");
    expect(res.status).toBe(401);
  });
});
