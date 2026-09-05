import { useEffect, useState } from "react";
import { apiRequest } from "../api/client";
import { useAuth } from "../context/AuthContext";

interface Resource {
  id: string;
  name: string;
  type: "ROOM" | "EQUIPMENT";
  capacity: number | null;
}

interface Booking {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string | null;
  resource: { name: string; type: string };
  user: { firstName: string; lastName: string };
  userId?: string;
}

export default function ResourceBooking() {
  const { user, token } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [resourceId, setResourceId] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [purpose, setPurpose] = useState("");

  // Formulaire admin d'ajout de ressource
  const [newResourceName, setNewResourceName] = useState("");
  const [newResourceType, setNewResourceType] = useState<"ROOM" | "EQUIPMENT">("ROOM");

  async function loadResources() {
    const res = await apiRequest<{ resources: Resource[] }>("/resources", { token });
    setResources(res.resources);
  }

  async function loadBookings() {
    if (!resourceId || !date) {
      setBookings([]);
      return;
    }
    const res = await apiRequest<{ bookings: Booking[] }>(`/bookings?resourceId=${resourceId}&date=${date}`, { token });
    setBookings(res.bookings);
  }

  useEffect(() => {
    loadResources();
  }, []);

  useEffect(() => {
    loadBookings();
  }, [resourceId, date]);

  async function handleBook(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await apiRequest("/bookings", {
        method: "POST",
        token,
        body: { resourceId, date, startTime, endTime, purpose },
      });
      setStartTime("");
      setEndTime("");
      setPurpose("");
      loadBookings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la réservation.");
    }
  }

  async function cancelBooking(id: string) {
    await apiRequest(`/bookings/${id}`, { method: "DELETE", token });
    loadBookings();
  }

  async function createResource(e: React.FormEvent) {
    e.preventDefault();
    await apiRequest("/resources", { method: "POST", token, body: { name: newResourceName, type: newResourceType } });
    setNewResourceName("");
    loadResources();
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 text-slate-100 space-y-6">
      <h2 className="text-xl font-bold">Réservation de ressources</h2>

      {user?.role === "ADMIN" && (
        <form onSubmit={createResource} className="bg-slate-800 p-4 rounded-lg flex gap-2">
          <input
            placeholder="Nom (ex: Salle B12)"
            required
            value={newResourceName}
            onChange={(e) => setNewResourceName(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm"
          />
          <select
            value={newResourceType}
            onChange={(e) => setNewResourceType(e.target.value as "ROOM" | "EQUIPMENT")}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm"
          >
            <option value="ROOM">Salle</option>
            <option value="EQUIPMENT">Matériel</option>
          </select>
          <button className="bg-emerald-500 text-slate-900 font-semibold px-4 rounded-lg text-sm">Ajouter</button>
        </form>
      )}

      <div className="flex gap-2">
        <select
          value={resourceId}
          onChange={(e) => setResourceId(e.target.value)}
          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Choisir une ressource...</option>
          {resources.map((r) => (
            <option key={r.id} value={r.id}>{r.name} ({r.type === "ROOM" ? "Salle" : "Matériel"})</option>
          ))}
        </select>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm"
        />
      </div>

      {resourceId && date && (
        <>
          <div>
            <h3 className="font-semibold text-sm mb-2">Créneaux déjà réservés ce jour-là</h3>
            {bookings.length === 0 ? (
              <p className="text-slate-500 text-sm">Aucun — la ressource est libre toute la journée.</p>
            ) : (
              <ul className="space-y-1">
                {bookings.map((b) => (
                  <li key={b.id} className="flex justify-between items-center bg-slate-800 rounded-lg px-3 py-2 text-sm">
                    <span>
                      {b.startTime}–{b.endTime} · {b.user.firstName} {b.user.lastName}
                      {b.purpose ? ` (${b.purpose})` : ""}
                    </span>
                    <button onClick={() => cancelBooking(b.id)} className="text-red-400 text-xs hover:underline">
                      Annuler
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <form onSubmit={handleBook} className="bg-slate-800 p-4 rounded-lg flex flex-col gap-2">
            <h3 className="font-semibold text-sm">Réserver un créneau</h3>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="flex gap-2">
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <input
              placeholder="Motif (optionnel)"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm"
            />
            <button className="bg-emerald-500 text-slate-900 font-semibold rounded-lg py-2 text-sm">
              Réserver
            </button>
          </form>
        </>
      )}
    </div>
  );
}
