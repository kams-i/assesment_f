import { apiRequest } from "@/src/lib/api";

export async function followUser(userId: string | number) {
  return await apiRequest(`/user/${userId}/follow`, {
    method: "POST",
  });
}

export async function unfollowUser(userId: string | number) {
  return await apiRequest(`/user/${userId}/unfollow`, {
    method: "DELETE",
  });
}

export async function fetchFollowers(userId: string | number) {
  const data = await apiRequest(`/user/${userId}/followers`);
  if (Array.isArray(data)) return data;
  return data.followers || data.data || data;
}

export async function fetchFollowing(userId: string | number) {
  const data = await apiRequest(`/user/${userId}/following`);
  if (Array.isArray(data)) return data;
  return data.following || data.data || data;
}