const API_BASE_URL = "http://localhost:4000/api";

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
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
