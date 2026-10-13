// En local, on utilise localhost. Une fois déployé, la variable
// d'environnement VITE_API_URL (définie sur Vercel) prend le relais et
// pointe vers l'API en ligne (ex: https://smart-campus-api.onrender.com/api).
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string | null;
}

// Petite fonction utilitaire qui centralise tous les appels réseau
// (AJAX) vers le backend : ajoute automatiquement le header
// Authorization quand un token est fourni, gère le JSON et les erreurs.
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, token } = options;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    // On propage le message d'erreur renvoyé par le backend (zod, etc.)
    throw new Error(data?.message || "Une erreur est survenue.");
  }

  return data as T;
}

// Télécharge un fichier protégé (ex : bulletin PDF). Un simple lien <a href>
// ne peut pas être utilisé ici : il n'enverrait pas l'en-tête
// Authorization contenant le token. On récupère donc le fichier via fetch,
// on le transforme en "blob", puis on déclenche le téléchargement
// depuis une URL temporaire locale.
export async function downloadFile(path: string, token: string | null, fallbackName: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message || "Le téléchargement a échoué.");
  }

  // On reprend le nom de fichier proposé par le serveur s'il est présent
  const disposition = response.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="([^"]+)"/);
  const filename = match ? match[1] : fallbackName;

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
