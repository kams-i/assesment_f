const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v4";

function getStorageValue(key: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(key);
}

export function getToken(): string | null {
  return getStorageValue("accessToken") || getStorageValue("token");
}

export function getRefresh(): string | null {
  return getStorageValue("refreshToken");
}

export function logout(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    window.location.href = "/";
  }
}

export async function refreshToken(): Promise<string> {
  const refreshTokenValue = getRefresh();

  if (!refreshTokenValue) {
    throw new Error("No refresh token available");
  }

  const response = await fetch(`${API_BASE_URL}/auth/refreshtoken`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken: refreshTokenValue }),
  });

  if (!response.ok) {
    logout();
    throw new Error("Session refresh failed");
  }

  const data = await response.json();
  const nextAccessToken = data.accessToken || data.token || data.access_token;

  if (nextAccessToken) {
    localStorage.setItem("accessToken", nextAccessToken);
    localStorage.setItem("token", nextAccessToken);
  }

  return nextAccessToken;
}

export async function apiRequest(path: string, options: RequestInit = {}, retry = false): Promise<any> {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${API_BASE_URL}${cleanPath}`;

  const token = getToken();

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const isPublicAuthRoute = 
    cleanPath.includes("/auth/signin") || 
    cleanPath.includes("/auth/signup") ||
    cleanPath.includes("/auth/request-otp") ||
    cleanPath.includes("/auth/verify-otp") ||
    cleanPath.includes("/auth/refreshtoken");

  if (response.status === 401 && !retry && !isPublicAuthRoute) {
    try {
      await refreshToken();
      return apiRequest(path, options, true);
    } catch (error) {
      throw error;
    }
  }

  if (!response.ok) {
    const text = await response.text();
    let message = "Request failed";

    if (text) {
      try {
        const parsed = JSON.parse(text);
        message = parsed.message || parsed.error || message;
      } catch {
        message = text;
      }
    }

    throw new Error(message);
  }

  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}