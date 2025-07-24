import axios from "axios";

const PROXY_URL = "https://proxy-api-server-f1an.onrender.com";

// Generic helper for GET requests to TMDB via your proxy
export async function proxyGet<T>(path: string, params?: Record<string, any>): Promise<T> {
  const url = new URL(PROXY_URL + path);

  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, String(v)));
  }

  const res = await axios.get<T>(url.toString());
  return res.data;
}
