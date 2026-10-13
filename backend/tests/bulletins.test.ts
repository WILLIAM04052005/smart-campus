import request from "supertest";
import app from "../src/app";
import { prisma } from "../src/config/db";
import bcrypt from "bcrypt";

const stamp = Date.now();
const emailA = `student-a-${stamp}@smart-campus.test`;
const emailB = `student-b-${stamp}@smart-campus.test`;
const adminEmail = `admin-bulletin-${stamp}@smart-campus.test`;
const password = "motdepasse123";

let tokenA: string;
let idA: string;
let idB: string;
let adminToken: string;

// Supertest ne sait pas lire seul un corps binaire : on récupère les
// octets bruts du PDF pour pouvoir vérifier son contenu.
const binaryParser = (res: any, callback: any) => {
  const chunks: Buffer[] = [];
  res.on("data", (chunk: Buffer) => chunks.push(chunk));
  res.on("end", () => callback(null, Buffer.concat(chunks)));
};

describe("Bulletin PDF (GET /api/bulletins/:studentId)", () => {
  beforeAll(async () => {
    const a = await request(app)
      .post("/api/auth/register")
      .send({ email: emailA, password, firstName: "Alice", lastName: "Bulletin" });
    tokenA = a.body.token;
    idA = a.body.user.id;

    const b = await request(app)
      .post("/api/auth/register")
      .send({ email: emailB, password, firstName: "Bob", lastName: "Bulletin" });
    idB = b.body.user.id;

    await prisma.user.create({
      data: {
        email: adminEmail,
        password: await bcrypt.hash(password, 10),
        firstName: "Admin",
        lastName: "Bulletin",
        role: "ADMIN",
      },
    });
    const adminRes = await request(app).post("/api/auth/login").send({ email: adminEmail, password });
    adminToken = adminRes.body.token;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { in: [emailA, emailB, adminEmail] } } });
    await prisma.$disconnect();
  });

  it("refuse l'accès sans token (401)", async () => {
    const res = await request(app).get(`/api/bulletins/${idA}`);
    expect(res.status).toBe(401);
  });

  it("permet à un étudiant de télécharger son propre bulletin (PDF valide)", async () => {
    const res = await request(app)
      .get(`/api/bulletins/${idA}`)
      .set("Authorization", `Bearer ${tokenA}`)
      .buffer(true)
      .parse(binaryParser);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("application/pdf");
    expect(res.headers["content-disposition"]).toContain("attachment");
    // Tout fichier PDF commence par la signature "%PDF"
    expect((res.body as Buffer).subarray(0, 4).toString()).toBe("%PDF");
  });

  it("refuse à un étudiant le bulletin d'un autre étudiant (403)", async () => {
    const res = await request(app).get(`/api/bulletins/${idB}`).set("Authorization", `Bearer ${tokenA}`);
    expect(res.status).toBe(403);
  });

  it("permet à un admin de télécharger le bulletin de n'importe quel étudiant", async () => {
    const res = await request(app)
      .get(`/api/bulletins/${idB}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .buffer(true)
      .parse(binaryParser);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("application/pdf");
  });

  it("renvoie 404 pour un identifiant d'étudiant inexistant (admin)", async () => {
    const res = await request(app)
      .get("/api/bulletins/00000000-0000-0000-0000-000000000000")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });
});
