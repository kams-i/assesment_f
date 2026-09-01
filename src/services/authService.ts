import { apiRequest } from "@/src/lib/api";

export async function loginUser(credentials: { email: string; password?: string }) {
  const data = await apiRequest("/auth/signin", {
    method: "POST",
    body: JSON.stringify(credentials),
  });

  if (data.accessToken) {
    localStorage.setItem("accessToken", data.accessToken);
  }
  if (data.refreshToken) {
    localStorage.setItem("refreshToken", data.refreshToken);
  }

  return data;
}

export async function signupUser(payload: { email: string; password: string; [key: string]: any }) {
  return await apiRequest("/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function requestAdminOtp(email: string) {
  return await apiRequest("/auth/request-otp", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function verifyAdminOtp(email: string, otp: string) {
  return await apiRequest("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify({ email, otp }),
  });
}