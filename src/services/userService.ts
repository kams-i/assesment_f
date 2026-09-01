import { apiRequest } from "@/src/lib/api";

export async function getUserProfile() {
  return await apiRequest("/user/profile");
}

export async function updateUserProfile(profileData: any) {
  return await apiRequest("/user/profile", {
    method: "PUT",
    body: profileData instanceof FormData ? profileData : JSON.stringify(profileData),
  });
}