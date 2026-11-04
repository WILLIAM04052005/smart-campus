import request from "supertest";
import app from "../src/app";
import { prisma } from "../src/config/db";
import bcrypt from "bcrypt";

const studentEmail = `student-stats-${Date.now()}@smart-campus.test`;
const adminEmail = `admin-stats-${Date.now()}@smart-campus.test`;
const password = "motdepasse123";

let studentToken: string;
let adminToken: string;

describe("Statistiques (GET /api/stats)", () => {
  beforeAll(async () => {
    const studentRes = await request(app).post("/api/auth/register").send({
      email: studentEmail,
      password,
      firstName: "Etudiant",
      lastName: "Stats",
    });
    studentToken = studentRes.body.token;

    await prisma.user.create({
      data: {
        email: adminEmail,
        password: await bcrypt.hash(password, 10),
        firstName: "Admin",
        lastName: "Stats",
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
    const res = await request(app).get("/api/stats");
    expect(res.status).toBe(401);
  });

  it("refuse l'accès à un étudiant (403)", async () => {
    const res = await request(app).get("/api/stats").set("Authorization", `Bearer ${studentToken}`);
    expect(res.status).toBe(403);
  });

  it("renvoie les statistiques à un admin, avec la bonne structure (200)", async () => {
    const res = await request(app).get("/api/stats").set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.overview).toBeDefined();
    expect(typeof res.body.overview.students).toBe("number");
    expect(typeof res.body.overview.totalAbsences).toBe("number");
    expect(Array.isArray(res.body.perClass)).toBe(true);
    expect(Array.isArray(res.body.perSubject)).toBe(true);
   
    expect(res.body.overview.students).toBeGreaterThanOrEqual(1);
  });
});
