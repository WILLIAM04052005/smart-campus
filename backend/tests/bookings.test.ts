import request from "supertest";
import app from "../src/app";
import { prisma } from "../src/config/db";
import bcrypt from "bcrypt";

const adminEmail = `admin-booking-${Date.now()}@smart-campus.test`;
const password = "motdepasse123";
let adminToken: string;
let resourceId: string;

describe("Réservations — détection de conflits de créneaux", () => {
  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = await prisma.user.create({
      data: { email: adminEmail, password: hashedPassword, firstName: "Admin", lastName: "Booking", role: "ADMIN" },
    });

    const loginRes = await request(app).post("/api/auth/login").send({ email: adminEmail, password });
    adminToken = loginRes.body.token;

    const resourceRes = await request(app)
      .post("/api/resources")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Salle de test", type: "ROOM" });
    resourceId = resourceRes.body.resource.id;
  });

  afterAll(async () => {
    // La suppression en cascade (onDelete: Cascade dans schema.prisma)
    // nettoie automatiquement les réservations liées à cette ressource.
    await prisma.resource.deleteMany({ where: { id: resourceId } });
    await prisma.user.deleteMany({ where: { email: adminEmail } });
    await prisma.$disconnect();
  });

  const testDate = "2027-01-15"; // date arbitraire dans le futur, sans conflit avec de vraies données

  it("accepte une première réservation sur un créneau libre", async () => {
    const res = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ resourceId, date: testDate, startTime: "09:00", endTime: "11:00" });

    expect(res.status).toBe(201);
  });

  it("refuse une réservation qui chevauche exactement le même créneau (409)", async () => {
    const res = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ resourceId, date: testDate, startTime: "09:00", endTime: "11:00" });

    expect(res.status).toBe(409);
  });

  it("refuse une réservation qui chevauche partiellement (409)", async () => {
    // 10h-12h chevauche la réservation existante de 9h-11h entre 10h et 11h
    const res = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ resourceId, date: testDate, startTime: "10:00", endTime: "12:00" });

    expect(res.status).toBe(409);
  });

  it("accepte une réservation sur un créneau adjacent, sans chevauchement", async () => {
    // 11h-12h commence exactement quand l'autre se termine : pas de chevauchement
    const res = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ resourceId, date: testDate, startTime: "11:00", endTime: "12:00" });

    expect(res.status).toBe(201);
  });

  it("refuse si l'heure de fin précède l'heure de début (400)", async () => {
    const res = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ resourceId, date: testDate, startTime: "15:00", endTime: "14:00" });

    expect(res.status).toBe(400);
  });
});
