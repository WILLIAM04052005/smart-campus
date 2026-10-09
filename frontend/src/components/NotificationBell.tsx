import { useEffect, useState } from "react";
import { apiRequest } from "../api/client";
import { useAuth } from "../context/AuthContext";

interface Notification {
  id: string;
  message: string;
  type: "ABSENCE" | "GRADE" | "ANNOUNCEMENT";
  read: boolean;
  createdAt: string;
}

const TYPE_ICONS: Record<Notification["type"], string> = {
  ABSENCE: "📅",
  GRADE: "📝",
  ANNOUNCEMENT: "📣",
};

export default function NotificationBell() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  async function load() {
    const res = await apiRequest<{ notifications: Notification[] }>("/notifications", { token });
    setNotifications(res.notifications);
  }

  useEffect(() => {
    load();
    // On rafraîchit périodiquement pour simuler un comportement "quasi
    // temps réel" sans avoir besoin d'une connexion WebSocket, plus
    // complexe à mettre en place pour le bénéfice apporté ici.
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  async function markAsRead(id: string) {
    await apiRequest(`/notifications/${id}`, { method: "PATCH", token, body: { read: true } });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  async function markAllAsRead() {
    await apiRequest("/notifications/read-all/mark", { method: "PATCH", token, body: {} });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative text-slate-300 hover:text-white transition p-2"
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 max-h-96 overflow-y-auto">
          <div className="flex justify-between items-center px-4 py-2 border-b border-slate-700">
            <span className="text-sm font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-xs text-emerald-400 hover:underline">
                Tout marquer comme lu
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className="text-sm text-slate-500 px-4 py-6 text-center">Aucune notification.</p>
          ) : (
            <ul className="divide-y divide-slate-700">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  onClick={() => !n.read && markAsRead(n.id)}
                  className={`px-4 py-3 text-sm cursor-pointer flex gap-2 ${
                    n.read ? "text-slate-400" : "text-slate-100 bg-slate-750"
                  }`}
                >
                  <span>{TYPE_ICONS[n.type]}</span>
                  <div>
                    <p>{n.message}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {new Date(n.createdAt).toLocaleString("fr-FR")}
                    </p>
                  </div>
                  {!n.read && <span className="ml-auto w-2 h-2 rounded-full bg-emerald-400 shrink-0 mt-1" />}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
